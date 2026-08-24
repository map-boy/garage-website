const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./garage-management-6f1eb-firebase-adminsdk-fbsvc-79e6282ea3.json');

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function main() {
  const uid = 'cbSnkjiIeMcXzX1jsDX0jknp11q2';
  const doc = await db.collection('users').doc(uid).get();
  if (!doc.exists) {
    console.log('No user document found for uid:', uid);
    return;
  }
  console.log('User doc data:', JSON.stringify(doc.data(), null, 2));
}

main().catch(console.error);
