const express = require('express');
const app = express();
const { MongoClient, ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const mongoURI = 'mongodb://127.0.0.1:27017/';
const dbName = 'hackathan_db';
const collectionName = 'fs';

MongoClient.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        console.log('Connected to MongoDB');
        const db = client.db(dbName);
        const gfs = Grid(db, mongoose.mongo);

        app.get('/', (req, res) => {
            res.sendFile(__dirname + '/index.html');
        });

        app.get('/file/:id', async (req, res) => {
          try {
              const fileId = req.params.id;
              console.log('File ID:', fileId);
              
              const file = await gfs.files.findOne({ _id: new ObjectId(fileId) });
              console.log('File found:', file);
      
              if (!file) {
                  return res.status(404).send('File not found');
              }
      
              if (!gfs || !gfs.chunks) {
                  return res.status(500).send('GridFS is not properly initialized');
              }
      
              const chunks = await gfs.chunks.find({ files_id: file._id }).toArray();
              console.log('Chunks found:', chunks.length);
              console.log('File attempt:', chunks)
      
              if (chunks.length === 0) {
                  return res.status(404).send('File not found');
              }
      
              let fileData = Buffer.concat(chunks.map(chunk => chunk.data));
      
              res.setHeader('Content-Type', file.contentType);
              res.send(fileData);
          } catch (err) {
              console.error(err);
              res.status(500).send('Internal Server Error');
          }
      });
      

        const port = 3000;
        app.listen(port, () => {
            console.log(`Server is running on http://127.0.0.1:${port}`);
        });
    })
    .catch(err => console.error(err));
