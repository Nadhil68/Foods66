(async () => {
  try {
    const email = process.env.TEST_EMAIL || 'customer@foods66.com';
    const password = process.env.TEST_PASSWORD || 'password123';

    const res = await fetch('http://127.0.0.1:5000/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    console.log('Status:', res.status);
    console.log('Response:', await res.text());
  } catch (err) {
    console.error('Login test failed:', err.message);
  }
})();
