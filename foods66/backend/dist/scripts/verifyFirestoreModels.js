import { Food } from '../models/Food';
import { User } from '../models/User';
import { Order } from '../models/Order';
import { Coupon } from '../models/Coupon';
import { initFirebase } from '../config/firebase';
async function testFetch() {
    try {
        initFirebase();
        console.log('Testing model queries against live Firebase Firestore...');
        const foodsCount = await Food.countDocuments();
        console.log(`✅ Foods in Firestore: ${foodsCount}`);
        const vegFoods = await Food.find({ category: 'Veg' }).limit(3).lean();
        console.log(`✅ Sample Veg Foods (${vegFoods.length}):`, vegFoods.map((f) => ({ name: f.name, price: f.price })));
        const users = await User.find({}).lean();
        console.log(`✅ Users in Firestore (${users.length}):`, users.map((u) => ({ email: u.email, role: u.role })));
        const coupons = await Coupon.find({}).lean();
        console.log(`✅ Coupons in Firestore (${coupons.length}):`, coupons.map((c) => c.code));
        const orders = await Order.find({}).lean();
        console.log(`✅ Orders in Firestore (${orders.length}):`, orders.map((o) => ({ id: o._id, status: o.status, totalPrice: o.totalPrice })));
        console.log('\n🎉 ALL LIVE FIREBASE FIRESTORE QUERIES PASSED WITH FLYING COLORS!');
        process.exit(0);
    }
    catch (err) {
        console.error('❌ Model query failed:', err);
        process.exit(1);
    }
}
testFetch();
//# sourceMappingURL=verifyFirestoreModels.js.map