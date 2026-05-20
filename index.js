const express = require('express');
const dotenv = require('dotenv');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');


const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
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

const JWKS = createRemoteJWKSet(

  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)  
)


const verifyToken = async(req, res, next) => {
  
  const header = req?.headers.authorization;
  if(!header){
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = header?.split(' ')[1];
  if(!token){
    return res.status(401).json({ message: 'Unauthorized' });
  } 

  try {
     const { payload } = await jwtVerify(token, JWKS)
     console.log(payload);
     next();

  }catch(error)
  {
    return res.status(401).json({ message: 'Unauthorized' }); 

  }
} 




app.get('/', (req, res) => {
  res.send('Hello, World!');
});

async function run() {
  try {

    
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const db = client.db('pet_adoption_platform');
    const petsCollection = db.collection('pets');
    const adoptCollection = db.collection('adoption_requests');



  // Replace only this route in your existing index.js
app.get('/pets', async (req, res) => {
  const { search, species } = req.query;
  const query = {};

  if (search) {
    query.petName = { $regex: search, $options: 'i' };
  }

  if (species) {
    const speciesArr = species.split(',').map(s => s.trim());
    query.species = { $in: speciesArr };
  }

  const pets = await petsCollection.find(query).toArray();
  res.json(pets);
});

    app.get('/pets/:id', verifyToken ,async (req, res) => {
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

  app.get('/adoption-requests/user/:userId', async (req, res) => {
  const { userId } = req.params;
  const requests = await adoptCollection.find({ userId: userId }).toArray();
  res.json(requests);
});
    
app.get('/my-listings', async (req, res) => {
  const { email } = req.query;
  const pets = await petsCollection.find({ ownerEmail: email }).toArray();
  res.json(pets);
});

app.get('/adoption-requests/pet/:petId', async (req, res) => {
  const { petId } = req.params;
  const requests = await adoptCollection.find({ petId }).toArray();
  res.json(requests);
});

app.post('/adoption-requests', async (req, res) => {
  const { petId, userEmail } = req.body;

  const pet = await petsCollection.findOne({ _id: new ObjectId(petId) });

  if (pet?.ownerEmail === userEmail) {
    return res.status(403).json({ error: 'You cannot adopt your own pet' });
  }

  if (pet?.status === 'adopted') {
    return res.status(400).json({ error: 'This pet has already been adopted' });
  }

  const adoptData = {
    ...req.body,
    status: 'pending',
    requestDate: new Date().toISOString(),
  };

  const result = await adoptCollection.insertOne(adoptData);
  res.json(result);
});

app.patch('/adoption-requests/:id', async (req, res) => {
  const { id } = req.params;
  const { status, petId } = req.body;

  if (status === 'approved' && petId) {
    await petsCollection.updateOne(
      { _id: new ObjectId(petId) },
      { $set: { status: 'adopted' } }
    );
    await adoptCollection.updateMany(
      { petId, _id: { $ne: new ObjectId(id) }, status: 'pending' },
      { $set: { status: 'rejected' } }
    );
  }

  const result = await adoptCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { status } }
  );
  res.json(result);
});

app.delete('/adoption-requests/:id', async (req, res) => {
  const { id } = req.params;
  const result = await adoptCollection.deleteOne({ _id: new ObjectId(id) });
  res.json(result);
});



    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
}); 