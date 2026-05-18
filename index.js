const express = require('express');
const dotenv = require('dotenv');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');


const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
dotenv.config();

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


app.get('/', (req, res) => {
  res.send('Hello, World!');
});

async function run() {
  try {

    
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const db = client.db('pet_adoption_platform');
    const petsCollection = db.collection('pets');

    app.get('/pets', async (req, res) => {
      const pets = await petsCollection.find().toArray();
      res.json(pets);
    });

    app.get('/pets/:id', async (req, res) => {
      const { id } = req.params;
      const pet = await petsCollection.findOne({ _id: new ObjectId(id) });
      res.json(pet);
    });

    app.patch('/pets/:id', async (req, res) => {
      const { id } = req.params;
      const updateData = req.body;
      console.log(updateData);
      const result = await petsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );
      res.json(result);
    });

    app.delete('/pets/:id', async (req, res) => {
      const { id } = req.params;
      const result = await petsCollection.deleteOne({ _id: new ObjectId(id) });
      res.json(result);
    });


    app.post('/pets', async (req, res) => {
      const pet = req.body;
      console.log(pet);
      const result = await petsCollection.insertOne(pet);
      res.json(result);
    });





    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
}); 