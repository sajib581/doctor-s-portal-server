const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const ObjectId = require('mongodb').ObjectID
const fileUpload = require('express-fileupload')/////
const moment = require('moment');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
var cloudinary = require('cloudinary').v2;
const nodemailer = require('nodemailer')

cloudinary.config({
  cloud_name: 'dy3odhvvh',
  api_key: process.env.CLOUDINARY_API_KEY ,
  api_secret: process.env.CLOUDINARY_API_KEY
});

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASS
  }
})

const app = express();
app.use(bodyParser.json())
app.use(cors());

app.use(express.static('doctors'))   //to call file direct here ex: https://ancient-sea-70147.herokuapp.com/watch.jpg
app.use(fileUpload({
  useTempFiles: true
}));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.4ft4b.mongodb.net/<dbname>?retryWrites=true&w=majority`;

const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send("It is working");
})

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const appointmentsCollection = client.db(process.env.DB_NAME).collection("appointments");
  const doctorsCollection = client.db(process.env.DB_NAME).collection("doctors");

  app.post('/addAppointments', (req, res) => {
    const appointment = req.body;
    appointmentsCollection.insertOne(appointment)
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  })

  app.patch('/changeAppointmentStatus', (req, res) => {
    const { status, id } = req.body
    appointmentsCollection.updateOne(
      { _id: ObjectId(id) },
      {
        $set: { status: status }
      }
    )
      .then(data => {
        res.send(data.modifiedCount > 0)
      })
  })

  app.patch('/addPrescription', (req, res) => {
    const { data, id } = req.body
    appointmentsCollection.updateOne(
      { _id: ObjectId(id) },
      {
        $set: { Prescription: data }
      }
    )
      .then(data => {
        res.send(data.modifiedCount > 0)
      })
  })

  app.get('/appointments', (req, res) => {
    appointmentsCollection.find({})
      .toArray((err, documents) => {
        res.send(documents)
      })
  })

  app.post('/sendAnEmail', (req, res) => {
    data = req.body
    let content = `email: ${data.email} \nmessage: ${data.message} `

    var mailOptions = {
      from: data.email,
      to: process.env.USER_EMAIL   ,  // Change to email address that you want to receive messages on
      subject: data.subject,
      text: content
    }

    transporter.sendMail(mailOptions, (err, data) => {
      if (err) {
        console.log("Error Occured");
        res.send({success: false})
      } else {
        console.log("Email Sent");
        res.send({success: true})
      }
    })
  })
  app.post('/appointmentsByDate', (req, res) => {
    const { date, email, name, uid } = req.body;
    console.log(uid);
    console.log(email);

    doctorsCollection.find({email})
      .toArray((err, documents) => {
        const filter = { date: date }
        console.log(documents.length);
        if (documents.length === 0) {
          if (uid) {
            filter.uid = uid;
          }
          else{
            filter.email = email;
          }          
        }
        appointmentsCollection.find(filter)
          .toArray((err, documents) => {
            res.send(documents)
          })
      })
  })

  app.post('/isDoctor', (req, res) => {
    const { email } = req.body;
    doctorsCollection.find({ email: email })
      .toArray((err, documents) => {
        res.send(documents.length > 0)
      })
  })

  app.get('/doctors', (req, res) => {
    doctorsCollection.find({})
      .toArray((err, documents) => {
        res.send(documents);
      })
  });

  app.post('/addADoctor', (req, res) => { ////
    const file = req.files.file;
    const name = req.body.name;
    const email = req.body.email;

    const doctorsData = { name, email }

    cloudinary.uploader.upload(file.tempFilePath, function (error, result) {

      if (!error) {
        doctorsData.img = result.url;

        doctorsCollection.insertOne(doctorsData)
          .then(result => {
            res.send(result.insertedCount > 0)
          })
      }
    })

    // convert buffer file to real image
    // file.mv(`${__dirname}/doctors/${file.name}`, err => {
    //   if (err) {
    //     console.log(err);
    //     return res.status(500).send({ msg: "Failed to upload image" })
    //   }
    //   return res.send({ name: file.name, path: `/${file.name}` })
    // })
  })

  console.log("Database Connected Successfully");
});

app.listen(port, () => {
  console.log(`Example app listening at port ${port}`)
}) 