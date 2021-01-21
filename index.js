const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

const app = express();
app.use(bodyParser.json())
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.4ft4b.mongodb.net/<dbname>?retryWrites=true&w=majority`;

const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send("It is working");
})

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const collection = client.db(process.env.DB_NAME).collection("appointments");
  console.log("Database Connected Successfully");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})