const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
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
    const database = client.db('medicareDB');
    const medicineCollection = database.collection('medicines');
    const userCollection = database.collection('users');
    const pharmacistCollection = database.collection('pharmacists');
    const medicineCarCollection = database.collection('medicinesCart');

    // medicines apis


    // users apis

    // pharmacist apis
    // sihab molla


    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Medicare Server is running...');
});

app.listen(port, () => {
    console.log(`Medicare is running on port ${5000}`);
})
