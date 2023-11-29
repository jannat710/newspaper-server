const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken');

// middleware
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5001;


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pvt8fts.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection

        const userCollection = client.db("newsDb").collection("users");

                //JWT
                app.post('/jwt', async (req, res) => {
                    const user = req.body;
                    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' });
                    res.send({ token });
                })
                //middlewares
                const verifyToken = (req, res, next) => {
                    console.log('verify token', req.headers.authorization);
                    if (!req.headers.authorization) {
                        return res.status(401).send({ message: 'unauthorized access' });
                    }
                    const token = req.headers.authorization.split(' ')[1];
                    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                        if (err) {
                            return res.status(401).send({ message: 'unauthorized access' })
                        }
                        req.decoded = decoded;
                        next();
                    })
                }

        //user related API
        // data load
        app.get('/users',verifyToken, async(req, res) => {
            
            const result = await userCollection.find().toArray();
            res.send(result);
        });
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exists', insertedId: null })
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        })





                //Make Admin
                app.patch('/users/admin/:id',  async (req, res) => {
                    const id = req.params.id;
                    const filter = { _id: new ObjectId(id) };
                    const updatedDoc = {
                        $set: {
                            role: 'admin'
                        }
                    }
                    const result = await userCollection.updateOne(filter, updatedDoc);
                    res.send(result);
                })



        //delete user
        app.delete('/users/:id',async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.deleteOne(query);
            res.send(result);
        })




        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('newspaper')
})

app.listen(port, () => {
    console.log(`newsflash is running on port ${port}`);
})