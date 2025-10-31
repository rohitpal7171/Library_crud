/* eslint-disable no-unused-vars */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { firebaseApp } from './../database/firebase/firebase';
import { getDatabase, set, ref, get, child, onValue, off } from 'firebase/database';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  updateDoc,
  orderBy,
  limit,
  startAfter,
  deleteDoc,
  serverTimestamp,
  setDoc,
  arrayUnion,
  writeBatch,
  runTransaction,
} from 'firebase/firestore';

const FirebaseContext = createContext(null);
const firebaseRealtimeDatabase = getDatabase(firebaseApp); // we haven't add database url in firebase config yet. so it will not work currently.
const firebaseAuth = getAuth(firebaseApp);
const firebaseCloudFirestore = getFirestore(firebaseApp);

const googleProvider = new GoogleAuthProvider();

const allowedEmails = ['rohit.pal7171@gmail.com', 'shivaaylibrary98@gmail.com'];

export const useFirebase = () => useContext(FirebaseContext);

const HUMAN_ID_PREFIX = 'SHY_';
const INITIAL_HUMAN_ID_WIDTH = 4;

export const FirebaseProvider = (props) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Subscribe once to auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(
      firebaseAuth,
      (user) => {
        setUser(user);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setUser(null);
        setLoading(false);
      }
    );
    return unsub; // cleanup on unmount
  }, []);

  // ----------------- Firestore Database Generic Helpers ----------------------------------------------------------------

  // cloud Database - to add document with data in subcollection
  const makeSubCollectionInFireStore = useCallback(async (parentPath, subcollectionName, data) => {
    try {
      // parentPath split into collection and doc id
      const [parentCollection, parentId] = parentPath.split('/');
      if (!parentCollection || !parentId) return { error: new Error('Invalid parentPath') };
      const subColRef = collection(
        firebaseCloudFirestore,
        `${parentCollection}/${parentId}/${subcollectionName}`
      );
      const modifiedData = {
        ...data,
        createdAt: serverTimestamp(),
        modifiedAt: serverTimestamp(),
      };
      const results = await addDoc(subColRef, modifiedData);
      return { id: results.id };
    } catch (err) {
      console.error('addDocumentToSubcollection error', err);
      return { error: err };
    }
  }, []);

  const editSubCollectionInFireStore = useCallback(
    async (parentPath, subcollectionName, docId, data) => {
      try {
        // parentPath split into collection and doc id
        const [parentCollection, parentId] = parentPath.split('/');
        if (!parentCollection || !parentId || !docId) {
          return { error: new Error('Invalid arguments') };
        }

        const docRef = doc(
          firebaseCloudFirestore,
          `${parentCollection}/${parentId}/${subcollectionName}/${docId}`
        );

        const modifiedData = {
          ...data,
          modifiedAt: serverTimestamp(),
        };

        await updateDoc(docRef, modifiedData);
        return { id: docId };
      } catch (err) {
        console.error('updateDocumentInSubcollection error', err);
        return { error: err };
      }
    },
    []
  );

  async function getNextHumanId(db, sequenceKey) {
    const seqRef = doc(db, 'sequences', sequenceKey);

    const humanId = await runTransaction(db, async (tx) => {
      const snap = await tx.get(seqRef);
      const seq = snap.exists() ? snap.data() : {};
      const next = seq.next || 1;
      const width = seq.width || INITIAL_HUMAN_ID_WIDTH;

      // Build the display ID, e.g. SHY_0001
      const id = `${HUMAN_ID_PREFIX}${String(next).padStart(width, '0')}`;

      // If crossing current width (e.g., 9999 -> 10000), bump stored width
      const nextWidth = next >= Math.pow(10, width) ? width + 1 : width;

      tx.set(
        seqRef,
        {
          next: next + 1,
          width: nextWidth,
          prefix: HUMAN_ID_PREFIX,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      return id;
    });

    return humanId;
  }

  // cloud Database - to add document with data in collection
  const createDataInFireStore = useCallback(
    async (collectionName = 'students', data) => {
      try {
        const { monthlyBilling, ...restData } = data;

        const humanId = await getNextHumanId(firebaseCloudFirestore, collectionName);
        const modifiedData = {
          ...restData,
          humanId: humanId,
          createdAt: serverTimestamp(),
          modifiedAt: serverTimestamp(),
        };
        // If aadhaar is present — run a query to check uniqueness
        if (data?.aadhaarNumber) {
          const q = query(
            collection(firebaseCloudFirestore, collectionName),
            where('aadhaarNumber', '==', data?.aadhaarNumber)
          );
          const snap = await getDocs(q);
          if (snap.docs.length > 0) {
            // found at least one document with this aadhaar -> refuse
            throw new Error('A student with this Aadhaar number already exists.');
          }
        }
        const results = await addDoc(
          collection(firebaseCloudFirestore, collectionName),
          modifiedData
        );

        // create monthly billing subcollection
        await makeSubCollectionInFireStore(`${collectionName}/${results.id}`, 'monthlyBilling', {
          ...monthlyBilling,
          studentId: results.id,
        });
        return { data: results };
      } catch (err) {
        console.error('addDocument error', err);
        throw err;
      }
    },
    [makeSubCollectionInFireStore]
  );

  // cloud Database - to get single document by id
  const getDocumentById = useCallback(async (collectionName = 'students', docId) => {
    try {
      const docRef = doc(firebaseCloudFirestore, collectionName, docId);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return { data: null };
      return { data: snapshot.data(), id: snapshot.id };
    } catch (err) {
      console.error('getDocumentById error', err);
      return { error: err };
    }
  }, []);

  // cloud Database - get admin document
  const getAdminData = async () => {
    try {
      const adminRef = collection(firebaseCloudFirestore, 'admin');
      const snapshot = await getDocs(adminRef);

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error fetching admin data:', error);
      return null;
    }
  };

  // const getDocumentsByQuery = useCallback(
  //   async (
  //     collectionName = 'students',
  //     // Accept either:
  //     //  - a single filter tuple: ['age', '>=', 18]
  //     //  - an array of such tuples: [['age','>=',18], ['status','==','active']]
  //     //  - null/undefined -> no filters (get all docs)
  //     filters = null
  //   ) => {
  //     try {
  //       const collectionRef = collection(firebaseCloudFirestore, collectionName);

  //       // Normalize filters into an array of tuples
  //       const normalizedFilters = !filters
  //         ? []
  //         : Array.isArray(filters) && Array.isArray(filters[0])
  //         ? filters // already array of tuples
  //         : [filters]; // single tuple passed

  //       // Build query only if there are filters
  //       const q = normalizedFilters.length
  //         ? query(
  //             collectionRef,
  //             ...normalizedFilters.map(([field, opStr, value]) => where(field, opStr, value))
  //           )
  //         : query(collectionRef); // or just collectionRef (query(collectionRef) is fine)

  //       const snapshot = await getDocs(q);
  //       const docs = [];
  //       snapshot.forEach((docSnap) => {
  //         docs.push({ id: docSnap.id, ...docSnap.data() });
  //       });
  //       return { data: docs };
  //     } catch (err) {
  //       console.error('queryDocuments error', err);
  //       return { error: err };
  //     }
  //   },
  //   []
  // );

  // Helper to fetch latest monthlyBilling doc for a student
  const getLatestMonthlyBilling = async (studentId, collectionName = 'students') => {
    const basePath = `${collectionName}/${studentId}/monthlyBilling`;
    const colRef = collection(firebaseCloudFirestore, basePath);

    try {
      // Fallback to createdAt desc
      const q2 = query(colRef, orderBy('createdAt', 'desc'), limit(1));
      const s2 = await getDocs(q2);
      if (!s2.empty) return { id: s2.docs[0].id, ...s2.docs[0].data() };
    } catch (_) {
      console.log('failed to fetch latest monthly billing doc for studentId:', studentId);
    }

    // Last fallback — grab any one doc
    try {
      const s3 = await getDocs(query(colRef, limit(1)));
      if (!s3.empty) return { id: s3.docs[0].id, ...s3.docs[0].data() };
    } catch (_) {
      console.log('failed to fetch any monthly billing doc for studentId:', studentId);
    }

    return null;
  };

  const getDocumentsByQuery = useCallback(
    async ({
      collectionName = 'students',
      filters = null, // accepts object, tuple, array of either
      orderField = 'createdAt',
      orderDirection = 'desc',
      pageSize = 1000,
      lastVisible = null,
    } = {}) => {
      try {
        const collectionRef = collection(firebaseCloudFirestore, collectionName);

        // If caller passed `{ filters: {...} }` by mistake, unwrap it
        if (filters && typeof filters === 'object' && 'filters' in filters) {
          filters = filters.filters;
        }

        // Normalize to array of tuples [field, operator, value]
        const toTuple = (f) => {
          if (Array.isArray(f)) return f;
          if (f && typeof f === 'object') {
            return [f.field, f.operator || '==', f.value];
          }
          return [undefined, undefined, undefined]; // will be caught by validator
        };

        const filterTuples =
          filters == null ? [] : Array.isArray(filters) ? filters.map(toTuple) : [toTuple(filters)];

        // Validate before building query (prevents _delegate crash)
        const invalid = filterTuples.find(
          (t) =>
            !Array.isArray(t) ||
            t.length < 3 ||
            typeof t[0] !== 'string' ||
            typeof t[1] !== 'string'
        );
        if (invalid) {
          console.error('Invalid filter provided:', invalid, 'filters:', filters);
          throw new Error(
            "Invalid filter: expected ['field','==',value] or { field, operator, value }"
          );
        }
        if (!orderField || typeof orderField !== 'string') {
          throw new Error('orderField must be a non-empty string');
        }

        const conditions = filterTuples.map(([f, op, v]) => where(f, op, v));

        const q = query(
          collectionRef,
          ...conditions,
          orderBy(orderField, orderDirection),
          ...(lastVisible ? [startAfter(lastVisible)] : []),
          limit(pageSize)
        );

        const snapshot = await getDocs(q);
        let docs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        // Enrich with latest monthlyBilling doc
        const enriched = await Promise.allSettled(
          docs.map(async (d) => {
            const latestBilling = await getLatestMonthlyBilling(d.id, collectionName);
            return { ...d, monthlyBillingLatest: latestBilling };
          })
        );
        docs = enriched.map((res, i) =>
          res.status === 'fulfilled' ? res.value : { ...docs[i], monthlyBillingLatest: null }
        );

        return {
          data: docs,
          lastVisible: snapshot.docs.length ? snapshot.docs[snapshot.docs.length - 1] : null,
        };
      } catch (err) {
        console.error('queryDocuments error', err);
        return { error: err };
      }
    },
    []
  );

  const getCollectionWithSubcollections = useCallback(
    async ({
      collectionName = 'students',
      subcollections = ['monthlyBilling'],
      orderField = 'createdAt',
      orderDirection = 'desc',
      // Optional override per subcollection: { monthlyBilling: { field: 'createdAt', direction: 'asc' } }
      subcollectionOrder = {},
    } = {}) => {
      try {
        // --- Parent collection (ordered) ---
        const colRef = collection(firebaseCloudFirestore, collectionName);
        let parentQuery = query(colRef, orderBy(orderField, orderDirection));
        const snapshot = await getDocs(parentQuery);

        // Map base docs
        const baseDocs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          _ref: docSnap.ref,
          ...docSnap.data(),
        }));

        if (!subcollections.length) {
          return { data: baseDocs.map(({ _ref, ...rest }) => rest) };
        }

        // Helper: normalize a date-like value to milliseconds for sorting
        const toMillis = (v) => {
          if (!v) return Number.NEGATIVE_INFINITY;
          if (v?.toMillis) return v.toMillis();
          if (v instanceof Date) return v.getTime();
          const t = new Date(v).getTime();
          return isNaN(t) ? Number.NEGATIVE_INFINITY : t;
        };

        const results = await Promise.allSettled(
          baseDocs.map(async (parent) => {
            const subData = {};

            await Promise.all(
              subcollections.map(async (subName) => {
                const { field = orderField, direction = orderDirection } =
                  subcollectionOrder[subName] || {};

                try {
                  const subRef = collection(parent._ref, subName);

                  // Try Firestore-side ordering
                  let subQ = query(subRef, orderBy(field, direction));
                  let subSnap;

                  try {
                    subSnap = await getDocs(subQ);
                    subData[subName] = subSnap.docs.map((d) => ({
                      id: d.id,
                      ...d.data(),
                    }));
                  } catch (orderingErr) {
                    // If Firestore can't order (missing field/index), do client-side sort
                    const rawSnap = await getDocs(subRef);
                    const arr = rawSnap.docs.map((d) => ({
                      id: d.id,
                      ...d.data(),
                    }));

                    subData[subName] = arr.sort((a, b) => {
                      const aT = toMillis(a?.[field]);
                      const bT = toMillis(b?.[field]);
                      return direction === 'desc' ? bT - aT : aT - bT;
                    });
                  }
                } catch (err) {
                  console.error(`Failed to fetch subcollection "${subName}" for ${parent.id}`, err);
                  subData[subName] = [];
                }
              })
            );

            const { _ref, ...rest } = parent;
            return { ...rest, subcollections: subData };
          })
        );

        const data = results.map((r, i) => (r.status === 'fulfilled' ? r.value : baseDocs[i]));
        return { data };
      } catch (error) {
        console.error('getCollectionWithSubcollections error', error);
        return { error };
      }
    },
    []
  );

  const getSubcollectionDocumentsByStudentId = async ({
    parentCollection = 'students',
    studentId,
    subcollectionName,
    orderField = 'createdAt',
    orderDirection = 'desc',
    pageSize = 100,
    lastVisible = null,
  } = {}) => {
    try {
      if (!studentId) throw new Error('studentId is required');
      if (!subcollectionName) throw new Error('subcollectionName is required');

      const subColRef = collection(
        firebaseCloudFirestore,
        `${parentCollection}/${studentId}/${subcollectionName}`
      );

      let qy = query(subColRef, orderBy(orderField, orderDirection), limit(pageSize));
      if (lastVisible) {
        qy = query(
          subColRef,
          orderBy(orderField, orderDirection),
          startAfter(lastVisible),
          limit(pageSize)
        );
      }

      const snap = await getDocs(qy);
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const nextCursor = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;

      return { docs, nextCursor };
    } catch (err) {
      console.error('getSubcollectionDocsByStudent error', err);
      return { error: err };
    }
  };

  // cloud Database - update data
  const updateDocument = useCallback(async (collectionName = 'students', docId, partialData) => {
    try {
      if (partialData?.aadhaarNumber) {
        const q = query(
          collection(firebaseCloudFirestore, collectionName),
          where('aadhaarNumber', '==', partialData.aadhaarNumber)
        );
        const snap = await getDocs(q);

        // If any doc exists with same aadhaar but different id -> conflict
        const conflict = snap.docs.find((d) => d.id !== docId);
        if (conflict) {
          throw new Error('Another student with this Aadhaar number already exists.');
        }
      }
      const documentRef = doc(firebaseCloudFirestore, collectionName, docId);
      await updateDoc(documentRef, {
        ...partialData,
        modifiedAt: serverTimestamp(),
      });
      const updatedSnapshot = await getDoc(documentRef);
      if (!updatedSnapshot.exists()) {
        return { success: false, error: 'Document does not exist after update.' };
      }
      return { success: true, data: { id: updatedSnapshot.id, ...updatedSnapshot.data() } };
    } catch (err) {
      console.error('updateDocument error', err);
      throw new Error(err);
    }
  }, []);

  // cloud Database - delete data
  const BATCH_SIZE = 450; // keep headroom

  async function deleteSubcollection(subcolRef) {
    let lastDoc = null;

    // Page through documents to avoid loading too many at once
    while (true) {
      const q = lastDoc
        ? query(subcolRef, orderBy('__name__'), startAfter(lastDoc), limit(BATCH_SIZE))
        : query(subcolRef, orderBy('__name__'), limit(BATCH_SIZE));

      const snap = await getDocs(q);
      if (snap.empty) break;

      const batch = writeBatch(firebaseCloudFirestore);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();

      lastDoc = snap.docs[snap.docs.length - 1];
    }
  }

  // Main delete function
  const deleteDocumentById = async (collectionName = 'students', docId, options = {}) => {
    try {
      if (!docId) throw new Error('Document ID is required for deletion.');

      const { subcollections = [] } = options;

      // Track deleted doc IDs for Cloudinary cleanup
      const trackingDocRef = doc(firebaseCloudFirestore, 'willDeleteLaterInCloudinary', 'log');
      const trackingDocSnap = await getDoc(trackingDocRef);
      if (!trackingDocSnap.exists()) {
        await setDoc(trackingDocRef, { folders: [] });
      }

      await updateDoc(trackingDocRef, {
        folders: arrayUnion(docId),
      });

      // Delete known subcollections
      const parentRef = doc(firebaseCloudFirestore, collectionName, docId);
      for (const sub of subcollections) {
        const subRef = collection(parentRef, sub);
        await deleteSubcollection(subRef);
      }

      // Finally, delete the parent document
      await deleteDoc(parentRef);
      return { success: true, id: docId };
    } catch (err) {
      console.error('deleteDocument error', err);
      return { error: err };
    }
  };

  // ----------------- Realtime Database Generic Helpers ----------------------------------------------------------------

  // realtime Database

  const putDataInRealtimeDatabase = useCallback(async (path, data) => {
    try {
      await set(ref(firebaseRealtimeDatabase, path), data);
      return { success: true };
    } catch (err) {
      console.error('setDataAtPath error', err);
      return { error: err };
    }
  }, []); // putDataInRealtimeDatabase("students/",{name:"shivaay",age:4})

  // realtime Database
  const getDataFromRealtimeDatabase = () => {
    get(child(ref(firebaseRealtimeDatabase), 'students')).then((snapshot) => {
      console.log('snapshot value', snapshot.val());
    });
  };

  // realtime Database
  const getRealtimeDataWheneverItChanegs = useCallback((path, callback) => {
    const pathRef = ref(firebaseRealtimeDatabase, path);
    const listener = (snapshot) => {
      try {
        callback(snapshot.exists() ? snapshot.val() : null);
      } catch (cbErr) {
        console.error('subscribeToPath callback error', cbErr);
      }
    };
    onValue(pathRef, listener);
    // return an unsubscribe function so the caller can cleanup
    return () => off(pathRef, 'value', listener);
  }, []);

  // ----------------- Auth Helpers --------------------------------------------------------------------------------------

  const signUpUserWithEmailAndPassword = useCallback(async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      return { user: userCredential.user };
    } catch (err) {
      console.error('signUp error', err);
      return { error: err };
    }
  }, []);

  const signInUserWithEmailAndPassword = useCallback(async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      return { user: userCredential.user };
    } catch (err) {
      console.error('signIn error', err);
      return { error: err };
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(firebaseAuth, googleProvider).then((result) => {
        const user = result.user;
        if (!allowedEmails.includes(user.email)) {
          // User is not on the local list, sign them out immediately.
          signOut(firebaseAuth);
          throw new Error('Your email is not authorized for this application.');
        } else {
          // User is on the list, proceed as normal.
          setUser(result.user);
          return { user: result.user, credential: result.credential };
        }
      });
    } catch (err) {
      throw new Error(err?.message ?? 'Your email is not authorized for this application.');
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut(firebaseAuth);
      return { success: true };
    } catch (err) {
      console.error('signOut error', err);
      return { error: err };
    }
  }, []);

  const firebaseContextValues = {
    firebaseOnAuthStateChanged: onAuthStateChanged,
    firebaseUser: user,
    firebaseAuthLoading: loading,
    firebaseAuthError: error,
    firebaseLoggedIn: !!user,
    firebaseSignOut: handleSignOut,
    firebaseSignUpUserWithEmailAndPassword: signUpUserWithEmailAndPassword,
    firebaseSignInUserWithEmailAndPassword: signInUserWithEmailAndPassword,
    firebaseSignInWithGoogle: signInWithGoogle,
    firebaseGetAdminData: getAdminData,

    // Firestore generics
    createDataInFireStore,
    makeSubCollectionInFireStore,
    getDocumentById,
    getDocumentsByQuery,
    updateDocument,
    deleteDocumentById,
    getSubcollectionDocumentsByStudentId,
    getCollectionWithSubcollections,
    editSubCollectionInFireStore,

    // Realtime DB generics
    putDataInRealtimeDatabase,
    getDataFromRealtimeDatabase,
    getRealtimeDataWheneverItChanegs,
  };

  return (
    <FirebaseContext.Provider value={firebaseContextValues}>
      {props.children}
    </FirebaseContext.Provider>
  );
};
