const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// mongodb code start
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@team-gladiators.2x9sw5e.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, { useUnifiedTopology: true }, { useNewUrlParser: true }, { connectTimeoutMS: 30000 }, { keepAlive: 1 });

async function run() {
  try {
    // database collection
    const database = client.db("medicareDB");
    const medicineCollection = database.collection("medicines");
    const userCollection = database.collection("users");
    const pharmacistCollection = database.collection("pharmacists");
    const CartCollection = database.collection("medicinesCart");
    const labCategoryCollection = database.collection("labCategory");
    const labItemsCollection = database.collection("labItems");

    // medicines apis
    app.get('/medicines', async (req, res) => {
      const result = await medicineCollection.find().toArray();
      res.send(result);
    });
    app.get('/medicines/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await medicineCollection.findOne(query);
      res.send(result);
    });

    // carts related apis
    app.get('/medicineCarts', async (req, res) => {
      const result = await CartCollection.find().toArray();
      res.send(result)
    });
    app.post('/medicineCarts', async (req, res) => {
      const medicine = req.body;
      const result = await CartCollection.insertOne(medicine);
      res.send(result);
    })
    app.delete('/medicineCarts/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await CartCollection.deleteOne(query);
      res.send(result);
    })
    app.delete('/medicineCarts', async (req, res) => {
      const result = await CartCollection.deleteMany();
      res.send(result);
    })

    // users apis here

    // pharmacist apis

    // lab api
    app.get("/labCategories", async (req, res) => {
      const result = await labCategoryCollection.find().toArray();
      res.send(result);
    });

    app.get("/labCategory/:id", async (req, res) => {
      const id = req.params.id;
      const result = await labCategoryCollection.find({ _id: new ObjectId(id) }).toArray();
      res.send(result);
    });


    app.get("/labPopularItems", async (req, res) => {
      const query = { category: "Popular" };
      const result = await labItemsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/labItems/:category", async (req, res) => {
      const result = await labItemsCollection.find({ category_name: req.params.category }).toArray();
      res.send(result);
    });


    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Medicare Server is running...");
});

app.listen(port, () => {
  console.log(`Medicare is running on port ${5000}`);
});
