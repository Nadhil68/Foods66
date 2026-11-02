import { User } from '../models/User';
import { initFirebase } from '../config/firebase';
import crypto from 'crypto';

async function run() {
  try {
    initFirebase();
    console.log('Testing User creation with various health profiles...');

    const testEmail1 = `test_no_health_${Date.now()}@example.com`;
    const user1 = await User.create({
      name: 'No Health Test',
      email: testEmail1,
      password: 'hashedpassword123',
      role: 'customer',
      healthProfile: { hasIssues: false }
    });
    console.log('✅ Created user without health issues:', user1._id);

    const testEmail2 = `test_with_health_${Date.now()}@example.com`;
    const user2 = await User.create({
      name: 'With Health Test',
      email: testEmail2,
      password: 'hashedpassword123',
      role: 'customer',
      healthProfile: {
        hasIssues: true,
        age: 35,
        diseaseName: 'Hypertension',
        condition: 'Hypertension',
        stage: '1',
        severity: '1',
        medicines: 'Amlodipine',
        medications: 'Amlodipine',
        diagnosedBy: 'physician',
        symptoms: 'Mild dizziness',
        dietaryMemo: 'Low sodium',
        validatedAt: new Date()
      }
    });
    console.log('✅ Created user with health issues:', user2._id);

    // Test with undefined nested fields to ensure removeUndefined works
    const testEmail3 = `test_undefined_fields_${Date.now()}@example.com`;
    const user3 = await User.create({
      name: 'Undefined Fields Test',
      email: testEmail3,
      password: 'hashedpassword123',
      role: 'customer',
      healthProfile: {
        hasIssues: true,
        age: undefined,
        diseaseName: 'Asthma',
        emptyField: undefined
      }
    });
    console.log('✅ Created user with undefined fields (sanitized!):', user3._id);

    // Clean up test users
    await User.findByIdAndDelete(user1._id);
    await User.findByIdAndDelete(user2._id);
    await User.findByIdAndDelete(user3._id);
    console.log('✅ Cleaned up all test users.');

    console.log('🎉 REGISTRATION LOGIC VERIFIED SUCCESSFULLY WITH LIVE FIRESTORE!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Registration test failed:', err);
    process.exit(1);
  }
}

run();
