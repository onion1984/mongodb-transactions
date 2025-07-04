const { MongoClient } = require("mongodb");
const sleep = require("sleep-promise");

async function simulateWriteSkew() {
  const uri = "xxxxxxx"; // Update with your MongoDB connection string
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("demo");
    const collectionA = db.collection("credit_card_a");
    const collectionB = db.collection("credit_card_b");

    const credit_limit = 1000;
    const cardA_purchase = 300;
    // Ensure there's customer credit cards to update
    await collectionA.updateOne(
      { _id: 1 },
      { $set: { customer_id: 1, card_type: "A", spending: 100 } },
      { upsert: true }
    );

    await collectionB.updateOne(
      { _id: 1 },
      { $set: { customer_id: 1, card_type: "B", spending: 500 } },
      { upsert: true }
    );


    console.log("Initial creidt account setup completed.");
    const session1 = client.startSession();

    try {
      // Start transaction in session1
      await session1.startTransaction();
      const cardA = await collectionA.findOne({ customer_id: 1 }, { session: session1 });
      const cardB = await collectionB.findOne({ customer_id: 1 }, { session: session1 });
      console.log("Session1 fetched card A:", cardA);
      console.log("Session1 fetched card B:", cardB);

      //sleep 10s to delay the commit
      console.log("Waiting...");
      await sleep(10000);
      console.log("Done waiting!");

      //if the combined spending of card A + card B + new purchase is below credit limit, update card A spending
      if(cardA.spending + cardB.spending + cardA_purchase <=credit_limit ) {
        await collectionA.updateOne(
          { customer_id: 1 },
          { $set: { spending: cardA.spending + cardA_purchase } },
          { session: session1 }
        );
      } else {
        console.log("Spending not approved because total Spending is going to exceed credit limit!");
      }

      const result1 = await collectionA.findOne(
        { customer_id: 1 },
        { session: session1 }
      );
      console.log("Session1 updated document:", result1);

      // Commit session1
      await session1.commitTransaction();
      console.log("Session1 committed transaction.");
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

simulateWriteSkew();
