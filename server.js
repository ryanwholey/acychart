var express = require('express');
var app = express();
var csv = require('csv-parser');
var fs = require('fs');
var Promise = require('bluebird');
var request = require('request-promise');

var config = {
  paths: [
    './projected.csv',
    './actual.csv',
  ]
};


function readFile(path) {
  var dataType = path.substr(2).split('.')[0];

  return new Promise(function(resolve, reject) {
    var data;

    fs.readFile(path, 'utf-8', function(err, fileData ) {
      if (err) {
        reject(err);
        return;
      }
      data = {};
      data.type = dataType;
      data.data = fileData;
      resolve(data);
    });
  });
}


app.get('/data', function(req, res) {
  var dataTypes = ['actual', 'projected'];
  var uriBase = 'http://localhost:4001/api/'
    Promise.all(
      dataTypes.map(function(type) {
        return request({
          json:true,
          uri: uriBase + type + '/'
        })
      })
    )
    .then(function(data) {
      res.send(data);
    })
    .catch(function(err) {
      res.send(err);
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


