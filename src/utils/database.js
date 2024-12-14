const db = require("../lib/firebase/config");

const readData = async (userId, collectionName) => {
  try {
    const collectionRef = db
      .collection("users")
      .doc(String(userId))
      .collection(collectionName);
    const snapshot = await collectionRef.get();
    const data = [];
    snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
    return data;
  } catch (error) {
    console.error(
      `Error reading data from collection "${collectionName}":`,
      error
    );
    return [];
  }
};

const writeData = async (userId, collectionName, data) => {
  const collectionRef = db
    .collection("users")
    .doc(String(userId))
    .collection(collectionName);
  await collectionRef.add(data);
};

const deleteData = async (userId, collectionName, dataId) => {
  const collectionRef = db
    .collection("users")
    .doc(String(userId))
    .collection(collectionName);
  await collectionRef.doc(dataId).delete();
};

const updateData = async (
  userId,
  collectionName,
  previousData,
  updatedData
) => {
  const collectionRef = db
    .collection("users")
    .doc(String(userId))
    .collection(collectionName);
  await collectionRef.doc(previousData).update({ task: updatedData });
};

module.exports = { readData, writeData, deleteData, updateData };
