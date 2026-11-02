/**
 * Enterprise Database Seed Script
 * Run: npm run seed
 *
 * Populates MongoDB with sample food items, users (admin, customer, driver, restaurant),
 * enterprise coupons, restaurant metadata, and past baseline orders for analytics.
 */
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initFirebase } from '../config/firebase';
import { Food, generateFoodImagePath } from '../models/Food';
import { User } from '../models/User';
import { Coupon } from '../models/Coupon';
import { Restaurant } from '../models/Restaurant';
import { Order } from '../models/Order';
import { Delivery } from '../models/Delivery';
import { deleteCache } from '../services/cacheService';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const allFoodsPath = path.join(__dirname, '../data/allFoods.json');
let allFoodsData = [];
if (fs.existsSync(allFoodsPath)) {
    try {
        allFoodsData = JSON.parse(fs.readFileSync(allFoodsPath, 'utf-8'));
    }
    catch (err) {
        console.warn('Could not parse allFoods.json, falling back to built-in FOODS array.');
    }
}
const FOODS = [
    // ── South Indian ──────────────────────────────────────────
    { name: 'Masala Dosa', category: 'Veg', price: 80, description: 'Crispy rice crepe filled with spiced potato masala.' },
    { name: 'Ghee Roast Dosa', category: 'Veg', price: 100, description: 'Golden crispy dosa roasted in pure ghee, served with chutneys.' },
    { name: 'Plain Idli', category: 'Veg', price: 50, description: 'Soft steamed rice cakes served with sambar and coconut chutney.' },
    { name: 'Mini Idli', category: 'Veg', price: 70, description: 'Bite-sized idlis in ghee with sambar.' },
    { name: 'Medu Vada', category: 'Veg', price: 60, description: 'Crispy lentil fritters served with sambar and chutney.' },
    { name: 'Pongal', category: 'Veg', price: 70, description: 'Comfort rice and dal dish seasoned with pepper and ghee.' },
    { name: 'Rava Upma', category: 'Veg', price: 55, description: 'Semolina porridge with mustard seeds and curry leaves.' },
    { name: 'Curd Rice', category: 'Veg', price: 65, description: 'Chilled rice mixed with creamy yogurt and tempered mustard.' },
    { name: 'Sambar Rice', category: 'Veg', price: 80, description: 'Hot rice mixed with tangy tamarind sambar.' },
    // ── Biryani ────────────────────────────────────────────────
    { name: 'Chicken Biryani', category: 'Non-Veg', price: 180, description: 'Fragrant basmati rice layered with spiced chicken and saffron.' },
    { name: 'Mutton Biryani', category: 'Non-Veg', price: 220, description: 'Slow-cooked tender mutton with aromatic biryani rice.' },
    { name: 'Veg Biryani', category: 'Veg', price: 140, description: 'Fragrant basmati rice with seasonal vegetables and whole spices.' },
    { name: 'Egg Biryani', category: 'Non-Veg', price: 150, description: 'Biryani rice loaded with perfectly boiled masala eggs.' },
    { name: 'Prawn Biryani', category: 'Non-Veg', price: 250, description: 'Coastal-style biryani with juicy prawns and spicy masala.' },
    // ── North Indian ──────────────────────────────────────────
    { name: 'Butter Chicken', category: 'Non-Veg', price: 220, description: 'Tender chicken in rich tomato-butter-cream gravy.' },
    { name: 'Palak Paneer', category: 'Veg', price: 180, description: 'Cottage cheese cubes in smooth spinach gravy.' },
    { name: 'Paneer Butter Masala', category: 'Veg', price: 190, description: 'Soft paneer in buttery tomato-cashew masala.' },
    { name: 'Dal Makhani', category: 'Veg', price: 160, description: 'Slow-cooked black lentils with butter and cream.' },
    { name: 'Chole Bhature', category: 'Veg', price: 130, description: 'Spicy chickpea curry with fluffy deep-fried bread.' },
    { name: 'Pav Bhaji', category: 'Veg', price: 120, description: 'Spiced vegetable mash with buttered pav rolls.' },
    { name: 'Aloo Paratha', category: 'Veg', price: 90, description: 'Whole wheat bread stuffed with spiced potato filling.' },
    { name: 'Naan', category: 'Veg', price: 40, description: 'Soft leavened bread from the tandoor oven.' },
    // ── Non-Veg ────────────────────────────────────────────────
    { name: 'Chicken 65', category: 'Non-Veg', price: 180, description: 'Crispy deep-fried chicken with curry leaves and chillies.' },
    { name: 'Tandoori Chicken', category: 'Non-Veg', price: 280, description: 'Half chicken marinated in yogurt & spices and grilled in tandoor.' },
    { name: 'Chicken Tikka', category: 'Non-Veg', price: 220, description: 'Juicy boneless chicken pieces marinated and char-grilled.' },
    { name: 'Chicken Shawarma', category: 'Non-Veg', price: 140, description: 'Grilled chicken wrap with garlic sauce and veggies.' },
    { name: 'Mutton Curry', category: 'Non-Veg', price: 260, description: 'Slow-cooked mutton in aromatic South Indian masala.' },
    { name: 'Fish Fry', category: 'Non-Veg', price: 200, description: 'Crispy pan-fried fish coated in spiced batter.' },
    { name: 'Prawn Masala', category: 'Non-Veg', price: 280, description: 'Juicy prawns cooked in coastal masala gravy.' },
    { name: 'Egg Curry', category: 'Non-Veg', price: 120, description: 'Hard-boiled eggs in spicy onion-tomato gravy.' },
    { name: 'Chicken Fried Rice', category: 'Non-Veg', price: 160, description: 'Wok-tossed rice with chicken, eggs, and vegetables.' },
    { name: 'Veg Fried Rice', category: 'Veg', price: 130, description: 'Aromatic fried rice with fresh vegetables and soy sauce.' },
    { name: 'Gobi Manchurian', category: 'Veg', price: 140, description: 'Crispy cauliflower florets in tangy Manchurian sauce.' },
    { name: 'Veg Momos', category: 'Veg', price: 100, description: 'Steamed dumplings filled with spiced vegetables.' },
    { name: 'Chicken Momos', category: 'Non-Veg', price: 130, description: 'Juicy steamed dumplings filled with minced chicken.' },
    // ── Drinks ─────────────────────────────────────────────────
    { name: 'Mango Lassi', category: 'Drinks', price: 80, description: 'Refreshing chilled mango and yogurt drink.' },
    { name: 'Fresh Lime Soda', category: 'Drinks', price: 50, description: 'Sparkling soda with fresh lime juice and a pinch of salt.' },
    { name: 'Watermelon Juice', category: 'Drinks', price: 60, description: 'Cold-pressed fresh watermelon juice with mint.' },
    { name: 'Coconut Water', category: 'Drinks', price: 60, description: 'Fresh tender coconut water, naturally hydrating.' },
    { name: 'Sugarcane Juice', category: 'Drinks', price: 40, description: 'Freshly pressed sugarcane juice with ginger and lemon.' },
    { name: 'Mixed Fruit Milkshake', category: 'Drinks', price: 90, description: 'Thick and creamy blend of seasonal fresh fruits.' },
    { name: 'Buttermilk', category: 'Drinks', price: 30, description: 'Chilled spiced buttermilk with curry leaves and ginger.' },
    // ── Coffee ─────────────────────────────────────────────────
    { name: 'Madras Filter Coffee', category: 'Coffee', price: 40, description: 'Strong South Indian filter coffee with frothy milk.' },
    { name: 'Cappuccino', category: 'Coffee', price: 100, description: 'Espresso with velvety steamed milk foam.' },
    { name: 'Cafe Latte', category: 'Coffee', price: 110, description: 'Smooth espresso blended with steamed milk.' },
    { name: 'Cold Coffee', category: 'Coffee', price: 120, description: 'Iced coffee blended with chilled milk and sugar.' },
    { name: 'Espresso Shot', category: 'Coffee', price: 80, description: 'Pure concentrated coffee extracted under pressure.' },
    { name: 'Cafe Mocha', category: 'Coffee', price: 130, description: 'Espresso with chocolate sauce and steamed milk.' },
    { name: 'Americano', category: 'Coffee', price: 90, description: 'Strong espresso diluted with hot water.' },
    { name: 'Dalgona Coffee', category: 'Coffee', price: 140, description: 'Whipped coffee foam over chilled milk.' },
    // ── Desserts ───────────────────────────────────────────────
    { name: 'Vanilla Ice Cream', category: 'Ice Creams & Dessert', price: 80, description: 'Classic creamy vanilla ice cream with a rich taste.' },
    { name: 'Chocolate Brownie', category: 'Ice Creams & Dessert', price: 100, description: 'Dense fudgy chocolate brownie with a crispy crust.' },
    { name: 'Chocolate Cake', category: 'Ice Creams & Dessert', price: 150, description: 'Rich three-layer chocolate cake with ganache frosting.' },
    { name: 'Gulab Jamun', category: 'Ice Creams & Dessert', price: 70, description: 'Soft milk-solid balls soaked in rose-cardamom syrup.' },
    { name: 'Rasmalai', category: 'Ice Creams & Dessert', price: 90, description: 'Soft sponge cheese patties in saffron-flavored milk.' },
    { name: 'Jalebi', category: 'Ice Creams & Dessert', price: 60, description: 'Crispy spiral sweets soaked in sugar syrup.' },
    { name: 'Fruit Salad', category: 'Ice Creams & Dessert', price: 100, description: 'Fresh seasonal fruits drizzled with honey and mint.' },
    // ── Healthy Combos ────────────────────────────────────────
    { name: 'Quinoa Salad Bowl', category: 'Healthy Combo', price: 200, description: 'Protein-rich quinoa with roasted veggies and tahini dressing.' },
    { name: 'Sprouts Bhel', category: 'Healthy Combo', price: 100, description: 'Mixed sprouts tossed with lemon, onion and coriander.' },
    { name: 'Millet Dosa with Chutney', category: 'Healthy Combo', price: 130, description: 'Nutritious dosa made with finger millet, served with green chutney.' },
    { name: 'Mushroom Soup', category: 'Healthy Combo', price: 120, description: 'Creamy mushroom soup with garlic and thyme.' },
    { name: 'Brown Rice Palak Paneer', category: 'Healthy Combo', price: 180, description: 'Healthy brown rice paired with iron-rich palak paneer.' },
    // ── Gym Combos ────────────────────────────────────────────
    { name: 'Grilled Chicken Breast', category: 'Gym Combo', price: 280, description: '200g lean grilled chicken with sweet potato and salad.' },
    { name: 'Egg White Omelette', category: 'Gym Combo', price: 150, description: 'High-protein egg white omelette with multigrain toast.' },
    { name: 'Oatmeal with Almonds', category: 'Gym Combo', price: 130, description: 'Overnight oats with almonds, banana and honey.' },
    { name: 'Protein Smoothie Bowl', category: 'Gym Combo', price: 200, description: 'Whey protein smoothie bowl topped with granola and berries.' },
    { name: 'Grilled Fish Salad', category: 'Gym Combo', price: 260, description: 'Grilled fish fillet on a bed of fresh greens with lemon dressing.' },
];
const seed = async () => {
    try {
        initFirebase();
        console.log('🌱 Starting enterprise database seed to live Firebase Firestore...');
        // 1. Clear & Seed Foods
        await Food.deleteMany({});
        const foodsToInsert = allFoodsData.length > 0 ? allFoodsData : FOODS.map(f => ({
            ...f,
            image: generateFoodImagePath(f.name),
            available: true,
            stock: 100 + Math.floor(Math.random() * 50)
        }));
        const foods = await Food.insertMany(foodsToInsert);
        console.log(`✓ Inserted ${foods.length} food items across categories (Common: ${foods.filter(f => !f.isRecommendedForHealth).length}, Healthy: ${foods.filter(f => f.isRecommendedForHealth).length})`);
        await deleteCache('foods:all');
        // 2. Users (Admin, Customer, Delivery Partners, Restaurant)
        const salt = await bcrypt.genSalt(10);
        const defaultPassword = await bcrypt.hash('password123', salt);
        const adminPassword = await bcrypt.hash('admin123', salt);
        const usersToCreate = [
            {
                name: 'Admin User',
                email: 'admin@foods66.com',
                password: adminPassword,
                role: 'admin',
                phone: '9876543210',
                rewardPoints: 1000,
            },
            {
                name: 'John Customer',
                email: 'customer@foods66.com',
                password: defaultPassword,
                role: 'customer',
                phone: '9876543211',
                address: '12A, Anna Nagar, Chennai 600040',
                rewardPoints: 150,
            },
            {
                name: 'Ramesh Driver',
                email: 'driver@foods66.com',
                password: defaultPassword,
                role: 'driver',
                phone: '9876543212',
                vehicle: 'Bike',
                availability: true,
                currentLocation: { type: 'Point', coordinates: [80.21, 13.08] },
                activeOrders: 0,
                rating: 4.9,
                deliveryArea: 'Chennai Central'
            },
            {
                name: 'Suresh Express',
                email: 'driver2@foods66.com',
                password: defaultPassword,
                role: 'driver',
                phone: '9876543213',
                vehicle: 'Scooter',
                availability: true,
                currentLocation: { type: 'Point', coordinates: [80.24, 13.05] },
                activeOrders: 0,
                rating: 4.8,
                deliveryArea: 'South Chennai'
            },
            {
                name: 'Chef Kitchen Admin',
                email: 'restaurant@foods66.com',
                password: defaultPassword,
                role: 'restaurant',
                phone: '9876543214',
                address: 'Main Kitchen, Anna Nagar, Chennai',
            }
        ];
        for (const u of usersToCreate) {
            await User.findOneAndUpdate({ email: u.email }, { $set: u }, { upsert: true, new: true });
        }
        console.log(`✓ Seeded users: Admin, Customer, 2 Delivery Drivers, Restaurant`);
        // 3. Restaurant Details
        const restUser = await User.findOne({ email: 'restaurant@foods66.com' });
        if (restUser) {
            await Restaurant.findOneAndUpdate({ userId: restUser._id.toString() }, {
                userId: restUser._id.toString(),
                name: 'Foods66 Central Kitchen',
                description: 'Authentic Healthy & Gourmet South and North Indian Delicacies',
                address: 'Main Kitchen, 1st Avenue, Anna Nagar, Chennai 600040',
                phone: '044-26216666',
                rating: 4.8,
                verificationStatus: 'verified',
                liveStatus: 'open',
                earnings: 125000
            }, { upsert: true });
            console.log(`✓ Seeded Restaurant profile`);
        }
        // 4. Enterprise Coupons
        await Coupon.deleteMany({});
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        const coupons = [
            {
                code: 'WELCOME50',
                description: '50% off on your order up to ₹150',
                discountType: 'PERCENTAGE',
                discountValue: 50,
                minimumOrderAmount: 100,
                maximumDiscount: 150,
                startDate: new Date(),
                expiryDate: oneYearFromNow,
                usageLimit: 1000,
                perUserLimit: 1,
                usedCount: 0,
                active: true,
                applicableCategories: [],
                applicableFoods: []
            },
            {
                code: 'FLAT100',
                description: 'Flat ₹100 discount on orders above ₹300',
                discountType: 'FIXED_AMOUNT',
                discountValue: 100,
                minimumOrderAmount: 300,
                startDate: new Date(),
                expiryDate: oneYearFromNow,
                usageLimit: 500,
                perUserLimit: 3,
                usedCount: 0,
                active: true,
                applicableCategories: [],
                applicableFoods: []
            },
            {
                code: 'FREEDEL',
                description: 'Free delivery on orders above ₹150',
                discountType: 'FREE_DELIVERY',
                discountValue: 40,
                minimumOrderAmount: 150,
                startDate: new Date(),
                expiryDate: oneYearFromNow,
                usageLimit: 2000,
                perUserLimit: 5,
                usedCount: 0,
                active: true,
                applicableCategories: [],
                applicableFoods: []
            },
            {
                code: 'HEALTHY20',
                description: '20% off on Healthy Combos and Gym Combos',
                discountType: 'PERCENTAGE',
                discountValue: 20,
                minimumOrderAmount: 200,
                maximumDiscount: 100,
                startDate: new Date(),
                expiryDate: oneYearFromNow,
                usageLimit: 500,
                perUserLimit: 2,
                usedCount: 0,
                active: true,
                applicableCategories: ['Healthy Combo', 'Gym Combo'],
                applicableFoods: []
            }
        ];
        await Coupon.insertMany(coupons);
        console.log(`✓ Inserted 4 Enterprise Coupons: WELCOME50, FLAT100, FREEDEL, HEALTHY20`);
        // 5. Seed Realistic Orders for Analytics Baseline
        await Order.deleteMany({});
        await Delivery.deleteMany({});
        const customerUser = await User.findOne({ email: 'customer@foods66.com' });
        const driverUser = await User.findOne({ email: 'driver@foods66.com' });
        if (customerUser && foods.length >= 4) {
            const now = new Date();
            const sampleOrders = [
                {
                    userId: customerUser._id.toString(),
                    items: [
                        { foodId: foods[0]._id.toString(), name: foods[0].name, price: foods[0].price, quantity: 2, image: foods[0].image, category: foods[0].category },
                        { foodId: foods[1]._id.toString(), name: foods[1].name, price: foods[1].price, quantity: 1, image: foods[1].image, category: foods[1].category }
                    ],
                    subtotal: foods[0].price * 2 + foods[1].price,
                    deliveryFee: 40,
                    tax: Math.round((foods[0].price * 2 + foods[1].price) * 0.05),
                    discountAmount: 50,
                    couponCode: 'WELCOME50',
                    totalPrice: (foods[0].price * 2 + foods[1].price) + 40 + Math.round((foods[0].price * 2 + foods[1].price) * 0.05) - 50,
                    status: 'DELIVERED',
                    paymentStatus: 'PAID',
                    paymentMethod: 'CARD',
                    deliveryAddress: {
                        doorNo: '12A',
                        landmark: 'Anna Nagar',
                        district: 'Chennai',
                        city: 'Chennai',
                        state: 'Tamil Nadu',
                        pincode: '600040',
                        fullAddress: '12A, Anna Nagar, Chennai, Tamil Nadu 600040',
                        lat: 13.0827,
                        lng: 80.2707
                    },
                    deliveryPartnerId: driverUser?._id.toString(),
                    deliveryPartnerName: driverUser?.name || 'Ramesh Driver',
                    deliveryPartnerPhone: driverUser?.phone || '9876543212',
                    timeline: [
                        { status: 'PLACED', timestamp: new Date(now.getTime() - 3600000), note: 'Order placed', actor: 'CUSTOMER' },
                        { status: 'PAID', timestamp: new Date(now.getTime() - 3500000), note: 'Payment verified', actor: 'SYSTEM' },
                        { status: 'PAYMENT_CONFIRMED', timestamp: new Date(now.getTime() - 3500000), note: 'Payment confirmed', actor: 'SYSTEM' },
                        { status: 'RESTAURANT_CONFIRMED', timestamp: new Date(now.getTime() - 3400000), note: 'Confirmed by kitchen', actor: 'RESTAURANT' },
                        { status: 'PREPARING', timestamp: new Date(now.getTime() - 3000000), note: 'Preparation started', actor: 'RESTAURANT' },
                        { status: 'READY_FOR_PICKUP', timestamp: new Date(now.getTime() - 2400000), note: 'Food is packaged', actor: 'RESTAURANT' },
                        { status: 'ASSIGNED', timestamp: new Date(now.getTime() - 2300000), note: 'Assigned to driver', actor: 'SYSTEM' },
                        { status: 'PICKED_UP', timestamp: new Date(now.getTime() - 1800000), note: 'Picked up from kitchen', actor: 'DELIVERY_PARTNER' },
                        { status: 'OUT_FOR_DELIVERY', timestamp: new Date(now.getTime() - 1200000), note: 'Heading to delivery address', actor: 'DELIVERY_PARTNER' },
                        { status: 'DELIVERED', timestamp: new Date(now.getTime() - 300000), note: 'Handed to customer', actor: 'DELIVERY_PARTNER' }
                    ],
                    createdAt: new Date(now.getTime() - 3600000)
                },
                {
                    userId: customerUser._id.toString(),
                    items: [
                        { foodId: foods[9]._id.toString(), name: foods[9].name, price: foods[9].price, quantity: 2, image: foods[9].image, category: foods[9].category }
                    ],
                    subtotal: foods[9].price * 2,
                    deliveryFee: 40,
                    tax: Math.round((foods[9].price * 2) * 0.05),
                    discountAmount: 0,
                    totalPrice: (foods[9].price * 2) + 40 + Math.round((foods[9].price * 2) * 0.05),
                    status: 'DELIVERED',
                    paymentStatus: 'PAID',
                    paymentMethod: 'UPI',
                    deliveryAddress: {
                        doorNo: '12A',
                        landmark: 'Anna Nagar',
                        district: 'Chennai',
                        city: 'Chennai',
                        state: 'Tamil Nadu',
                        pincode: '600040',
                        fullAddress: '12A, Anna Nagar, Chennai 600040',
                        lat: 13.0827,
                        lng: 80.2707
                    },
                    deliveryPartnerId: driverUser?._id.toString(),
                    deliveryPartnerName: driverUser?.name || 'Ramesh Driver',
                    timeline: [
                        { status: 'PLACED', timestamp: new Date(now.getTime() - 86400000), note: 'Order placed', actor: 'CUSTOMER' },
                        { status: 'PAID', timestamp: new Date(now.getTime() - 86300000), note: 'Payment verified', actor: 'SYSTEM' },
                        { status: 'DELIVERED', timestamp: new Date(now.getTime() - 84000000), note: 'Delivered', actor: 'DELIVERY_PARTNER' }
                    ],
                    createdAt: new Date(now.getTime() - 86400000)
                }
            ];
            const insertedOrders = await Order.insertMany(sampleOrders);
            console.log(`✓ Inserted ${insertedOrders.length} sample baseline orders for tracking & analytics`);
            // Seed Delivery records
            for (const ord of insertedOrders) {
                await Delivery.create({
                    orderId: ord._id.toString(),
                    deliveryPartnerId: driverUser?._id.toString(),
                    deliveryPartnerName: driverUser?.name,
                    deliveryPartnerPhone: driverUser?.phone,
                    status: 'DELIVERED',
                    currentLocation: { type: 'Point', coordinates: [80.2707, 13.0827] },
                    assignedAt: ord.createdAt,
                    deliveredAt: ord.timeline[ord.timeline.length - 1]?.timestamp || ord.createdAt
                });
            }
            console.log(`✓ Inserted corresponding Delivery records`);
        }
        console.log('\n=============================================');
        console.log('✅ ENTERPRISE SEED COMPLETE!');
        console.log('=============================================');
        console.log('Credentials:');
        console.log('  Admin:      admin@foods66.com     / admin123');
        console.log('  Customer:   customer@foods66.com  / password123');
        console.log('  Driver:     driver@foods66.com    / password123');
        console.log('  Driver 2:   driver2@foods66.com   / password123');
        console.log('  Restaurant: restaurant@foods66.com / password123');
        console.log('=============================================\n');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Enterprise seed failed:', error);
        process.exit(1);
    }
};
seed();
//# sourceMappingURL=seed.js.map