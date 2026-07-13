importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
const firebaseConfig = {
  apiKey: "AIzaSyAou8DncAycet0szrR6VJ1HdI-0v5jsyrE",
  authDomain: "b2b-supplier-portal-7a127.firebaseapp.com",
  projectId: "b2b-supplier-portal-7a127",
  storageBucket: "b2b-supplier-portal-7a127.firebasestorage.app",
  messagingSenderId: "273852892018",
  appId: "1:273852892018:web:16db07dd631b4f5e4593eb",
  measurementId: "G-KTV8N8K0SJ"
};

try {
  firebase.initializeApp(firebaseConfig);
  // Retrieve an instance of Firebase Messaging so that it can handle background messages.
  const messaging = firebase.messaging();
  
  // Note: We do not need a custom onBackgroundMessage here because the backend sends 
  // the `notification` payload (title/body). Firebase automatically intercepts this 
  // and displays a system notification when the app is in the background or closed!
} catch (e) {
  console.log('Firebase SW config error: ', e);
}
