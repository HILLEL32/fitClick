
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB0OkEbl7FZNlE7NrF0Gyyzhvv9fBn8aIU",
  authDomain: "fitclick-ce1e7.firebaseapp.com",
  projectId: "fitclick-ce1e7",
  storageBucket: "fitclick-ce1e7.firebasestorage.app",
  messagingSenderId: "923064269329",
  appId: "1:923064269329:web:efa04bf19872c8c628cfb0",
  measurementId: "G-DQ648N8P2P"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Import the functions you need from the SDKs you need



// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";

// const firebaseConfig = {
//   apiKey: "AIzaSyB0OkEbl7FZNlE7NrF0Gyyzhvv9fBn8aIU",
//   authDomain: "fitclick-ce1e7.firebaseapp.com",
//   projectId: "fitclick-ce1e7",
//   storageBucket: "fitclick-ce1e7.firebasestorage.app",
//   messagingSenderId: "923064269329",
//   appId: "1:923064269329:web:efa04bf19872c8c628cfb0",
//   measurementId: "G-DQ648N8P2P"
// };

// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

//..........................................................................
// import { initializeApp } from "firebase/app";

// const firebaseConfig = {
//   apiKey: "AIzaSyBxWr5G4nXGLHin4JAy0sH26hWcMCHqwIQ",
//   authDomain: "fitclick2-a86fe.firebaseapp.com",
//   projectId: "fitclick2-a86fe",
//   storageBucket: "fitclick2-a86fe.firebasestorage.app",
//   messagingSenderId: "901916011617",
//   appId: "1:901916011617:web:28c9e64c9fd7278dcd4e20"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);