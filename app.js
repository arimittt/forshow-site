const express = require('express');
const app = express();
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});
const aws = require('aws-sdk');
const S3_BUCKET = process.env.S3_BUCKET;
let port = process.env.PORT || 3000;

client.connect();
app.set('views', './views');
app.use(express.static('public'));
aws.config.region = 'eu-central-1';

app.get('/', (req,res) => {
  res.sendFile(__dirname + '/views/timeline.html');
});

app.get('/upload', (req,res) => {
  res.sendFile(__dirname + '/views/upload.html');
});

app.get('/sign-s3', (req, res) => {
  const s3 = new aws.S3();
  const fileName = req.query['file-name'];
  const fileType = req.query['file-type'];
  const s3Params = {
    Bucket: S3_BUCKET,
    Key: fileName,
    Expires: 60,
    ContentType: fileType,
    ACL: 'public-read'
  };

  s3.getSignedUrl('putObject', s3Params, (err, data) => {
    if(err) {
      console.log(err);
      return res.end();
    }
    const returnData = {
      signedRequest: data,
      url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
    };
    res.write(JSON.stringify(returnData));
    res.end();
  });
});

app.post('/upload-complete', () => {
  // TODO: Upload complete flow
});

app.listen(port, () => console.log(`Port: ${port}`));
