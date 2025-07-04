const { MongoClient } = require("mongodb");

async function simulateWriteConflict() {
  const uri = "mongodb+srv://xxxxxx"; // Update with your MongoDB connection string
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("demo");
    const collection = db.collection("writeConflictTest");

    const newAValue = 4;
    const newBValue = 5;
    // Ensure there's a document to update
    await collection.updateOne(
      { _id: 1 },
      { $set: { A: 2, B: 3, C: 5 } },
      { upsert: true }
    );

    console.log("Initial document inserted.");

    const doc1 = await collection.findOneAndUpdate(
      { _id: 1 }, // Query by numeric id field
      [
        {
          $set: {
            A: newAValue,
            C: { $add: [newAValue, "$B"] },
          },
        },
      ],
      {
        returnDocument: "after"
      }
    );
    console.log("Session1 updated document:", doc1);

    const doc2 = await collection.findOneAndUpdate(
      { _id: 1 }, // Query by numeric id field
      [
        {
          $set: {
            B: newBValue,
            C: { $add: ["$A", newBValue] },
          },
        },
      ],
      {
        returnDocument: "after",
      }
    );
    console.log("Session2 updated document:", doc2);
  } catch (err) {
    console.error("Error connecting to MongoDB:", err.message);
  } finally {
    await client.close();
  }
}

simulateWriteConflict();
