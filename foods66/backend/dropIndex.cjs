const mongoose = require('mongoose');

async function dropIndex() {
  try {
    await mongoose.connect('mongodb://localhost:27017/foods66');
    const db = mongoose.connection.db;
    await db.collection('users').dropIndex('username_1');
    console.log('Index username_1 dropped successfully');
  } catch (error) {
    if (error.codeName === 'IndexNotFound') {
      console.log('Index username_1 does not exist');
    } else {
      console.error('Error dropping index:', error);
    }
  } finally {
    await mongoose.disconnect();
  }
}

dropIndex();
