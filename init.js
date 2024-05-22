// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBo1uyq8UhGwa-SenwM3FFywTxkvUBHwmI",
  authDomain: "video-call-99634.firebaseapp.com",
  projectId: "video-call-99634",
  storageBucket: "video-call-99634.appspot.com",
  messagingSenderId: "43442346135",
  appId: "1:43442346135:web:17b5ef93c983ba6850f1d2",
  measurementId: "G-38ZPFZQDG1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);