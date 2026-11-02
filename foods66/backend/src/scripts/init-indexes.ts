import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import { User } from '../models/User';
import { Food } from '../models/Food';
import { Order } from '../models/Order';
import { Delivery } from '../models/Delivery';
import { Coupon } from '../models/Coupon';
import { Restaurant } from '../models/Restaurant';

dotenv.config();

export const initIndexes = async () => {
  try {
    await connectDB();
    console.log('🔄 Syncing MongoDB Indexes for all enterprise models...');
    
    await User.syncIndexes();
    console.log('✓ User indexes synced.');
    
    await Food.syncIndexes();
    console.log('✓ Food indexes synced.');
    
    await Order.syncIndexes();
    console.log('✓ Order indexes synced.');

    await Delivery.syncIndexes();
    console.log('✓ Delivery indexes synced.');

    await Coupon.syncIndexes();
    console.log('✓ Coupon indexes synced.');

    await Restaurant.syncIndexes();
    console.log('✓ Restaurant indexes synced.');
    
    console.log('✅ All enterprise indexes synchronized successfully.');
  } catch (error) {
    console.error('❌ Failed to sync indexes:', error);
    throw error;
  }
};

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  initIndexes()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
