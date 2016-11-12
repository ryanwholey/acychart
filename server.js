var express = require('express');
var app = express();
var csv = require('csv-parser');
var fs = require('fs');
var Promise = require('bluebird');

function formatData(data) {
  var obj = {};
  return data.split('\n');
}

app.get('/data', function(req, res) {
  fs.readFile('./data.csv', function(err, data) {
    if (err) {
      throw err; 
    }
    res.send(data);
  });
});

app.use(express.static('src'));

app.listen(8080, function(err) {
  if (err) {
    console.log('error :[');
  } else {
    console.log('listening on 8080');
  }
});


