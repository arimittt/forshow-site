const express = require('express');
const app = express();
let port = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/', function(req,res) {
  res.sendFile(__dirname + '/timeline.html');
});

app.get('/upload', function(req,res) {
  res.sendFile(__dirname + '/upload.html');
});

app.listen(port, () => console.log(`Port: ${port}`));
