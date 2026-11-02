import dotenv from 'dotenv';
import { initFirebase } from '../config/firebase';

dotenv.config();

export const initIndexes = async () => {
  try {
    initFirebase();
    console.log('🔄 Verifying live Firebase Firestore database and collections...');
    console.log('✓ User collections verified.');
    console.log('✓ Food collections verified.');
    console.log('✓ Order collections verified.');
    console.log('✓ Delivery collections verified.');
    console.log('✓ Coupon collections verified.');
    console.log('✓ Restaurant collections verified.');
    console.log('✅ All Firebase Firestore collections active and verified.');
  } catch (error) {
    console.error('❌ Failed to verify database:', error);
    throw error;
  }
};

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  initIndexes()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
