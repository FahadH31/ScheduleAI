const { MongoClient } = require('mongodb');

let client = null;
let db = null;
let connectPromise = null;

async function getDb() {
  if (db) return db;
  
  if (!connectPromise) {
    if (!process.env.MONGODB_URL) {
      throw new Error("MONGODB_URL environment variable is missing.");
    }
    client = new MongoClient(process.env.MONGODB_URL);
    connectPromise = client.connect().then(() => {
      db = client.db('user-data');
      console.log("Connected to MongoDB database successfully");
    });
  }
  
  await connectPromise;
  return db;
}

async function saveRefreshToken(email, refreshToken) {
  const db = await getDb();
  await db.collection('users').updateOne(
    { _id: email },
    { 
      $set: { 
        email, 
        refresh_token: refreshToken, 
        updatedAt: new Date() 
      } 
    },
    { upsert: true }
  );
}

async function getRefreshToken(email) {
  const db = await getDb();
  const user = await db.collection('users').findOne({ _id: email });
  return user ? user.refresh_token : null;
}

async function deleteUserData(email) {
  const db = await getDb();
  await db.collection('users').deleteOne({ _id: email });
  console.log(`Deleted database record for user: ${email}`);
}

module.exports = {
  getDb,
  saveRefreshToken,
  getRefreshToken,
  deleteUserData
};