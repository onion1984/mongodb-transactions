const { MongoClient } = require("mongodb");
const sleep = require("sleep-promise");

async function simulateWriteConflict() {
  const uri = "XXXXXX"; // Update with your MongoDB connection string
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("demo");
    const collection = db.collection("data_consistency_demo");
    
    const newAValue = 4;

    // Ensure there's a document to update
    await collection.updateOne(
      { _id: 1 },
      { $set: { A: 2, B: 3, C: 5 } },
      { upsert: true }
    );

    console.log("Initial document inserted.");
    const session1 = client.startSession({ causalConsistency: true });

    try {
       // read the existing document
      const doc1 = await collection.findOne({ _id: 1 }, { session: session1 });
      console.log("Session1 fetched document:", doc1);

      // sleep 10s to delay the update
      console.log("Waiting...");
      await sleep(10000);
      console.log("Done waiting!");

      // update the document
      await collection.updateOne(
        { _id: 1 },
        { $set: { A: newAValue, C: doc1.B + newAValue } },
        { session: session1 }
      );

      const result1 = await collection.findOne(
        { _id: 1 },
        { session: session1 }
      );
      console.log("Session1 updated document:", result1);

    } catch (err) {
      console.error("Error during transactions:", err.message);
    } finally {
      await session1.endSession();
    }
  } catch (err) {
    console.error("Error connecting to MongoDB:", err.message);
  } finally {
    await client.close();
  }
}

simulateWriteConflict();
