const { MongoClient } = require("mongodb");
const sleep = require("sleep-promise");

async function simulateWriteConflict() {
  const uri = "xxxxxx"; // Update with your MongoDB connection string
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("demo");
    const collection = db.collection("data_consistency_demo");
    
    const newBValue = 5;

    const session2 = client.startSession({ causalConsistency: true });

    try {
       // read the existing document
      const doc2 = await collection.findOne({ _id: 1 }, { session: session2 });
      console.log("Session2 fetched document:", doc2);

      // sleep 10s to delay the update
      console.log("Waiting...");
      await sleep(10000);
      console.log("Done waiting!");

      // update the document
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
