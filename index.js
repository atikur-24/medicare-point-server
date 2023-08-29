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
    const mediCartCollection = database.collection("medicinesCart");
    const pharmacyRegistrationApplication = database.collection("P.R. Applications");
    const labCategoryCollection = database.collection("labCategory");
    const labItemsCollection = database.collection("labItems");
    const labCartCollection = database.collection("labsCart");
    const healthTipsCollection = database.collection("healthTips");
    const blogCollection = database.collection("blogs");
    const interviewCollection = database.collection("interviews");

    // =========== Medicines Related apis ===========
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

    // =========== Medicines Cart Related apis ===========
    app.get("/medicineCarts", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send({ message: "Empty Cart" });
      }
      const query = { email: email };
      const result = await mediCartCollection.find(query).toArray();
      res.send(result);
    });
    app.post("/medicineCarts", async (req, res) => {
      const medicine = req.body;
      const filterMedicine = { medicine_Id: medicine.medicine_Id, email: medicine.email };
      const singleMedicine = await mediCartCollection.findOne(filterMedicine);
      if (singleMedicine) {
        const updateDoc = {
          $set: {
            quantity: singleMedicine.quantity + medicine.quantity,
          },
        };
        const updateQuantity = await mediCartCollection.updateOne(filterMedicine, updateDoc);
        res.send(updateQuantity);
      } else {
        const result = await mediCartCollection.insertOne(medicine);
        res.send(result);
      }
    });
    app.delete("/medicineCarts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await mediCartCollection.deleteOne(query);
      res.send(result);
    });
    app.delete("/medicineCarts", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await mediCartCollection.deleteMany(query);
      res.send(result);
    });

    // =========== Lab Test related apis ===========
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

    // =========== Lab Test Cart Related apis ===========
    app.get("/labsCart", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      }
      const query = { email: email };
      const result = await labCartCollection.find(query).toArray();
      res.send(result);
    });
    app.post("/labsCart", async (req, res) => {
      const labCart = req.body;
      const result = await labCartCollection.insertOne(labCart);
      res.send(result);
    });

    app.delete("/labCart/:id", async (req, res) => {
      const id = req.params.id;
      const result = await labCartCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // =========== Health Tips Related apis ===========
    app.get("/allHealthTips", async (req, res) => {
      const result = await healthTipsCollection.find().toArray();
      res.send(result);
    });

    app.post("/addHealthTips", async (req, res) => {
      const tips = req.body;
      const result = await healthTipsCollection.insertOne(tips);
      res.send(result);
    });

    app.get("/allHealthTips/:id", async (req, res) => {
      const id = req.params.id;
      const result = await healthTipsCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.delete("/allHealthTips/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await healthTipsCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/allHealthTips/:id", async (req, res) => {
      const id = req.params.id;
      // const { body } = req.body;
      console.log(id, req.body);
      const { category, name, image, type, cause, cure, prevention } = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };

      const updatedHealthTips = {
        $set: { category, name, image, type, cause, cure, prevention },
      };
      const result = await healthTipsCollection.updateOne(filter, updatedHealthTips, options);
      res.send(result);
    });

    // =========== Blog Related apis ===========
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

    // =========== Pharmacist Related apis ===========
    app.post("/pharmacyRegistrationApplication", async (req, res) => {
      const newApplication = req.body;
      const result = await pharmacyRegistrationApplication.insertOne(newApplication);
      res.send(result);
    });

    app.get("/pharmacyRegistrationApplications", async (req, res) => {
      const result = await pharmacyRegistrationApplication.find().toArray();
      res.send(result);
    });

    app.get("/pharmacyRegistrationApl/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await pharmacyRegistrationApplication.findOne(query);
      res.send(result);
    });

    app.patch("/pharmacyRApprove/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const email = req.body.email;
      const newApplication = {
        $set: {
          applicationType: "Approved",
        },
      };
      const result = await pharmacyRegistrationApplication.updateOne(query, newApplication);
      const updateUser = {
        $set: {
          role: "Pharmacist",
        },
      };
      const result2 = await userCollection.updateOne({ email: email }, updateUser);
      res.send({ result, result2 });
    });

    app.delete("/deleteRApplication/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await pharmacyRegistrationApplication.deleteOne(query);
      res.send(result);
    });

    // =========== Users Related apis ===========
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

    // update user Role
    app.patch("/updateUserRole/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const newRole = {
        $set: req.body,
      };
      const result = await userCollection.updateOne(query, newRole);
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
