require("dotenv").config({ path: ".env.local" });
const admin = require("firebase-admin");
const serviceAccount = require("<path/to/serviceAccountKey.json>");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

module.exports = db;