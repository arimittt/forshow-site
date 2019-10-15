const express = require('express');
const app = express();
const port = 3000;

app.use(express.static('public'));

app.get('/', function(req,res) {
  res.sendFile(__dirname + '/timeline.html');
});

app.get('/', function(req,res) {
  res.sendFile(__dirname + '/upload.html');
});

app.listen(port, () => console.log(`Port: ${port}`));
