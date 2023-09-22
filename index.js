const express = require("express");
const cors = require("cors");
require("dotenv").config();
const moment = require("moment");
const SSLCommerzPayment = require("sslcommerz-lts");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const orderDate = moment().format("Do MMM YY, h:mm a");
const dateAndTime = moment().format("MMMM Do YYYY, h:mm:ss a");

// mongodb code start
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@team-gladiators.2x9sw5e.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, { useUnifiedTopology: true }, { useNewUrlParser: true }, { connectTimeoutMS: 30000 }, { keepAlive: 1 });
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
});

// ssl config
const store_id = process.env.PAYMENT_STORE_ID;
const store_passwd = process.env.PAYMENT_STORE_PASSWD;
const is_live = false; //true for live, false for sandbox

async function run() {
  try {
    client.connect((err) => {
      if (err) {
        console.error(err);
        console.log("HELLO ERRRRRRRRRRRRRRRRRR RRRRRR");
        return;
      }
    });
    // database collection
    const database = client.db("medicareDB");
    // medicine
    const medicineCollection = database.collection("medicines");
    const mediCartCollection = database.collection("medicinesCart");
    const orderedMedicinesCollection = database.collection("orderedMedicines");
    const reqToStockMedicineCollection = database.collection("requestToStockMedi");
    const reqNewMedicineCollection = database.collection("reqNewMedi");
    // lab test
    const labCategoryCollection = database.collection("labCategories");
    const labItemsCollection = database.collection("labItems");
    const labCartCollection = database.collection("labsCart");
    const bookedLabTestCollection = database.collection("bookedLabTest");
    // users
    const userCollection = database.collection("users");
    const pharmacyRegistrationApplication = database.collection("P.R. Applications");
    const pharmacistCollection = database.collection("pharmacists");
    // health tips & blog
    const healthTipsCollection = database.collection("healthTips");
    const blogCollection = database.collection("blogs");
    // general
    const imagesCollection = database.collection("images");
    const imagesNotifications = database.collection("notifications");
    const prescriptionCollection = database.collection("prescription");
    const dashboardDataCollection = database.collection("dashboardData");
    const discountCodesCollection = database.collection("discountCodes");
    const feedbackCollection = database.collection("feedback");

    // =========== Medicines Related apis ===========
    app.get("/all-medicines", async (req, res) => {
      const needData = { _id: 1, medicine_name: 1, image: 1, available_quantity: 1, sellQuantity: 1, pharmacist_name: 1, pharmacist_email: 1, status: 1 };
      const result = await medicineCollection.find({}, { projection: needData }).toArray();
      res.send(result);
    });

    // home page search medicines
    app.get("/searchMedicinesByName", async (req, res) => {
      const needData = { _id: 1, medicine_name: 1, image: 1, price: 1, discount: 1, category: 1, available_quantity: 1, sellQuantity: 1 };
      const sbn = req.query?.name;
      let query = { status: "approved" };

      if (sbn) {
        query = { ...query, medicine_name: { $regex: sbn, $options: "i" } };
      }
      const result = await medicineCollection.find(query, { projection: needData }).toArray();
      res.send(result);
    });

    // status approved;
    app.get("/medicines", async (req, res) => {
      const query = { status: "approved" };
      let sortObject = {};
      const needData = { _id: 1, medicine_name: 1, image: 1, price: 1, discount: 1, category: 1, available_quantity: 1, sellQuantity: 1, pharmacist_email: 1, rating: 1, order_quantity: 1 };

      switch (req.query.sort) {
        case "phtl":
          sortObject = { price: 1 };
          break;
        case "plth":
          sortObject = { price: -1 };
          break;
        case "byRating":
          sortObject = { rating: -1 };
          break;
        case "fNew":
          sortObject = { date: -1 };
          break;
        case "fOld":
          sortObject = { date: 1 };
          break;
        default:
          break;
      }

      // FOR FINDING DATA WITHOUT SPECIFIC FIELD (IMPORTANT)
      // const result = await medicineCollection
      //   .find(query, { projection: { feature_with_details: 0, medicine_description: 0 } })
      //   .sort(sortObject)
      //   .toArray();

      // FOR FINDING DATA WITH SPECIFIC FIELD
      const result = await medicineCollection.find(query, { projection: needData }).sort(sortObject).toArray();
      res.send(result);
    });

    // highest selling medicines
    app.get("/highestSelling-medicines", async (req, res) => {
      const query = { status: "approved" };
      const needData = { _id: 1, medicine_name: 1, image: 1, price: 1, discount: 1, category: 1, available_quantity: 1, sellQuantity: 1, pharmacist_email: 1, rating: 1, order_quantity: 1 };
      const sorting = {
        sort: { sellQuantity: -1 },
        limit: 10,
      };
      const result = await medicineCollection.find(query, { projection: needData, ...sorting }).toArray();
      res.send(result);
    });

    // top rated medicines
    app.get("/topRated-medicines", async (req, res) => {
      const query = { status: "approved" };
      const needData = { _id: 1, medicine_name: 1, image: 1, price: 1, discount: 1, rating: 1 };
      const sorting = {
        sort: { rating: -1 },
        limit: 5,
      };
      const result = await medicineCollection.find(query, { projection: needData, ...sorting }).toArray();
      res.send(result);
    });

    app.get("/medicinesc", async (req, res) => {
      const needData = { _id: 1, medicine_name: 1, image: 1, price: 1, discount: 1, category: 1, available_quantity: 1, sellQuantity: 1, pharmacist_email: 1, rating: 1, order_quantity: 1 };
      const category = req.query.category;
      const query = {
        "category.value": category,
        status: "approved",
      };
      const result = await medicineCollection.find(query, { projection: needData }).toArray();
      res.send(result);
    });

    app.get("/medicines/details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await medicineCollection.findOne(query);
      res.send(result);
    });

    app.get("/pharmacistMedicines", async (req, res) => {
      const needData = { _id: 1, medicine_name: 1, image: 1, available_quantity: 1, sellQuantity: 1, status: 1 };
      const email = req.query.email;
      if (!email) {
        res.send([]);
      }
      const query = { pharmacist_email: email };
      const result = await medicineCollection.find(query, { projection: needData }).toArray();
      res.send(result);
    });

    app.post("/medicines", async (req, res) => {
      const newMedicine = req.body;
      const result = await medicineCollection.insertOne(newMedicine);
      res.send(result);
    });

    // Adding reviews
    app.post("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const review = req.body;
      const filter = { _id: new ObjectId(id) };
      const existingItem = await medicineCollection.findOne(filter);
      const newReview = [...existingItem.allRatings, review];
      let count = 0.0;
      newReview.forEach((r) => {
        count += r.rating;
      });

      const options = { upsert: true };
      const updatedRating = {
        $set: {
          rating: parseFloat((count / newReview.length).toFixed(2)),
        },
      };

      const updatedRatings = {
        $set: {
          allRatings: newReview,
        },
      };

      const result1 = await medicineCollection.updateOne(filter, updatedRating, options);
      const result2 = await medicineCollection.updateOne(filter, updatedRatings, options);
      res.send(result2);
    });

    app.put("/update-medicine/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      // Remove the _id field from the updatedData
      delete updatedData._id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedMedicine = {
        $set: { ...updatedData },
      };
      const result = await medicineCollection.updateOne(filter, updatedMedicine, options);
      res.send(result);
    });

    app.patch("/medicine-status/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateStatus = {
        $set: req.body,
      };
      const result = medicineCollection.updateOne(query, updateStatus);
      res.send(result);
    });

    app.delete("/medicines/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await medicineCollection.deleteOne(query);
      res.send(result);
    });

    app.put("/medicine-feedback/:id", async (req, res) => {
      const id = req.params.id;
      const updatedFeedback = req.body;
      const query = { _id: new ObjectId(id) };
      const newFeedback = {
        $set: { feedback: updatedFeedback.feedback },
      };
      const result = await medicineCollection.updateOne(query, newFeedback, { upsert: true });
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

    app.patch("/update-quantity/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateQuantity = {
        $set: req.body,
      };
      const result = await mediCartCollection.updateOne(query, updateQuantity);
      res.send(result);
    });

    // =========== Medicine Order related apis ===========
    // for customer order history
    app.get("/medicinesOrder", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send({ message: "Email Not Found" });
      }
      const query = { email: email };
      const result = await orderedMedicinesCollection.find(query).toArray();
      res.send(result);
    });

    // medicine ordered apis for pharmacist dashboard (pharmacist)
    app.get("/medicinesOrderByPharmacistWithResponse", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send({ message: "Email Not Found" });
      }
      const query = { pharmacist_email: email, status: "success", pharmacist_response: false };
      const result = await orderedMedicinesCollection.find(query).toArray();
      res.send(result);
    });

    // for all medicine  order history (pharmacist)
    app.get("/medicinesOrderByPharmacist", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send({ message: "Email Not Found" });
      }
      const query = { pharmacist_email: email, status: "success" };
      const result = await orderedMedicinesCollection.find(query).toArray();
      res.send(result);
    });

    // order conformation (pharmacist)
    app.patch("/pharmacistResponse", async (req, res) => {
      const id = req.body.id;
      const updateResponse = {
        $set: {
          pharmacist_response: true,
          delivery_status: "packing",
        },
      };
      const result = await orderedMedicinesCollection.updateOne({ _id: new ObjectId(id) }, updateResponse);
      res.send(result);
    });

    // all medicine for admin
    app.get("/medicinesOrderByAdmin", async (req, res) => {
      const result = await orderedMedicinesCollection.find().toArray();
      res.send(result);
    });

    // medicine details for admin
    app.get("/medicinesOrderByAdmin/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await orderedMedicinesCollection.findOne(query);
      res.send(result);
    });

    // =========== Request to stock & request new medicines related apis ===========
    // request to stock
    app.get("/requestToStock/:email", async (req, res) => {
      const email = req.params.email;
      const query = { pharmacist_email: email };
      if (!email) {
        res.send({ message: "No Request Medicine found Found" });
      }
      const result = await reqToStockMedicineCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/requestToStock", async (req, res) => {
      const medicineRequest = req.body;
      const filterMediReq = { reqByMedicine_Id: medicineRequest.reqByMedicine_Id };
      const existRequest = await reqToStockMedicineCollection.findOne(filterMediReq);
      if (existRequest) {
        const updateCountDate = {
          $set: {
            request_count: existRequest.request_count + 1,
            date: existRequest.date,
          },
        };
        const rquestUpdate = await reqToStockMedicineCollection.updateOne(filterMediReq, updateCountDate);
        res.send(rquestUpdate);
      } else {
        const result = await reqToStockMedicineCollection.insertOne(medicineRequest);
        res.send(result);
      }
    });

    app.delete("/requestToStock/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reqToStockMedicineCollection.deleteOne(query);
      res.send(result);
    });

    // request for new medicine
    app.get("/requestNewMedicine", async (req, res) => {
      const result = await reqNewMedicineCollection.find().toArray();
      res.send(result);
    });

    app.post("/requestNewMedicine", async (req, res) => {
      const newMediReq = req.body;
      const result = await reqNewMedicineCollection.insertOne(newMediReq);
      res.send(result);
    });

    app.delete("/requestNewMedicine/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reqNewMedicineCollection.deleteOne(query);
      res.send(result);
    });

    // =========== Lab Test related apis ===========
    app.get("/labCategories", async (req, res) => {
      const result = await labCategoryCollection.find().toArray();
      res.send(result);
    });

    app.get("/adminLabBooking", async (req, res) => {
      const result = await bookedLabTestCollection.find().toArray();
      res.send(result);
    });

    app.get("/labBooking", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      }
      const query = { email: email };
      const result = await bookedLabTestCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/labCategory/:id", async (req, res) => {
      const id = req.params.id;
      const result = await labCategoryCollection.find({ _id: new ObjectId(id) }).toArray();
      res.send(result);
    });

    app.get("/labAllItems", async (req, res) => {
      const sbn = req.query?.name;
      let query = {};

      if (sbn != "undefined") {
        //it is made for lab search
        query = { test_name: { $regex: sbn, $options: "i" } };
      }

      const result = await labItemsCollection
        .find(query, { projection: { labTestDetails: 0 } })
        .sort({ report: 1 })
        .toArray();
      res.send(result);
    });

    app.get("/labAllItems/:id", async (req, res) => {
      const id = req.params.id;
      if (id) {
        const result = await labItemsCollection.findOne({ _id: new ObjectId(id) });
        res.send(result);
      }
    });

    app.get("/labPopularItems", async (req, res) => {
      const result = await labItemsCollection
        .find({}, { projection: { labTestDetails: 0 } })
        .sort({
          totalBooked: -1,
        })
        .toArray();
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

    app.put("/labItems/:id", async (req, res) => {
      // const id = req.params.id;
      const { data, _id } = req.body;
      delete data._id;

      // const { image_url, PhoneNumber, labNames, labTestDetails, popularCategory, category, price, test_name, discount, city } = body;

      const filter = { _id: new ObjectId(_id) };
      const options = { upsert: true };

      const updatedLabTest = {
        // $set: { image_url, PhoneNumber, labNames, labTestDetails, popularCategory, category, price, test_name, discount, city, remaining }
        $set: { ...data },
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
      const unnecessaryData = { prevention: 0, cure: 0, doctorDepartment: 0, date: 0, doctorName: 0 };
      const result = await healthTipsCollection.find({}, { projection: unnecessaryData }).toArray();
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

    app.put("/allHealthTips/:id", async (req, res) => {
      const id = req.params.id;
      // const { body } = req.body;
      console.log(id, req.body);
      const { category, name, image, type, cause, cure, prevention, doctorDepartment, doctorName, date } = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };

      const updatedHealthTips = {
        $set: { category, name, image, type, cause, cure, prevention, doctorDepartment, doctorName, date },
      };
      const result = await healthTipsCollection.updateOne(filter, updatedHealthTips, options);
      res.send(result);
    });

    // =========== Blog Related apis ===========
    app.get("/blogs", async (req, res) => {
      const unnecessaryData = { content_details: 0, author: 0 };
      const result = await blogCollection.find({}, { projection: unnecessaryData }).toArray();
      res.send(result);
    });

    app.post("/blogs", async (req, res) => {
      const newBlog = req.body;
      const result = await blogCollection.insertOne(newBlog);
      res.send(result);
    });

    app.get("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogCollection.findOne(query);
      res.send(result);
    });

    app.put("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedData = {
        $set: req.body,
      };
      const result = await blogCollection.updateOne(query, updatedData);
      res.send(result);
    });

    app.delete("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogCollection.deleteOne(query);
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
      // const body = req.body
      const newApplication = {
        $set: {
          applicationType: req?.body?.applicationType,
        },
      };
      const result = await pharmacyRegistrationApplication.updateOne(query, newApplication);
      const updateUser = {
        $set: {
          role: req?.body?.role,
          pharmacistDetail: req?.body?.pharmacistDetail,
        },
      };
      const result2 = await userCollection.updateOne({ email: email }, updateUser, { upsert: true });
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
    app.put("/users/:email", async (req, res) => {
      const userEmail = req.params.email; // Get the user's email from the URL parameter
      const updatedUserData = req.body; // User data to update

      // Create a query to find the user by their email
      const query = { email: userEmail };

      // Check if the user with the specified email exists
      const existingUser = await userCollection.findOne(query);

      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update the user's profile data
      const updateResult = await userCollection.updateOne(query, { $set: updatedUserData });

      if (updateResult.modifiedCount === 0) {
        return res.status(500).json({ message: "Failed to update user profile" });
      }

      res.status(200).json({ message: "User profile updated successfully" });
    });
    app.get("/users/:email", async (req, res) => {
      const userEmail = req.params.email; // Get the user's email from the URL parameter

      // Create a query to find the user by their email
      const query = { email: userEmail };

      // Find the user based on the email
      const user = await userCollection.findOne(query);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return the user's profile data as a JSON response
      res.status(200).json(user);
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

    app.get("/all-pharmacist/:role", async (req, res) => {
      const role = req.params.role;
      const query = { role: role };
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/delete-user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    // =========== Feedback apis ===========
    app.get("/feedback", async (req, res) => {
      const result = await feedbackCollection.find().toArray();
      res.send(result);
    });
    app.post("/feedback", async (req, res) => {
      const feedback = req.body;
      const result = await feedbackCollection.insertOne(feedback);
      res.send(result);
    });

    // =========== Payment getwey ===========
    app.post("/payment", async (req, res) => {
      const paymentData = req.body;
      const cart = paymentData.cart;
      const discountCode = paymentData?.discountCode;
      const transId = new ObjectId().toString();

      const { name, email, division, district, location, number, totalPayment } = paymentData.paymentDetails;

      const points = ((10 * totalPayment) / 100).toFixed(2);

      const data = {
        total_amount: totalPayment,
        currency: "BDT",
        tran_id: transId, // use unique tran_id for each api call
        success_url: `http://localhost:5000/payment/success/${transId}?discountCode=${discountCode}&email=${email}&points=${points}`,
        fail_url: `http://localhost:5000/payment/fail/${transId}`,
        cancel_url: `http://localhost:5000/payment/fail/${transId}`,
        ipn_url: "http://localhost:3030/ipn",
        shipping_method: "Courier",
        product_name: "Computer.",
        product_category: "Electronic",
        product_profile: "general",
        cus_name: name,
        cus_email: email,
        cus_add1: location,
        cus_add2: "Dhaka",
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: number,
        cus_fax: "01711111111",
        ship_name: "Customer Name",
        ship_add1: "Dhaka",
        ship_add2: "Dhaka",
        ship_city: "Dhaka",
        ship_state: "Dhaka",
        ship_postcode: 1000,
        ship_country: "Bangladesh",
      };

      const currentDate = moment();
      // Add 1-3 days to the current date
      const oneDaysAhead = currentDate.add(1, "days").format("DD MMM");
      const threeDaysAhead = currentDate.add(3, "days").format("DD MMM YYYY");

      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);

      sslcz.init(data).then((apiResponse) => {
        const a = cart.map(async (cp) => {
          const { _id, medicine_Id, medicine_name, price, quantity, discount, email, category, image } = cp;
          const singleProduct = {
            dateAndTime,
            expectedDate: [oneDaysAhead, threeDaysAhead],
            dateAndTime,
            transId,
            cartId: _id,
            medicine_Id,
            status: "pending",
            delivery_status: "pending",
            pharmacist_response: false,
            medicine_name,
            price,
            quantity,
            discount,
            email,
            category,
            image,
            name,
            division,
            district,
            location,
            number,
          };
          const createOrder = await orderedMedicinesCollection.insertOne(singleProduct);
        });
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL;
        res.send({ url: GatewayPageURL, transId });
        // console.log('Redirecting to: ', GatewayPageURL)
      });

      app.post("/payment/success/:id", async (req, res) => {
        const transId = req.params.id;
        const discountCode = req.query.discountCode;
        const email = req.query.email;
        const points = req.query.points;

        const userInfo = await userCollection.findOne({ email: email }, { projection: { rewardPoints: 1, promoCodes: 1 } });
        console.log(userInfo);

        if (!userInfo?.rewardPoints) {
          const updateInfo = {
            $set: {
              rewardPoints: parseFloat(points).toFixed(2),
            },
          };
          const addedReward = await userCollection.updateOne({ email: email }, updateInfo, { upsert: true });
        } else {
          const newPoint = (parseFloat(points) + parseFloat(userInfo.rewardPoints)).toFixed(2);
          const updateInfo = {
            $set: {
              rewardPoints: newPoint,
            },
          };
          const addedReward = await userCollection.updateOne({ email: email }, updateInfo, { upsert: true });
        }

        if (!userInfo?.promoCodes && discountCode === "WELCOME50") {
          const updateInfo = {
            $set: {
              promoCodes: [discountCode],
            },
          };
          const updatePromo = await userCollection.updateOne({ email: email }, updateInfo, { upsert: true });
        }

        if (discountCode === "REWARD50") {

          const updateInfo = {
            $set: {
              rewardToDiscount: ""
            },
          };
          const updatePromo = await userCollection.updateOne({ email: email }, updateInfo, { upsert: true });
        }

        // return;

        orderedItems = await orderedMedicinesCollection.find({ transId }).toArray();

        orderedItems.forEach(async (item) => {
          const query = { _id: new ObjectId(item.medicine_Id) };
          const result1 = await medicineCollection.findOne(query);

          const url = "dashboard/order-history";
          const deliveryTime = "Your order is being processing";

          const notificationData = {
            name: `New order: ${item.medicine_name}`,
            read: "no",
            email: item.email,
            date: orderDate,
            photoURL: item.image,
            url,
            deliveryTime,
            pharmacist_email: result1.pharmacist_email,
          };

          const newStatus = {
            $set: {
              status: "success",
              pharmacist_email: result1.pharmacist_email,
            },
          };

          const options = { upsert: true };
          const updateQuantity = {
            $set: {
              sellQuantity: result1.sellQuantity + item.quantity,
            },
          };
          const result2 = await orderedMedicinesCollection.updateOne({ _id: new ObjectId(item._id.toString()) }, newStatus, options);
          const result3 = await medicineCollection.updateOne({ _id: new ObjectId(item.medicine_Id) }, updateQuantity);
          const result4 = await mediCartCollection.deleteOne({ _id: new ObjectId(item.cartId) });
          const storeNotification = await imagesNotifications.insertOne(notificationData);

          // console.log("a", result2, result3, result4)
        });

        res.redirect(`http://localhost:5173/paymentSuccess/${req.params.id}`);
      });

      app.post("/payment/fail/:id", async (req, res) => {
        const transId = req.params.id;
        orderedItems = await orderedMedicinesCollection.find({ transId }).toArray();

        orderedItems.forEach(async (item) => {
          const result = await orderedMedicinesCollection.deleteOne({ _id: new ObjectId(item._id.toString()) });
        });

        res.redirect(`http://localhost:5173/paymentFailed/${req.params.id}`);
      });
    });


    // Lab payment api 
    app.post("/labPayment", async (req, res) => {
      const paymentData = req.body;
      const cart = paymentData.cart;
      const transId = new ObjectId().toString();

      const { name, mobile, email, address, dateTime, age, note, area } = paymentData.personalInfo;

      let totalPayment = 0.0 + 50.0; // or report
      cart.forEach((singleItem) => {
        totalPayment += singleItem.remaining;
      });

      const points = ((5 * totalPayment) / 100).toFixed(2);

      const data = {
        total_amount: totalPayment,
        currency: "BDT",
        tran_id: transId, // use unique tran_id for each api call
        success_url: `http://localhost:5000/payment/success/${transId}?email=${email}&points=${points}`,
        fail_url: `http://localhost:5000/payment/fail/${transId}`,
        cancel_url: `http://localhost:5000/payment/fail/${transId}`,
        ipn_url: "http://localhost:3030/ipn",
        product_name: "Lab test.",
        product_category: "lab test",
        product_profile: "general",
        cus_name: name,
        cus_email: email,
        cus_add1: area,
        cus_add2: address,
        cus_city: area,
        cus_country: "Bangladesh",
        cus_phone: mobile,
        ship_name: name,
        ship_country: "Bangladesh",

        shipping_method: "Courier",
        cus_state: "Dhaka",
        cus_postcode: "1000",
        cus_fax: "01711111111",
        ship_add1: "Dhaka",
        ship_add2: "Dhaka",
        ship_city: "Dhaka",
        ship_state: "Dhaka",
        ship_postcode: 1000,
      };

      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);

      sslcz.init(data).then((apiResponse) => {
        const a = cart.map(async (cp) => {
          const cartId = cp._id;
          delete cp._id;

          const singleProduct = {
            transId,
            cartId: cartId,
            status: "initiate",
            ...cp,
            ...paymentData.personalInfo,
          };

          const createOrder = await bookedLabTestCollection.insertOne(singleProduct);
        });

        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL;
        res.send({ url: GatewayPageURL, transId, totalPayment });
        // console.log('Redirecting to: ', GatewayPageURL)
      });

      app.post("/payment/success/:id", async (req, res) => {
        const transId = req.params.id;
        orderedItems = await bookedLabTestCollection.find({ transId }).toArray();

        const email = req.query.email;
        const points = req.query.points;
        const userInfo = await userCollection.findOne({ email: email }, { projection: { rewardPoints: 1 } });

        if (!userInfo?.rewardPoints) {
          const updateInfo = {
            $set: {
              rewardPoints: parseFloat(points).toFixed(2),
            },
          };
          const addedReward = await userCollection.updateOne({ email: email }, updateInfo, { upsert: true });
        } else {
          const newPoint = (parseFloat(points) + parseFloat(userInfo.rewardPoints)).toFixed(2);
          const updateInfo = {
            $set: {
              rewardPoints: newPoint,
            },
          };
          const addedReward = await userCollection.updateOne({ email: email }, updateInfo, { upsert: true });
        }

        const url = "dashboard/booked-lab-tests";
        const deliveryTime = "We will collect sample at your chosen time";

        orderedItems.forEach(async (item) => {
          const query = { _id: new ObjectId(item.lab_id) };
          const result1 = await labItemsCollection.findOne(query);

          const newStatus = {
            $set: {
              status: "pending",
            },
          };
          // const testName = orderedItems.test_name

          const updateQuantity = {
            $set: {
              totalBooked: result1.totalBooked + 1,
            },
          };

          const notificationData2 = {
            name: `LabBooked: ${item.test_name}`,
            email: item.email,
            date: orderDate,
            photoURL: "https://i.ibb.co/QcwbgTF/lab.png",
            url,
            deliveryTime,
            read: "no",
          };
          const options = { upsert: true };

          const result2 = await bookedLabTestCollection.updateOne({ _id: new ObjectId(item._id.toString()) }, newStatus, options);
          const result3 = await labItemsCollection.updateOne({ _id: new ObjectId(item.lab_id) }, updateQuantity, options);
          const result4 = await labCartCollection.deleteOne({ _id: new ObjectId(item.cartId) });
          const storeNotification = await imagesNotifications.insertOne(notificationData2);
        });

        res.redirect(`http://localhost:5173/paymentSuccess/${req.params.id}`);
      });

      app.post("/payment/fail/:id", async (req, res) => {
        const transId = req.params.id;
        orderedItems = await bookedLabTestCollection.find({ transId }).toArray();

        orderedItems.forEach(async (item) => {
          const result = await bookedLabTestCollection.deleteOne({ _id: new ObjectId(item._id.toString()) });
        });

        res.redirect(`http://localhost:5173/paymentFailed/${req.params.id}`);
      });
    });

    // upload images
    app.get("/images", async (req, res) => {
      const email = req.query?.email;
      const name = req.query?.name;
      let query = { email: email };

      if (name != "undefined") {
        query = { ...query, name: { $regex: name, $options: "i" } };
      }

      const result = await imagesCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/images", async (req, res) => {
      const query = req?.query?.collectionName;
      const data = req.body;

      if (query === "prescription") {
        data.read = "no";
        const result = await prescriptionCollection.insertOne(data);
        res.send(result);
        return;
      }

      const result = await imagesCollection.insertOne(data);
      res.send(result);
    });

    app.delete("/images/:id", async (req, res) => {
      const id = req.params.id;
      const result = await imagesCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // Notification
    app.get("/notifications", async (req, res) => {
      const email = req.query?.email;
      const role = req.query?.role;
      let query = {
        $or: [{ email: email }, { receiver: role }, { pharmacist_email: email }],
      };

      const result = await imagesNotifications.find(query).sort({ date: -1 }).toArray();
      res.send(result);
    });

    app.post("/notifications", async (req, res) => {
      const data = req.body;
      data.read = "no";
      const result = await imagesNotifications.insertOne(data);
      res.send(result);
    });

    app.delete("/notifications/:id", async (req, res) => {
      const id = req.params.id;
      const result = await imagesNotifications.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.patch("/notifications", async (req, res) => {
      const data = req.body;

      data.forEach((d) => {
        const updateStatus = {
          $set: {
            read: "yes",
          },
        };
        const result = imagesNotifications.updateOne({ _id: new ObjectId(d) }, updateStatus, { upsert: true });
      });
      res.send("Make all notifications as read");
    });

    app.post("/sendNotification", async (req, res) => {
      const data = req.body;
      data.read = "no";
      data.date = orderDate;
      const result = await imagesNotifications.insertOne(data);
      res.send(result);
    });

    // prescription
    app.get("/prescriptions", async (req, res) => {
      const result = await prescriptionCollection.find().sort({ date: -1 }).toArray();
      res.send(result);
    });

    //adding prescribed items to cart
    app.post("/prescriptions", async (req, res) => {
      const data = req.body;
      let result;
      data.cart?.map(async (singleCart) => {
        result = await mediCartCollection.insertOne(singleCart);
      });

      const newStatus = {
        $set: {
          status: "success",
        },
      };
      const options = { upsert: true };
      const result2 = await prescriptionCollection.updateOne({ _id: new ObjectId(data.id) }, newStatus, options);

      const notificationData = {
        name: "Medicines has been added to your cart",
        read: "no",
        email: data?.cart[0]?.email,
        date: orderDate,
        photoURL: "https://i.ibb.co/7YZdDdC/ppppppp.png",
        url: "medicineCarts",
        deliveryTime: "Now your can make the order",
      };
      const result3 = await imagesNotifications.insertOne(notificationData);

      res.send(result2);
    });

    app.delete("/prescriptions/:id", async (req, res) => {
      const id = req.params.id;
      const result = await prescriptionCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // Dashboard home
    app.get("/dashboardHomeData/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });

      if (user?.role === "admin") {
        const allUsers = await userCollection.find({ role: "user" }, { projection: { role: 1 } }).toArray();
        const allPharmacists = await userCollection.find({ role: "Pharmacist" }, { projection: { role: 1 } }).toArray();
        const allAdmin = await userCollection.find({ role: "admin" }, { projection: { role: 1 } }).toArray();
        const allMedicines = await medicineCollection.find({ status: "approved" }, { projection: { status: 1 } }).toArray();
        const allLabs = await labItemsCollection.find({}, { projection: { test_name: 1 } }).toArray();

        const users = allUsers.length;
        const pharmacist = allPharmacists.length;
        const admin = allAdmin.length;
        const medicines = allMedicines.length;
        const labTests = allLabs.length;
        const brands = 8;
        const labs = 15;

        const info = { users, pharmacist, admin, medicines, labTests, brands, labs };
        res.send(info);
        return;
      }

      if (user?.role === "Pharmacist") {
        const allMedicines = await medicineCollection.find({ status: "approved" }, { projection: { status: 1 } }).toArray();
        const allOrders = await orderedMedicinesCollection.find({ status: "success" }, { projection: { status: 1 } }).toArray();
        const allPendingOrders = await orderedMedicinesCollection.find({ status: "success", delivery_status: "pending" }, { projection: { delivery_status: 1 } }).toArray();
        const allSuccessOrders = await orderedMedicinesCollection.find({ status: "success", delivery_status: "success" }, { projection: { delivery_status: 1 } }).toArray();
        const allMedicineRequest = await reqNewMedicineCollection.find({ status: "requesting" }, { projection: { status: 1 } }).toArray();

        const medicines = allMedicines.length || 10;
        const orders = allOrders.length || 10;
        const pendingOrders = allPendingOrders.length || 5;
        const successOrder = allSuccessOrders.length || 5;
        const medicineRequest = allMedicineRequest.length || 10;

        const info = { medicines, orders, pendingOrders, successOrder, medicineRequest };
        res.send(info);
        return;

      }

      res.send({ data: "Unauthorized request!" });
    });

    // discount codes
    app.get("/discountCodes/:email", async (req, res) => {
      const email = req.params.email;
      // console.log(email)
      const user = await userCollection.findOne({ email: email });

      if (user?.role === "admin") {
        const discountCodes = await discountCodesCollection.find().toArray();
        res.send(discountCodes);
        return;
      }
      res.send("Your are not valid user!");
    });

    app.post("/discountCodes", async (req, res) => {
      const data = req.body;

      const query = {
        // discountName: { $regex: data.discountName, $options: "i" }
        discountName: data.discountName,
      };
      const isExist = await discountCodesCollection.findOne(query);

      if (isExist !== null) {
        res.send({ message: "This discount code name already exist" });
      } else {
        const result = await discountCodesCollection.insertOne(data);
        res.send(result);
      }
    });

    app.patch("/discountCodes", async (req, res) => {
      const data = req.body.data;
      const id = req.body.id;

      const updatedData = {
        $set: {
          discount: data.discount,
          discountType: data.discountType,
          status: data.status,
        },
      };

      const result = await discountCodesCollection.updateOne({ _id: new ObjectId(id) }, updatedData);
      res.send(result);
    });

    app.delete("/discountCodes/:id", async (req, res) => {
      const id = req.params.id;
      const result = await discountCodesCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
      return;
    });

    // checking user's inserted discount code
    app.post("/isValidDiscount", async (req, res) => {
      const data = req.body;
      const promo = data.promoCode;
      const email = data.email;

      if (promo === "WELCOME50") {
        const user = await userCollection.findOne({ email }, { projection: { promoCodes: 1 } });
        const promoCodes = user?.promoCodes?.includes("WELCOME50");
        if (promoCodes) {
          return res.send({ message: "This discount code has been used!" });
        }
      }

      if (promo === "REWARD50") {
        const user = await userCollection.findOne({ email }, { projection: { rewardToDiscount: 1 } });
        if (user?.rewardToDiscount !== "REWARD50") {
          return res.send({ message: "This discount code is not for your!" });
        }
      }

      const query = {
        discountName: promo,
      };
      const isExist = await discountCodesCollection.findOne(query);
      if (isExist !== null && isExist.status === "Active") {
        res.send({ message: "Discount code used successfully", success: true, discountType: isExist.discountType, discount: parseFloat(isExist.discount) });
      } else {
        res.send({ message: "Discount code is invalid" });
      }
    });

    // Reward points to discount code converter 
    app.post("/rewardToDiscount", async (req, res) => {
      const email = req.body?.email;
      const userInfo = await userCollection.findOne({ email: email }, { projection: { rewardPoints: 1 } });

      const newReward = parseFloat(userInfo?.rewardPoints) - 5000;

      const updateInfo = {
        $set: {
          rewardToDiscount: "REWARD50",
          rewardPoints: parseFloat(newReward)
        },
      }
      const discountCodeCreated = await userCollection.updateOne({ email: email }, updateInfo, { upsert: true });
      res.send(discountCodeCreated);

    })

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
