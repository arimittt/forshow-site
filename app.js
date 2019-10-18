const express = require('express');
const app = express();
const { Client } = require('pg');
const bodyParser = require('body-parser');
const dbUrl = process.env.DATABASE_URL;
const client = new Client({
  connectionString: dbUrl,
  ssl: true
});
const aws = require('aws-sdk');
const S3_BUCKET = process.env.S3_BUCKET;
let port = process.env.PORT || 3000;

var Promise = require('bluebird');
const pgp = require('pg-promise')({
  promiseLib: Promise
});
pgp.pg.defaults.ssl = true;
var db = pgp(dbUrl);

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

app.get('/', (req,res) => {
  res.sendFile(__dirname + '/views/timeline.html');
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

app.post('/upload', (req, res) => {
  var errors = [];
  var keywords = req.body.keywords.split(',');
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
    console.log('Keyword: ' + keywords[i]);
    console.log('Keyword Query: ' + keywordsQuery);
  }

  var date;
  if(!req.body.date) {
    var dateObj = new Date();
    date = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
  } else {
    date = req.body.date
  }

  if(!(errors.length > 0)) {
    let query = `INSERT INTO items (image, categories, keywords, description, date) VALUES ('${req.body.image}', '{${categoriesQuery}}', '{${keywordsQuery}}', '${req.body.description}', '${date}')`;
    console.log(query);
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
    if(!alphaNumericRegex.test(str[i])) {
      str[i] = '';
    }
  }
  return str;
}

app.listen(port, () => console.log(`Port: ${port}`));
