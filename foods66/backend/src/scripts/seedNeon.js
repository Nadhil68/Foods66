import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_sLDKE9Y5ApXH@ep-long-paper-a12j3nym-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const generateId = () => crypto.randomBytes(12).toString('hex');

async function runSeed() {
  console.log('🚀 Connecting to live Neon PostgreSQL database...');
  const client = await pool.connect();

  try {
    console.log('✅ Connected to Neon database successfully!');

    // 1. Create Tables
    console.log('📦 Creating tables in Neon database...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS foods (
        _id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(10, 2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        image VARCHAR(500),
        available BOOLEAN DEFAULT TRUE,
        stock INT DEFAULT 100,
        is_vegetarian BOOLEAN DEFAULT FALSE,
        is_recommended_for_health BOOLEAN DEFAULT FALSE,
        rating NUMERIC(3, 2) DEFAULT 4.5,
        reviews_count INT DEFAULT 25,
        nutritional_info JSONB,
        dietary_tags JSONB DEFAULT '[]',
        health_tags JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS users (
        _id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'customer',
        phone VARCHAR(50) DEFAULT '',
        address TEXT DEFAULT '',
        reward_points INT DEFAULT 0,
        vehicle VARCHAR(50) DEFAULT 'Bike',
        availability BOOLEAN DEFAULT TRUE,
        current_location JSONB DEFAULT '{"type":"Point","coordinates":[80.2707,13.0827]}',
        active_orders INT DEFAULT 0,
        rating NUMERIC(3, 2) DEFAULT 4.8,
        is_suspended BOOLEAN DEFAULT FALSE,
        delivery_area VARCHAR(255) DEFAULT 'Chennai Central',
        health_profile JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS restaurants (
        _id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        address TEXT NOT NULL,
        phone VARCHAR(50) NOT NULL,
        rating NUMERIC(3, 2) DEFAULT 4.8,
        verification_status VARCHAR(50) DEFAULT 'verified',
        live_status VARCHAR(50) DEFAULT 'open',
        earnings NUMERIC(12, 2) DEFAULT 0,
        reviews JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS coupons (
        _id VARCHAR(50) PRIMARY KEY,
        code VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        discount_type VARCHAR(50) NOT NULL,
        discount_value NUMERIC(10, 2) NOT NULL,
        minimum_order_amount NUMERIC(10, 2) DEFAULT 0,
        maximum_discount NUMERIC(10, 2),
        start_date TIMESTAMPTZ DEFAULT NOW(),
        expiry_date TIMESTAMPTZ NOT NULL,
        usage_limit INT DEFAULT 100,
        per_user_limit INT DEFAULT 1,
        used_count INT DEFAULT 0,
        active BOOLEAN DEFAULT TRUE,
        applicable_categories JSONB DEFAULT '[]',
        applicable_foods JSONB DEFAULT '[]',
        used_by JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        _id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        restaurant_id VARCHAR(50),
        items JSONB NOT NULL,
        subtotal NUMERIC(10, 2) DEFAULT 0,
        delivery_fee NUMERIC(10, 2) DEFAULT 0,
        tax NUMERIC(10, 2) DEFAULT 0,
        discount_amount NUMERIC(10, 2) DEFAULT 0,
        coupon_code VARCHAR(100),
        total_price NUMERIC(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'PLACED',
        payment_status VARCHAR(50) DEFAULT 'PENDING',
        payment_method VARCHAR(50) DEFAULT 'CARD',
        delivery_address JSONB,
        session_id VARCHAR(255),
        delivery_partner_id VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS deliveries (
        _id VARCHAR(50) PRIMARY KEY,
        order_id VARCHAR(50) UNIQUE NOT NULL,
        delivery_partner_id VARCHAR(50),
        status VARCHAR(50) DEFAULT 'ASSIGNED',
        current_location JSONB DEFAULT '{"type":"Point","coordinates":[80.2707,13.0827]}',
        estimated_time VARCHAR(50) DEFAULT '30 mins',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS feedback (
        _id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        order_id VARCHAR(50),
        rating INT DEFAULT 5,
        comment TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS favorites (
        _id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        food_id VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, food_id)
      );
    `);
    console.log('✓ All 8 PostgreSQL tables created successfully!');

    // 2. Insert Foods
    console.log('🌱 Seeding food items into Neon...');
    const allFoodsPath = path.join(__dirname, '../data/allFoods.json');
    let foods = [];
    if (fs.existsSync(allFoodsPath)) {
      try {
        foods = JSON.parse(fs.readFileSync(allFoodsPath, 'utf-8'));
      } catch (e) {
        console.warn('Could not parse allFoods.json, using fallback');
      }
    }

    if (foods.length === 0) {
      foods = [
        { name: 'Masala Dosa', category: 'Veg', price: 80, description: 'Crispy rice crepe filled with spiced potato masala.' },
        { name: 'Chicken Biryani', category: 'Non-Veg', price: 180, description: 'Fragrant basmati rice with spiced chicken.' },
        { name: 'Butter Chicken', category: 'Non-Veg', price: 220, description: 'Tender chicken in rich tomato butter gravy.' },
        { name: 'Paneer Butter Masala', category: 'Veg', price: 190, description: 'Soft paneer in buttery tomato gravy.' },
        { name: 'Madras Filter Coffee', category: 'Coffee', price: 40, description: 'Strong South Indian filter coffee.' }
      ];
    }

    // Clear existing foods and bulk insert
    await client.query('DELETE FROM foods');

    let insertedFoodsCount = 0;
    const batchSize = 100;
    for (let i = 0; i < foods.length; i += batchSize) {
      const batch = foods.slice(i, i + batchSize);
      const values = [];
      const placeholders = [];
      
      batch.forEach((f, idx) => {
        const offset = idx * 15;
        placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15})`);
        
        const id = f._id ? f._id.toString() : generateId();
        const slug = f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const image = f.image || `/uploads/foods/${slug}.webp`;
        
        values.push(
          id,
          f.name,
          f.description || '',
          f.price || 100,
          f.category || 'Veg',
          image,
          f.available !== undefined ? f.available : true,
          f.stock || 100,
          !!f.isVegetarian,
          !!f.isRecommendedForHealth,
          f.rating || 4.5,
          f.reviewsCount || 20,
          JSON.stringify(f.nutritionalInfo || { calories: 350, protein: 12, carbs: 45, fat: 10 }),
          JSON.stringify(f.dietaryTags || []),
          JSON.stringify(f.healthTags || [])
        );
      });

      const query = `
        INSERT INTO foods (_id, name, description, price, category, image, available, stock, is_vegetarian, is_recommended_for_health, rating, reviews_count, nutritional_info, dietary_tags, health_tags)
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (_id) DO NOTHING;
      `;
      await client.query(query, values);
      insertedFoodsCount += batch.length;
    }
    console.log(`✓ Inserted ${insertedFoodsCount} foods into Neon live database!`);

    // 3. Seed Users
    console.log('🌱 Seeding user accounts into Neon...');
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('password123', salt);
    const adminPassword = await bcrypt.hash('admin123', salt);

    const users = [
      {
        id: generateId(),
        name: 'Admin User',
        email: 'admin@foods66.com',
        password: adminPassword,
        role: 'admin',
        phone: '9876543210',
        rewardPoints: 1000
      },
      {
        id: generateId(),
        name: 'John Customer',
        email: 'customer@foods66.com',
        password: defaultPassword,
        role: 'customer',
        phone: '9876543211',
        address: '12A, Anna Nagar, Chennai 600040',
        rewardPoints: 150
      },
      {
        id: generateId(),
        name: 'Ramesh Driver',
        email: 'driver@foods66.com',
        password: defaultPassword,
        role: 'driver',
        phone: '9876543212',
        vehicle: 'Bike',
        rewardPoints: 50
      },
      {
        id: generateId(),
        name: 'Chef Kitchen Admin',
        email: 'restaurant@foods66.com',
        password: defaultPassword,
        role: 'restaurant',
        phone: '9876543214',
        address: 'Main Kitchen, Anna Nagar, Chennai',
        rewardPoints: 0
      }
    ];

    let restaurantUserId = '';

    for (const u of users) {
      const res = await client.query(`
        INSERT INTO users (_id, name, email, password, role, phone, address, reward_points)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          password = EXCLUDED.password,
          role = EXCLUDED.role,
          phone = EXCLUDED.phone,
          address = EXCLUDED.address,
          reward_points = EXCLUDED.reward_points
        RETURNING _id;
      `, [u.id, u.name, u.email, u.password, u.role, u.phone, u.address || '', u.rewardPoints]);
      
      if (u.role === 'restaurant') {
        restaurantUserId = res.rows[0]._id;
      }
    }
    console.log(`✓ Seeded 4 platform user accounts into Neon!`);

    // 4. Seed Restaurant Profile
    if (restaurantUserId) {
      await client.query(`
        INSERT INTO restaurants (_id, user_id, name, description, address, phone, rating, verification_status, live_status, earnings)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (user_id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          address = EXCLUDED.address,
          phone = EXCLUDED.phone;
      `, [
        generateId(),
        restaurantUserId,
        'Foods66 Central Kitchen',
        'Authentic Healthy & Gourmet South and North Indian Delicacies',
        'Main Kitchen, 1st Avenue, Anna Nagar, Chennai 600040',
        '044-26216666',
        4.8,
        'verified',
        'open',
        125000
      ]);
      console.log(`✓ Seeded Restaurant profile into Neon!`);
    }

    // 5. Seed Coupons
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    const coupons = [
      {
        code: 'WELCOME50',
        description: '50% off on your first order up to ₹150',
        discountType: 'PERCENTAGE',
        discountValue: 50,
        minimumOrderAmount: 199,
        maximumDiscount: 150,
        expiryDate: oneYearFromNow
      },
      {
        code: 'FLAT100',
        description: 'Flat ₹100 discount on orders above ₹399',
        discountType: 'FIXED_AMOUNT',
        discountValue: 100,
        minimumOrderAmount: 399,
        maximumDiscount: 100,
        expiryDate: oneYearFromNow
      },
      {
        code: 'FREESHIP',
        description: 'Free delivery on orders above ₹149',
        discountType: 'FREE_DELIVERY',
        discountValue: 40,
        minimumOrderAmount: 149,
        maximumDiscount: 40,
        expiryDate: oneYearFromNow
      }
    ];

    for (const c of coupons) {
      await client.query(`
        INSERT INTO coupons (_id, code, description, discount_type, discount_value, minimum_order_amount, maximum_discount, expiry_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (code) DO UPDATE SET
          description = EXCLUDED.description,
          discount_type = EXCLUDED.discount_type,
          discount_value = EXCLUDED.discount_value,
          minimum_order_amount = EXCLUDED.minimum_order_amount,
          maximum_discount = EXCLUDED.maximum_discount,
          expiry_date = EXCLUDED.expiry_date;
      `, [generateId(), c.code, c.description, c.discountType, c.discountValue, c.minimumOrderAmount, c.maximumDiscount, c.expiryDate]);
    }
    console.log(`✓ Seeded ${coupons.length} coupons into Neon!`);

    // Verification Summary
    const foodsCount = await client.query('SELECT count(*) FROM foods');
    const usersCount = await client.query('SELECT count(*) FROM users');
    const restaurantsCount = await client.query('SELECT count(*) FROM restaurants');
    const couponsCount = await client.query('SELECT count(*) FROM coupons');

    console.log('\n======================================================');
    console.log('🎉 LIVE NEON DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('======================================================');
    console.log(`🥗 Total Foods in Neon:        ${foodsCount.rows[0].count}`);
    console.log(`👤 Total Users in Neon:        ${usersCount.rows[0].count}`);
    console.log(`🏪 Total Restaurants in Neon:  ${restaurantsCount.rows[0].count}`);
    console.log(`🎟️ Total Coupons in Neon:      ${couponsCount.rows[0].count}`);
    console.log('======================================================\n');

  } catch (err) {
    console.error('❌ Error seeding Neon database:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed();
