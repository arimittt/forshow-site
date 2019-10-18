const express = require('express');
const app = express();
const { Client } = require('pg');
const dbUrl = process.env.DATABASE_URL;
const client = new Client({
  connectionString: dbUrl,
  ssl: true
});
const aws = require('aws-sdk');
const S3_BUCKET = process.env.S3_BUCKET;
let port = process.env.PORT || 3000;

console.log(`DATABASE_URL: ${process.env.DATABASE_URL} | dbUrl: ${dbUrl} | S3_BUCKET: ${process.env.S3_BUCKET}`);

var Promise = require('bluebird');
const pgp = require('pg-promise')({
  promiseLib: Promise
});
pgp.pg.defaults.ssl = true;
var db = pgp(dbUrl);

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

app.post('/upload', (req, res) => {
  var errors = [];
  var keywords = req.body.keywords.split('_');
  var categoriesQuery = '';
  var keywordsQuery = '';

  if(!req.body.image) {
    errors.push('Could not upload image.');
  }

  for(let i = 0; i < req.body.categories.length; i++) {
    categoriesQuery = categoriesQuery.concat(`"${req.body.categories[i]}"` + (i < req.body.categories.length - 1 ? ',' : ''));
  }

  for(let i = 0; i < keywords.length; i++) {
    keywords[i] = keywords[i].toLowerCase();
    keywords[i] = toAlphaNumeric(keywords[i]);
    keywordsQuery = keywordsQuery.concat(`"${keywords[i]}"` + (i < keywords.length - 1 ? ',' : ''));
  }

  if(req.body.time) {
    var isEra = false;
    if(req.body.time[req.body.time.length - 1] == 's') {
      isEra = true;
    }
    var time = parseInt(req.body.time, 10);
    if(!time) {
      errors.push('Time invalid, please check the format.');
    }
  }

  if(!(errors.length > 0)) {
    let query = `INSERT INTO items (image, categories, keywords, description, time, isera) VALUES ("${req.body.image}", {${categoriesQuery}}, {${keywordsQuery}}, "${req.body.description}", ${time}, ${isEra})`;

    db.none(query)
      .then((data) => {
        console.log(JSON.stringify(data));
      })
      .catch((err) => {
        console.log(err);
      });
  }

  res.send(errors);
  res.end();
});

function toAlphaNumeric(str) {
  var alphaNumericRegex = /^[0-9a-zA-Z]+$/;
  for(let i = 0; i < str.length; i++) {
    if(!str[i].value.match(alphaNumericRegex)) {
      str[i] = '';
    }
  }
  return str;
}

app.listen(port, () => console.log(`Port: ${port}`));
