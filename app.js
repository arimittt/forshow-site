const express = require('express');
const app = express();
const { Client } = require('pg');
const bodyParser = require('body-parser');
const fs = require('fs');
const dbUrl = process.env.DATABASE_URL;
const client = new Client({
  connectionString: dbUrl,
  ssl: true
});
const aws = require('aws-sdk');
const S3_BUCKET = process.env.S3_BUCKET;
let port = process.env.PORT || 3000;

const Promise = require('bluebird');
const pgp = require('pg-promise')({
  promiseLib: Promise
});
pgp.pg.defaults.ssl = true;
const db = pgp(dbUrl);

client.connect();
app.set('views', './views');
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));
aws.config.region = 'eu-central-1';

const categories = [
  'politics',
  'technology',
  'art',
  'religion',
  'internet culture',
  'protest',
  'environmentalism',
  'racism',
  'sexism',
  'lgbt',
  'feminism',
  'consumerism',
  'advertising',
  'recreation',
  'miscellaneous'
];

let staticFiles = [];

fs.readdirSync('./public/images/spectacles').forEach((file) => {
  staticFiles.push(file);
});

app.get('/', (req,res) => {
  res.sendFile(__dirname + '/views/db-vis.html');
});

app.get('/upload', (req,res) => {
  res.sendFile(__dirname + '/views/upload.html');
});

app.get('/categories', (req,res) => {
  res.write(JSON.stringify(categories));
  res.end();
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

app.get('/search', (req, res) => {
  console.log('Received request from client.');
  let query = 'SELECT * FROM items ORDER BY id';
  db.any(query, true)
    .then((data) => {
      for(let i = 0; i < data.length; i++) {
        for(let j = 0; j < staticFiles.length; j++) {
          if(staticFiles[j].split('.')[0] == data[i].image.slice(data[i].image.lastIndexOf('/') + 1)) {
            data[i].image = `images/spectacles/${staticFiles[j].split('.')[0]}.jpg`;
            break;
          }
        }
      }
      res.send(JSON.stringify(data));
      console.log('Sent DB data to client:\n' + JSON.stringify(data));
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post('/upload', (req, res) => {
  let errors = [];
  let keywords = req.body.keywords;
  let categoriesQuery = '';
  let keywordsQuery = '';

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

  let date;
  if(!req.body.date) {
    const dateObj = new Date();
    date = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
  } else {
    date = req.body.date
  }

  if(!(errors.length > 0)) {
    let query = `INSERT INTO items (image, categories, keywords, description, date) VALUES ('${req.body.image}', '{${categoriesQuery}}', '{${keywordsQuery}}', '${req.body.description}', '${date}')`;
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
  const alphaNumericRegex = /^[0-9a-zA-Z]+$/;
  for(let i = 0; i < str.length; i++) {
    if(!alphaNumericRegex.test(str[i])) {
      str[i] = '';
    }
  }
  return str;
}

app.listen(port, () => console.log(`Port: ${port}`));
