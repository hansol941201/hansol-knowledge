const hansolFirebaseConfig = {
  apiKey: 'AIzaSyC2B-J6Tal9sVtzlJmzGsEbZ_2J81fTDBs',
  authDomain: 'hansol-knowledge-941201.firebaseapp.com',
  projectId: 'hansol-knowledge-941201',
  storageBucket: 'hansol-knowledge-941201.firebasestorage.app',
  messagingSenderId: '1017840177845',
  appId: '1:1017840177845:web:822e4c739f88261d72e4fc'
};

try {
  firebase.initializeApp(hansolFirebaseConfig);
  window.HANSOL_AUTH = firebase.auth();
  window.HANSOL_FIRESTORE = firebase.firestore();
} catch (error) {
  console.error('Firebase 초기화 실패', error);
  window.HANSOL_AUTH = null;
  window.HANSOL_FIRESTORE = null;
}
