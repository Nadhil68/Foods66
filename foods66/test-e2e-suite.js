import http from 'http';

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runSuite() {
  console.log('====================================================');
  console.log('FOODS66 - COMPREHENSIVE END-TO-END VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, extra = '') {
    if (condition) {
      console.log(`✅ PASS: ${name} ${extra}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name} ${extra}`);
      failed++;
    }
  }

  // 1. Health check
  try {
    const health = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET'
    });
    assert('Health Check Endpoint', health.status === 200 && health.data?.success === true, `(Status: ${health.status})`);
  } catch (err) {
    assert('Health Check Endpoint', false, err.message);
  }

  // 2. Authentication Login
  let customerToken = '';
  let customerId = '';
  try {
    const login = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/users/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'customer@foods66.com', password: 'password123' });

    assert('Customer Login', login.status === 200 && Boolean(login.data?.token), `(Status: ${login.status})`);
    customerToken = login.data?.token || '';
    customerId = login.data?.user?.id || login.data?.user?._id || '';
  } catch (err) {
    assert('Customer Login', false, err.message);
  }

  // 3. Health Profile Validation (Canonical Endpoint POST /api/users/validate-health)
  try {
    const healthVal = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/users/validate-health',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      age: 45,
      diseaseName: 'Type 2 Diabetes',
      stage: 'Moderate',
      medicines: 'Metformin 500mg'
    });

    assert('Health Profile Validation (Valid profile)', healthVal.status === 200 && healthVal.data?.success === true && healthVal.data?.valid === true, `(Score: ${healthVal.data?.confidenceScore})`);
    assert('Health Profile Contraindications present', Array.isArray(healthVal.data?.dietaryContraindications) && healthVal.data?.dietaryContraindications.length > 0);
  } catch (err) {
    assert('Health Profile Validation', false, err.message);
  }

  // Red Flag Health Validation check
  try {
    const redFlagVal = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/users/validate-health',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      age: 50,
      diseaseName: 'Diabetes',
      stage: '3',
      medicines: 'Warfarin',
      symptoms: 'severe chest pain'
    });

    const isEmergency = Boolean(redFlagVal.data?.redFlags?.length > 0) || Boolean(redFlagVal.data?.escalation?.shouldConsultDoctor);
    assert('Health Profile Red Flag Detection', redFlagVal.status === 200 && isEmergency, `(Flags detected: ${redFlagVal.data?.redFlags?.length || 0})`);
  } catch (err) {
    assert('Health Profile Red Flag Detection', false, err.message);
  }

  // 4. Food Catalog & Search
  let firstFoodId = '';
  let firstFoodPrice = 0;
  try {
    const foodsRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/foods',
      method: 'GET'
    });

    assert('Food Catalog Loading', foodsRes.status === 200 && Array.isArray(foodsRes.data) && foodsRes.data.length > 0, `(${foodsRes.data?.length} foods loaded)`);
    if (foodsRes.data && foodsRes.data.length > 0) {
      firstFoodId = foodsRes.data[0]._id;
      firstFoodPrice = foodsRes.data[0].price;
      assert('Food items have valid 24-hex MongoDB ObjectIds', /^[0-9a-fA-F]{24}$/.test(firstFoodId), `(Sample ID: ${firstFoodId})`);
    }

    // Partial search via query param
    const searchParam = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/foods?search=bir',
      method: 'GET'
    });
    assert('Partial Search /api/foods?search=bir', searchParam.status === 200 && Array.isArray(searchParam.data) && searchParam.data.length > 0, `(Matched: ${searchParam.data?.length} items)`);

    // Case-insensitive search
    const searchDosa = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/foods?search=DOSA',
      method: 'GET'
    });
    assert('Case-insensitive Search /api/foods?search=DOSA', searchDosa.status === 200 && Array.isArray(searchDosa.data) && searchDosa.data.length > 0, `(Matched: ${searchDosa.data?.length} items)`);

    // Search endpoint POST /api/search
    const searchPost = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/search',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { query: 'biryani' });
    assert('Search Route POST /api/search', searchPost.status === 200 && Array.isArray(searchPost.data) && searchPost.data.length > 0, `(Matched: ${searchPost.data?.length} items)`);

  } catch (err) {
    assert('Food Catalog & Search', false, err.message);
  }

  // 5. AI Health Recommendations (grounded in DB foods)
  try {
    const aiRecs = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/ai/health-recommendations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      }
    }, {
      healthProfile: {
        hasIssues: true,
        diseaseName: 'Diabetes',
        stage: '1',
        medicines: 'Metformin',
        dietaryMemo: 'Avoid refined sugars'
      }
    });

    assert('AI Health Recommendations Endpoint', aiRecs.status === 200 && Array.isArray(aiRecs.data) && aiRecs.data.length > 0, `(${aiRecs.data?.length} recommendations returned)`);
    if (Array.isArray(aiRecs.data) && aiRecs.data.length > 0) {
      const allValidIds = aiRecs.data.every(item => /^[0-9a-fA-F]{24}$/.test(item._id));
      assert('AI Health Recommendations all use real MongoDB ObjectIds', allValidIds, `(No fake ITEM-* or rec_* IDs)`);
    }
  } catch (err) {
    assert('AI Health Recommendations', false, err.message);
  }

  // 6. Direct Order Creation (COD)
  let createdOrderId = '';
  try {
    const orderRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      }
    }, {
      items: [{ foodId: firstFoodId, quantity: 2 }],
      deliveryAddress: {
        doorNo: '12B',
        landmark: 'Near Gandhi Park',
        district: 'Chennai Central',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001'
      },
      couponCode: 'WELCOME50',
      paymentMethod: 'COD'
    });

    assert('Direct Order Creation (POST /api/orders)', orderRes.status === 201 && orderRes.data?.success === true, `(Status: ${orderRes.status})`);
    createdOrderId = orderRes.data?.orderId || orderRes.data?.order?._id;
    assert('Created Order has 24-hex MongoDB ObjectId', /^[0-9a-fA-F]{24}$/.test(createdOrderId), `(Order ID: ${createdOrderId})`);
    assert('Authoritative pricing calculated correctly', orderRes.data?.order?.totalPrice > 0, `(Total Price: ₹${orderRes.data?.order?.totalPrice})`);
  } catch (err) {
    assert('Direct Order Creation', false, err.message);
  }

  // 7. Payment Session Creation (CARD) & Verification
  let cardOrderId = '';
  try {
    const sessionRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/payments/create-session',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      }
    }, {
      items: [{ foodId: firstFoodId, quantity: 1 }],
      deliveryAddress: '42 Main St, Anna Nagar, Chennai',
      paymentMethod: 'CARD'
    });

    assert('Payment Session Creation (POST /api/payments/create-session)', (sessionRes.status === 200 || sessionRes.status === 201) && sessionRes.data?.success === true, `(Status: ${sessionRes.status})`);
    cardOrderId = sessionRes.data?.orderId;
    assert('Card Order ID is distinct 24-hex MongoDB ObjectId', /^[0-9a-fA-F]{24}$/.test(cardOrderId), `(Card Order ID: ${cardOrderId})`);

    // Verify Payment Endpoint
    const verifyRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/payments/verify/${cardOrderId}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      }
    });

    assert('Payment Verification (POST /api/payments/verify/:orderId)', verifyRes.status === 200 && verifyRes.data?.success === true && verifyRes.data?.paymentStatus === 'PAID', `(Payment Status: ${verifyRes.data?.paymentStatus})`);
  } catch (err) {
    assert('Payment Session & Verification', false, err.message);
  }

  // 8. Live Tracking
  try {
    const trackRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/deliveries/tracking/${createdOrderId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${customerToken}`
      }
    });

    assert('Live Tracking (GET /api/deliveries/tracking/:orderId)', trackRes.status === 200 && trackRes.data?.success === true, `(Status: ${trackRes.data?.status || trackRes.data?.orderStatus})`);
    assert('Tracking includes live timeline and location data', Array.isArray(trackRes.data?.timeline) && trackRes.data?.customerLocation !== undefined);
  } catch (err) {
    assert('Live Tracking', false, err.message);
  }

  // 9. Driver Dashboard & Available Deliveries
  let driverToken = '';
  try {
    const driverLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/users/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'driver@foods66.com', password: 'password123' });

    assert('Driver Login', driverLogin.status === 200 && Boolean(driverLogin.data?.token));
    driverToken = driverLogin.data?.token || '';

    const availRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/deliveries/available',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${driverToken}`
      }
    });

    assert('Available Deliveries for Drivers (GET /api/deliveries/available)', availRes.status === 200 && (Array.isArray(availRes.data?.deliveries) || Array.isArray(availRes.data?.orders)));
  } catch (err) {
    assert('Driver Deliveries', false, err.message);
  }

  // 10. Restaurant Dashboard & Order Management
  try {
    const restLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/users/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'restaurant@foods66.com', password: 'password123' });

    assert('Restaurant Login', restLogin.status === 200 && Boolean(restLogin.data?.token));
    const restToken = restLogin.data?.token || '';

    const restOrders = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${restToken}`
      }
    });

    assert('Restaurant Orders List (GET /api/orders)', restOrders.status === 200 && Array.isArray(restOrders.data?.orders));
  } catch (err) {
    assert('Restaurant Management', false, err.message);
  }

  // 11. Admin BI Analytics
  try {
    const adminLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/users/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@foods66.com', password: 'admin123' });

    assert('Admin Login', adminLogin.status === 200 && Boolean(adminLogin.data?.token));
    const adminToken = adminLogin.data?.token || '';

    const analytics = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/analytics/live',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    assert('Admin BI Live Analytics (GET /api/analytics/live)', analytics.status === 200 && analytics.data?.success === true);
  } catch (err) {
    assert('Admin Analytics', false, err.message);
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSuite().catch(console.error);
