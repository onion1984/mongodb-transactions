const { MongoClient } = require("mongodb");
const sleep = require("sleep-promise");

async function simulateWriteSkew() {
  const uri = "xxxxxx"; // Update with your MongoDB connection string
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("demo");
    const collectionA = db.collection("credit_card_a");
    const collectionB = db.collection("credit_card_b");

    const credit_limit = 1000;
    const cardB_purchase = 300;

    console.log("Initial creidt account setup completed.");
    const session2 = client.startSession();

    try {
      // Start transaction in session2
      await session2.startTransaction();
      const cardA = await collectionA.findOne(
        { customer_id: 1 },
        { session: session2 }
      );
      const cardB = await collectionB.findOne(
        { customer_id: 1 },
        { session: session2 }
      );
      console.log("Session2 fetched card A:", cardA);
      console.log("Session2 fetched card B:", cardB);

      //sleep 10s to delay the commit
      console.log("Waiting...");
      await sleep(10000);
      console.log("Done waiting!");

      //if the combined spending of card A + card B + new purchase is below credit limit, update card B spending
      if (cardA.spending + cardB.spending + cardB_purchase <= credit_limit) {
        await collectionB.updateOne(
          { customer_id: 1 },
          { $set: { spending: cardB.spending + cardB_purchase } },
          { session: session2 }
        );
      } else {
        console.log(
          "Spending not approved because total Spending is going to exceed credit limit!"
        );
      }

      const result2 = await collectionB.findOne(
        { customer_id: 1 },
        { session: session2 }
      );
      console.log("Session2 updated document:", result2);

      // Commit session2
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

simulateWriteSkew();
