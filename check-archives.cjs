const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./garage-management-6f1eb-firebase-adminsdk-fbsvc-79e6282ea3.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
  const garageId = 'Hc6ZDY56FKR2qeIweRoVYSTDTXj1';
  const snap = await db.collection('garages').doc(garageId).collection('archives').get();
  console.log('Archive doc count:', snap.size);
  snap.forEach(d => console.log(' -', d.id));
}

main().catch(console.error);
