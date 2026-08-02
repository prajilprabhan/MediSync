// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; 
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.APIKEY,
  authDomain: import.meta.AUTHDOMAIN,
  projectId: import.meta.PROJECTID,
  storageBucket: import.meta.STORAGEBUCKET,
  messagingSenderId: import.meta.MESSAGINGSENDERID,
  appId: import.meta.APPID,
  measurementId: import.meta.MEASUREMENTID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export Auth
export const auth = getAuth(app);

// Export app if needed elsewhere

export default app