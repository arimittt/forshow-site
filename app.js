const express = require('express');
const app = express();
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});
let port = process.env.PORT || 3000;

client.connect();
app.use(express.static('public'));

app.get('/', function(req,res) {
  res.sendFile(__dirname + '/timeline.html');
});

app.get('/upload', function(req,res) {
  res.sendFile(__dirname + '/upload.html');
});

app.listen(port, () => console.log(`Port: ${port}`));
