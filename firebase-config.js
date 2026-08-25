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
  // 인터넷이 끊겨도 읽기/쓰기가 로컬에 남아 있다가 다시 연결되면 자동으로 올라간다.
  window.HANSOL_FIRESTORE.enablePersistence({ synchronizeTabs: true })
    .catch(error => console.warn('Firestore 오프라인 저장 사용 불가', error && error.code));
} catch (error) {
  console.error('Firebase 초기화 실패', error);
  window.HANSOL_AUTH = null;
  window.HANSOL_FIRESTORE = null;
}
