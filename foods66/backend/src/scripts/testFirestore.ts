import { getFirestore, initFirebase } from '../config/firebase';

async function testConnection() {
  try {
    initFirebase();
    const db = getFirestore();
    console.log('Testing Firestore write & read...');
    const testDoc = db.collection('_health').doc('connection_test');
    await testDoc.set({
      connected: true,
      timestamp: new Date().toISOString(),
      service: 'foods66-backend',
    });
    console.log('✅ Write successful!');
    
    const snap = await testDoc.get();
    console.log('✅ Read successful! Data:', snap.data());
    
    // Clean up
    await testDoc.delete();
    console.log('✅ Delete successful! Firebase Firestore is 100% active and live!');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Firestore test failed:', err);
    process.exit(1);
  }
}

testConnection();
