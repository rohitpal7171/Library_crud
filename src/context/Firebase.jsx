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
} from 'firebase/firestore';

const FirebaseContext = createContext(null);
const firebaseRealtimeDatabase = getDatabase(firebaseApp); // we haven't add database url in firebase config yet. so it will not work currently.
const firebaseAuth = getAuth(firebaseApp);
const firebaseCloudFirestore = getFirestore(firebaseApp);

const googleProvider = new GoogleAuthProvider();

export const useFirebase = () => useContext(FirebaseContext);

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
      const results = await addDoc(subColRef, data);
      return { id: results.id };
    } catch (err) {
      console.error('addDocumentToSubcollection error', err);
      return { error: err };
    }
  }, []);

  // cloud Database - to add document with data in collection
  const createDataInFireStore = useCallback(
    async (collectionName = 'students', data) => {
      try {
        const { monthlyBilling, ...restData } = data;
        const modifiedData = {
          ...restData,
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
          createdAt: serverTimestamp(),
          modifiedAt: serverTimestamp(),
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

  // cloud Database - get documents by query
  // const getDocumentsBySimpleQuery = useCallback(
  //   async (collectionName = 'students', field, opStr, value) => {
  //     try {
  //       const collectionRef = collection(firebaseCloudFirestore, collectionName);
  //       const q = query(collectionRef, where(field, opStr, value));
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

  const getDocumentsByQuery = useCallback(
    async ({
      collectionName = 'students',
      filters = null, // accepts object, tuple, array of either
      orderField = 'modifiedAt',
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
        const docs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

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

  /**
   * options:
   *  collectionName: string
   *  filters: Array<{ field, opStr, value }>
   *  search: { field, value } // prefix search, optional
   *  pageNumber: 1-based integer
   *  pageSize: integer
   *  orderField: 'modifiedAt' | 'createdAt' (string)
   *  orderDirection: 'asc' | 'desc'
   *  pageCursorMap: Map<number, DocumentSnapshot> // (in-memory map you pass in & keep)
   */
  const getDocumentsByPagination = useCallback(async (options = {}) => {
    const {
      collectionName = 'students',
      filters = [],
      search = null,
      pageNumber = 1,
      pageSize = 20,
      orderField = 'modifiedAt',
      orderDirection = 'desc',
      pageCursorMap = new Map(),
    } = options;

    if (pageNumber < 1) {
      return { error: new Error('pageNumber must be >= 1') };
    }

    try {
      const colRef = collection(firebaseCloudFirestore, collectionName);

      // Build base constraints factory
      const buildQuery = (startAfterSnapshot = null) => {
        const constraints = [];

        // filters
        if (Array.isArray(filters) && filters.length) {
          for (const f of filters) {
            constraints.push(where(f.field, f.opStr, f.value));
          }
        }

        // simple prefix search
        // IMPORTANT: if you use range filters on search.field, you must order by that field first
        let effectiveOrderings = [];
        if (search && search.field && typeof search.value === 'string' && search.value.length > 0) {
          const val = search.value;
          constraints.push(where(search.field, '>=', val));
          constraints.push(where(search.field, '<=', val + '\uf8ff'));

          // ensure we order by the search field first (to satisfy Firestore rules)
          effectiveOrderings.push({ field: search.field, dir: orderDirection });
        }

        // then add the requested orderField (tie-breaker)
        if (!effectiveOrderings.find((o) => o.field === orderField)) {
          effectiveOrderings.push({ field: orderField, dir: orderDirection });
        }

        // always add doc id ordering as final tie-breaker
        effectiveOrderings.push({ field: '__name__', dir: 'asc' });

        for (const o of effectiveOrderings) {
          constraints.push(orderBy(o.field, o.dir));
        }

        // Limit to pageSize
        constraints.push(limit(pageSize));

        if (startAfterSnapshot) constraints.push(startAfter(startAfterSnapshot));

        // debug: print the constraints in a readable way
        console.debug('Firestore query build:', {
          collectionName,
          filters,
          search,
          pageNumber,
          pageSize,
          effectiveOrderings,
          hasStartAfter: !!startAfterSnapshot,
        });

        return query(colRef, ...constraints);
      };

      // Helper to strip __snap before returning
      const stripSnap = (docs) =>
        docs.map((d) => {
          const c = { ...d };
          delete c.__snap;
          return c;
        });

      // PAGE 1 fast path
      if (pageNumber === 1) {
        const q = buildQuery(null);
        const snap = await getDocs(q);
        const docs = [];
        snap.forEach((d) => docs.push({ id: d.id, ...d.data(), __snap: d }));
        if (docs.length) pageCursorMap.set(1, docs[docs.length - 1].__snap);
        return {
          data: stripSnap(docs),
          pageCursorMap,
          fetched: docs.length,
          totalPageFetched: 1,
        };
      }

      // If we have a cached cursor for pageNumber - 1, start after it
      if (pageCursorMap.has(pageNumber - 1)) {
        const startAfterSnap = pageCursorMap.get(pageNumber - 1);
        const q = buildQuery(startAfterSnap);
        const snap = await getDocs(q);
        const docs = [];
        snap.forEach((d) => docs.push({ id: d.id, ...d.data(), __snap: d }));
        if (docs.length) pageCursorMap.set(pageNumber, docs[docs.length - 1].__snap);
        return {
          data: stripSnap(docs),
          pageCursorMap,
          fetched: docs.length,
        };
      }

      // No cached cursor for previous pages: fetch sequentially and cache cursors
      let lastSnapshot = null;
      let fetched = 0;
      for (let p = 1; p <= pageNumber; p++) {
        if (pageCursorMap.has(p)) {
          lastSnapshot = pageCursorMap.get(p);
          continue;
        }

        const q = buildQuery(lastSnapshot);
        const snap = await getDocs(q);
        const docs = [];
        snap.forEach((d) => docs.push({ id: d.id, ...d.data(), __snap: d }));
        fetched = docs.length;

        if (docs.length) {
          lastSnapshot = docs[docs.length - 1].__snap;
          pageCursorMap.set(p, lastSnapshot);
        } else {
          // no more docs; break early
          break;
        }

        if (p === pageNumber) {
          return {
            data: stripSnap(docs),
            pageCursorMap,
            fetched: docs.length,
          };
        }
      }

      return { data: [], pageCursorMap, fetched: 0 };
    } catch (err) {
      // better error visibility
      console.error('getDocumentsByQuery error', err);
      return { error: err };
    }
  }, []);

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
  const deleteDocumentById = useCallback(async (collectionName = 'students', docId) => {
    try {
      if (!docId) throw new Error('Document ID is required for deletion.');

      //Reference to the tracking document
      const trackingDocRef = doc(firebaseCloudFirestore, 'willDeleteLaterInCloudinary', 'log');

      // Ensure the tracking document exists (or create it)
      const trackingDocSnap = await getDoc(trackingDocRef);
      if (!trackingDocSnap.exists()) {
        await setDoc(trackingDocRef, { folders: [] });
      }

      //Push the docId into folders array
      await updateDoc(trackingDocRef, {
        folders: arrayUnion(docId),
      });

      // Delete the original document
      const docRef = doc(firebaseCloudFirestore, collectionName, docId);
      await deleteDoc(docRef);

      return { success: true, id: docId };
    } catch (err) {
      console.error('deleteDocument error', err);
      return { error: err };
    }
  }, []);

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
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      return { user: result.user, credential: result.credential };
    } catch (err) {
      console.error('signInWithGoogle error', err);
      return { error: err };
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

/*
USAGE EXAMPLES (how to call these from anywhere after wrapping app with FirebaseProvider):


// Firestore add
const { addDocument } = useFirebase();
const res = await addDocument('students', { name: 'Shivaay', age: 12 });
if (res.error) { /* handle error * / }
console.log('new id', res.id);


// Firestore get by id
const { getDocumentById } = useFirebase();
const r = await getDocumentById('students', 'docId123');
console.log(r.data);


// Realtime set
const { setDataAtPath } = useFirebase();
await setDataAtPath('students/123/profile', { foo: 'bar' });


// Realtime subscribe
const { subscribeToPath } = useFirebase();
const unsubscribe = subscribeToPath('students/123', (data) => console.log('live', data));
// later: unsubscribe();


// Auth
const { firebaseSignInUserWithEmailAndPassword } = useFirebase();
const signInRes = await firebaseSignInUserWithEmailAndPassword(email, password);
if (signInRes.error) { /* show error to user * / }
*/
