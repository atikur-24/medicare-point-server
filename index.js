const express = require("express");
const cors = require("cors");
require("dotenv").config();
const SSLCommerzPayment = require('sslcommerz-lts')
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

// ssl config 
const store_id = process.env.PAYMENT_STORE_ID;
const store_passwd = process.env.PAYMENT_STORE_PASSWD;
const is_live = false //true for live, false for sandbox


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
    const orderedMedicinesCollection = database.collection("orderedMedicines");

    // =========== Medicines Related apis ===========
    app.get("/medicines", async (req, res) => {
      const sbn = req.query?.name;
      const sbc = req.query?.category;
      let query = {};

      if (sbn || sbc) {
        // query = { medicine_name: { $regex: sbn, $options: "i" }, category: { $regex: sbc, $options: "i" } };
        query = { medicine_name: { $regex: sbn, $options: "i" } };
      }

      // console.log(sbc, sbn)

      const result = await medicineCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/medicines/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await medicineCollection.findOne(query);
      res.send(result);
    });

    // Adding reviews 
    app.post("/medicines/:id", async (req, res) => {
      const id = req.params.id;
      const review = req.body;

      const filter = { _id: new ObjectId(id) };
      const existingItem = await medicineCollection.findOne(filter);

      const newReview = [...existingItem.allRatings, review];
      let count = 0.0;
      newReview.forEach(r => {
        count += r.rating;
      })

      const options = { upsert: true };
      const updatedRating = {
        $set: {
          rating: parseFloat((count / newReview.length).toFixed(2))
        },
      };

      const updatedRatings = {
        $set: {
          allRatings: newReview
        },
      };

      const result1 = await medicineCollection.updateOne(filter, updatedRating, options);
      const result2 = await medicineCollection.updateOne(filter, updatedRatings, options);
      res.send(result2);
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

    app.post("/blogs", async (req, res) => {
      const newBlog = req.body;
      // console.log(newBlog)
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
        $set: req.body
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

    // interviews 
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

    app.post("/interviews", async (req, res) => {
      const newInterview = req.body;
      // console.log(newBlog)
      const result = await interviewCollection.insertOne(newInterview);
      res.send(result);
    });

    app.put("/interviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedData = {
        $set: req.body
      };
      const result = await interviewCollection.updateOne(query, updatedData);
      res.send(result);
    });

    app.delete("/interviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await interviewCollection.deleteOne(query);
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
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await pharmacyRegistrationApplication.findOne(query);
      res.send(result);
    });

    app.patch("/pharmacyRApprove/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const email = req.body.email
      const newApplication = {
        $set: {
          applicationType: "Approved"
        }
      }
      const result = await pharmacyRegistrationApplication.updateOne(query, newApplication);
      const updateUser = {
        $set: {
          role: "Pharmacist"
        }
      }
      const result2 = await userCollection.updateOne({ email: email }, updateUser);
      res.send({ result, result2 });
    });

    app.delete('/deleteRApplication/:id', async (req, res) => {
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
        $set: req.body
      };
      const result = await userCollection.updateOne(query, newRole);
      res.send(result);
    });


    // =========== Payment getwey ===========
    app.post("/payment", async (req, res) => {
      const paymentData = req.body;
      const cart = paymentData.cart;
      const transId = new ObjectId().toString();

      const {
        name,
        email,
        division,
        district,
        location,
        number,
        totalPayment
      } = paymentData.paymentDetails;

      const data = {
        total_amount: totalPayment,
        currency: 'BDT',
        tran_id: transId, // use unique tran_id for each api call
        success_url: `http://localhost:5000/payment/success/${transId}`,
        fail_url: `http://localhost:5000/payment/fail/${transId}`,
        cancel_url: 'http://localhost:3030/cancel',
        ipn_url: 'http://localhost:3030/ipn',
        shipping_method: 'Courier',
        product_name: 'Computer.',
        product_category: 'Electronic',
        product_profile: 'general',
        cus_name: name,
        cus_email: email,
        cus_add1: location,
        cus_add2: 'Dhaka',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: number,
        cus_fax: '01711111111',
        ship_name: 'Customer Name',
        ship_add1: 'Dhaka',
        ship_add2: 'Dhaka',
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: 1000,
        ship_country: 'Bangladesh',
      };

      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)

      sslcz.init(data).then(apiResponse => {

        const a = cart.map((cp => {
          const { _id, medicine_Id, medicine_name, price, quantity, discount, email, category, image } = cp;
          const singleProduct = {
            transId, cartId: _id, medicine_Id, status: "pending", medicine_name, price, quantity, discount, email, category, image, name, division, district, location, number,
          };
          const createOrder = orderedMedicinesCollection.insertOne(singleProduct);
        }))
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL
        res.send({ url: GatewayPageURL })
        // console.log('Redirecting to: ', GatewayPageURL)
      });

      app.post("/payment/success/:id", async (req, res) => {
        orderedItems = await orderedMedicinesCollection.find({ transId }).toArray();

        orderedItems.forEach(async item => {
          const newStatus = {
            $set: {
              status: "success"
            }
          };

          const query = { _id: new ObjectId(item.medicine_Id) };
          const result1 = await medicineCollection.findOne(query);
          const updateQuantity = {
            $set: {
              sellQuantity: result1.sellQuantity + item.quantity
            }
          };
          const result2 = await orderedMedicinesCollection.updateOne({ _id: new ObjectId(item._id.toString()) }, newStatus);
          const result3 = await medicineCollection.updateOne({ _id: new ObjectId(item.medicine_Id) }, updateQuantity);
          const result4 = await mediCartCollection.deleteOne({ _id: new ObjectId(item.cartId) });

          // console.log("a", result2, result3, result4)
        })

        res.redirect(`http://localhost:5173/paymentSuccess/${req.params.id}`)
      })

      app.post("/payment/fail/:id", async (req, res) => {
        orderedItems = await orderedMedicinesCollection.find({ transId }).toArray();

        orderedItems.forEach(async item => {
          const result = await orderedMedicinesCollection.deleteOne({ _id: new ObjectId(item._id.toString()) });
        })

        res.redirect(`http://localhost:5173/paymentFailed/${req.params.id}`)
      })

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
