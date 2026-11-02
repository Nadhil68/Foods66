(async () => {
  try {
    const res = await fetch('http://127.0.0.1:5000/api/webhooks/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Mock-Signature': 'valid-signature'
      },
      body: JSON.stringify({
        event: 'payment_intent.succeeded',
        data: {
          orderId: 'fake-order-id',
          amount: 100,
          sessionId: 'mock_session'
        }
      })
    });
    console.log(res.status, await res.text());
  } catch (err) {
    console.error(err);
  }
})();
