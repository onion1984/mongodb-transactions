const { MongoClient } = require("mongodb");
const sleep = require("sleep-promise");

async function simulateWriteConflict() {
  const uri = "mongodb+srv://admin:Tjc1984729@learning.v0kta.mongodb.net/?retryWrites=true&w=majority&appName=learning"; // Update with your MongoDB connection string
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("demo");
    const collection = db.collection("writeConflictTest");

    const newBValue = 5;

    console.log("Initial document inserted.");

    // Simulate write conflict with a transaction
    const session2 = client.startSession();

    try {
      // Start transaction in session2
      await session2.startTransaction();
      const doc2 = await collection.findOne({ _id: 1 }, { session: session2 });
      console.log("Session2 fetched document:", doc2);

      //sleep 10s to delay the update
      console.log("Waiting...");
      await sleep(10000);
      console.log("Done waiting!");

      // This update will conflict with the update from session1
      await collection.updateOne(
        { _id: 1 },
        { $set: { B: newBValue, C: doc2.A + newBValue } },
        { session: session2 }
      );

      const result2 = await collection.findOne(
        { _id: 1 },
        { session: session2 }
      );
      console.log("Session2 updated document:", result2);

      // Commit session2 (should fail due to write conflict)
      await session2.commitTransaction();
      console.log("Session2 committed transaction.");
    } catch (err) {
      console.error("Error during transactions:", err.message);
    } finally {
      await session2.endSession();
    }
  } catch (err) {
    console.error("Error connecting to MongoDB:", err.message);
  } finally {
    await client.close();
  }
}

simulateWriteConflict();
