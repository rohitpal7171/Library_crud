// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDdTvh5bbwVTJVRMLmqBaSVcDQBpnRBdPs',
  authDomain: 'shivaay-library-init.firebaseapp.com',
  projectId: 'shivaay-library-init',
  storageBucket: 'shivaay-library-init.firebasestorage.app',
  messagingSenderId: '336727591345',
  appId: '1:336727591345:web:e86a704252c11d74169590',
  // databaseURL: 'add real time database url here',
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
