const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const MOCK_USER_EMAIL = 'customer@foods66.com';
const MOCK_RESTAURANT_EMAIL = 'restaurant@foods66.com';
const MOCK_DRIVER_EMAIL = 'driver@foods66.com';

let customerToken = '';
let restaurantToken = '';
let driverToken = '';
let driverId = '';
let orderId = '';
let deliveryId = '';

const assert = (condition, msg) => {
  if (!condition) {
    console.error('❌ FAIL:', msg);
    process.exit(1);
  }
  console.log('✅ PASS:', msg);
};

const login = async (email, password) => {
  const res = await axios.post(`${API_BASE}/users/login`, { email, password });
  return res.data;
};

const delay = ms => new Promise(res => setTimeout(res, ms));

const runTests = async () => {
  try {
    console.log('====================================================');
    console.log('FOODS66 - LIFECYCLE E2E TEST ENGINE');
    console.log('====================================================\n');

    // 0. Auth
    const cData = await login(MOCK_USER_EMAIL, 'password123');
    customerToken = cData.token;
    
    const rData = await login(MOCK_RESTAURANT_EMAIL, 'password123');
    restaurantToken = rData.token;

    const dData = await login(MOCK_DRIVER_EMAIL, 'password123');
    driverToken = dData.token;
    driverId = dData._id;

    assert(customerToken && restaurantToken && driverToken, 'Authentication successful for all roles');

    // Fetch a food item to order
    const foodRes = await axios.get(`${API_BASE}/foods`);
    const foodId = foodRes.data[0]._id;

    // 1. Order Placed (COD)
    console.log('\n--- 1. Order Placed (COD) ---');
    const orderRes = await axios.post(`${API_BASE}/orders`, {
      items: [{ foodId, name: 'Test Food', price: 100, quantity: 1 }],
      deliveryAddress: { fullAddress: 'Test Address', lat: 13.05, lng: 80.25 },
      paymentMethod: 'COD'
    }, { headers: { Authorization: `Bearer ${customerToken}` } });

    orderId = orderRes.data.orderId;
    assert(orderRes.status === 201, 'Order created successfully');
    assert(orderRes.data.order.status === 'PAYMENT_CONFIRMED', 'COD initial status is PAYMENT_CONFIRMED');
    
    // Check Tracking payload
    const track1 = await axios.get(`${API_BASE}/deliveries/tracking/${orderId}`, { headers: { Authorization: `Bearer ${customerToken}` } });
    assert(track1.data.orderStatus === 'PAYMENT_CONFIRMED', 'Tracking API reflects PAYMENT_CONFIRMED status');
    assert(track1.data.driverLocation === null, 'Driver location is strictly NULL before assignment');

    // 1.5 Restaurant CONFIRMED
    console.log('\n--- 1.5. Restaurant CONFIRMED ---');
    const restConfRes = await axios.put(`${API_BASE}/orders/${orderId}/status`, { status: 'RESTAURANT_CONFIRMED' }, { headers: { Authorization: `Bearer ${restaurantToken}` } });
    assert(restConfRes.status === 200, 'Order marked as RESTAURANT_CONFIRMED');
    const track1_5 = await axios.get(`${API_BASE}/deliveries/tracking/${orderId}`, { headers: { Authorization: `Bearer ${customerToken}` } });
    assert(track1_5.data.orderStatus === 'RESTAURANT_CONFIRMED', 'Tracking API reflects RESTAURANT_CONFIRMED');

    // 2. Restaurant PREPARING
    console.log('\n--- 2. Restaurant PREPARING ---');
    const prepRes = await axios.put(`${API_BASE}/orders/${orderId}/status`, { status: 'PREPARING' }, { headers: { Authorization: `Bearer ${restaurantToken}` } });
    assert(prepRes.status === 200, 'Order marked as PREPARING');
    const track2 = await axios.get(`${API_BASE}/deliveries/tracking/${orderId}`, { headers: { Authorization: `Bearer ${customerToken}` } });
    assert(track2.data.orderStatus === 'PREPARING', 'Tracking API reflects PREPARING');

    // 3. Restaurant READY_FOR_PICKUP
    console.log('\n--- 3. Restaurant READY_FOR_PICKUP ---');
    const readyRes = await axios.put(`${API_BASE}/orders/${orderId}/status`, { status: 'READY_FOR_PICKUP' }, { headers: { Authorization: `Bearer ${restaurantToken}` } });
    assert(readyRes.status === 200, 'Order marked as READY_FOR_PICKUP');
    const track3 = await axios.get(`${API_BASE}/deliveries/tracking/${orderId}`, { headers: { Authorization: `Bearer ${customerToken}` } });
    if (track3.data.orderStatus !== 'ASSIGNED') {
      console.log('Tracking payload after READY_FOR_PICKUP:', track3.data);
    }
    assert(track3.data.orderStatus === 'ASSIGNED', 'Trigger auto assignment on READY_FOR_PICKUP sets status to ASSIGNED');

    // Determine which driver was assigned and login as them
    const assignedDriverName = track3.data.deliveryPartner?.name || '';
    const assignedEmail = assignedDriverName === 'Suresh Express' ? 'driver2@foods66.com' : 'driver@foods66.com';
    const assignedDData = await login(assignedEmail, 'password123');
    driverToken = assignedDData.token;

    // 4. Driver PICKED_UP
    console.log('\n--- 4. Driver PICKED_UP ---');
    const pickupRes = await axios.put(`${API_BASE}/orders/${orderId}/status`, { status: 'PICKED_UP' }, { headers: { Authorization: `Bearer ${driverToken}` } });
    assert(pickupRes.status === 200, 'Order marked as PICKED_UP');
    const track4 = await axios.get(`${API_BASE}/deliveries/tracking/${orderId}`, { headers: { Authorization: `Bearer ${customerToken}` } });
    assert(track4.data.orderStatus === 'PICKED_UP', 'Tracking API reflects PICKED_UP');

    // 5. Driver OUT_FOR_DELIVERY
    console.log('\n--- 5. Driver OUT_FOR_DELIVERY ---');
    const outRes = await axios.put(`${API_BASE}/orders/${orderId}/status`, { status: 'OUT_FOR_DELIVERY' }, { headers: { Authorization: `Bearer ${driverToken}` } });
    assert(outRes.status === 200, 'Order marked as OUT_FOR_DELIVERY');
    const track5 = await axios.get(`${API_BASE}/deliveries/tracking/${orderId}`, { headers: { Authorization: `Bearer ${customerToken}` } });
    assert(track5.data.orderStatus === 'OUT_FOR_DELIVERY', 'Tracking API reflects OUT_FOR_DELIVERY');

    // 6. Driver DELIVERED
    console.log('\n--- 6. Driver DELIVERED ---');
    const delRes = await axios.put(`${API_BASE}/orders/${orderId}/status`, { status: 'DELIVERED' }, { headers: { Authorization: `Bearer ${driverToken}` } });
    assert(delRes.status === 200, 'Order marked as DELIVERED');
    const track6 = await axios.get(`${API_BASE}/deliveries/tracking/${orderId}`, { headers: { Authorization: `Bearer ${customerToken}` } });
    assert(track6.data.orderStatus === 'DELIVERED', 'Tracking API reflects DELIVERED');

    console.log('\n====================================================');
    console.log('✅ ALL LIFECYCLE TESTS PASSED SUCCESSFULLY!');
    console.log('====================================================');

  } catch (error) {
    console.error('❌ TEST FAILED');
    console.error(error.response?.data || error.message);
    process.exit(1);
  }
};

runTests();
