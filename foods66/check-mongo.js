let mongoose;
try {
  mongoose = require('mongoose');
} catch {
  mongoose = require('./backend/node_modules/mongoose');
}

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/foods66';

(async () => {
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log('MongoDB is running');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('MongoDB is NOT running:', err.message);
    process.exit(1);
  }
})();
