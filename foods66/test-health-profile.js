const http = require('http');

function post(path, payload, label) {
  return new Promise((resolve) => {
    const data = JSON.stringify(payload);

    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', chunk => {
        body += chunk;
      });

      res.on('end', () => {
        console.log(`\n${label}`);
        console.log(`Status: ${res.statusCode}`);

        try {
          console.log(JSON.parse(body));
        } catch {
          console.log(body);
        }

        resolve();
      });
    });

    req.on('error', (err) => {
      console.error(`${label} failed:`, err.message);
      resolve();
    });

    req.write(data);
    req.end();
  });
}

(async () => {
  await post(
    '/api/users/validate-health',
    {
      age: 45,
      diseaseName: 'Diabetes Type 2',
      stage: '2',
      medicines: 'Metformin'
    },
    'Valid Profile'
  );

  await post(
    '/api/users/validate-health',
    {
      age: 10,
      diseaseName: 'Diabetes',
      stage: '3',
      medicines: '',
      symptoms: 'blurred vision, nausea'
    },
    'Red Flag Profile'
  );
})();
