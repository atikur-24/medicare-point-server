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
    const pharmacyRegistrationApplication = database.collection("pharmacists");
    const CartCollection = database.collection("medicinesCart");
    const labCategoryCollection = database.collection("labCategory");
    const labItemsCollection = database.collection("labItems");
    const healthTipsCollection = database.collection("healthTips");
    const blogCollection = database.collection("blogs");
    const interviewCollection = database.collection("interviews");

    // medicines apis
    app.get("/medicines", async (req, res) => {
      const result = await medicineCollection.find().toArray();
      res.send(result);
    });
    app.get("/medicines/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await medicineCollection.findOne(query);
      res.send(result);
    });

    // carts related apis
    app.get("/medicineCarts", async (req, res) => {
      const result = await CartCollection.find().toArray();
      res.send(result);
    });
    app.post("/medicineCarts", async (req, res) => {
      const medicine = req.body;
      const result = await CartCollection.insertOne(medicine);
      res.send(result);
    });
    app.delete("/medicineCarts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await CartCollection.deleteOne(query);
      res.send(result);
    });
    app.delete("/medicineCarts", async (req, res) => {
      const result = await CartCollection.deleteMany();
      res.send(result);
    });

    // users apis
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User Already has been Create" });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // lab apii

    app.get("/labCategories", async (req, res) => {
      const result = await labCategoryCollection.find().toArray();
      res.send(result);
    });

    app.get("/labCategory/:id", async (req, res) => {
      const id = req.params.id;
      const result = await labCategoryCollection.find({ _id: new ObjectId(id) }).toArray();
      res.send(result);
    });

    app.get("/labAllItems", async (req, res) => {
      const result = await labItemsCollection.find().toArray();
      res.send(result);
    });

    app.get("/labAllItems/:id", async (req, res) => {
      const id = req.params.id;
      const result = await labItemsCollection.findOne({ _id: new ObjectId(id) });
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

    app.post("/labItems", async (req, res) => {
      const lab = req.body;
      const result = await labItemsCollection.insertOne(lab);
      res.send(result);
    });

    app.delete("/labItems/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await labItemsCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/labItems/:id", async (req, res) => {
      const id = req.params.id;
      const { body } = req.body;
      // const { image_url, PhoneNumber, labNames, labTestDetails, popularCategory, category, price, test_name, discount, city } = body;

      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };

      const updatedLabTest = {
        // $set: { image_url, PhoneNumber, labNames, labTestDetails, popularCategory, category, price, test_name, discount, city, remaining }
        $set: { ...body },
      };
      const result = await labItemsCollection.updateOne(filter, updatedLabTest, options);
      res.send(result);
    });

    // Health tips api here use it
    app.get("/allHealthTips", async (req, res) => {
      const result = await healthTipsCollection.find().toArray();
      res.send(result);
    });

    app.post("/addHealthTips", async (req, res) => {
      const tips = req.body;
      console.log(tips);
      const result = await healthTipsCollection.insertOne(tips);
      res.send(result);
    });

    app.get("/allHealthTips/:id", async (req, res) => {
      const id = req.params.id;
      const result = await healthTipsCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // blog related apis
    app.get("/blogs", async (req, res) => {
      const result = await blogCollection.find().toArray();
      res.send(result);
    });
    app.get("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogCollection.findOne(query);
      res.send(result);
    });
    app.get("/interviews", async (req, res) => {
      const result = await interviewCollection.find().toArray();
      res.send(result);
    });
    app.get("/interviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await interviewCollection.findOne(query);
      res.send(result);
    });

    // Pharmacy Registration application
    app.post('/pharmacyRegistrationApplication', async (req, res) => {
      const newApplication = req.body;
      const result = await pharmacyRegistrationApplication.insertOne(newApplication);
      res.send(result);
    });

    app.get('/pharmacyRegistrationApplications', async (req, res) => {
      const result = await pharmacyRegistrationApplication.find().toArray();
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
