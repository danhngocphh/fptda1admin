var express = require('express');
var mongodb = require('../db');

var router = express.Router();


/* GET home page. */
router.get('/', function(req, res) {
  mongodb.getDash(res);
});

router.get('/key', function(req, res) {
  mongodb.getValkey(res);
});

router.get('/link', function(req, res) {
  mongodb.getVallink(res);
});

router.get('/linkbykey', function(req, res) {
  mongodb.getVallinkbykey(res);
});

router.get('/key-detail/:keysearch', function(req, res) {
  var key = req.params.keysearch;
  mongodb.getkeyDetail(key,res);
});

router.get('/top10key/:key', function(req, res) {
  var key = req.params.key;
  mongodb.getlinkbytop10key(key,res);
});


router.get('/linkbykey-detail/:link', function(req, res) {
  var key = req.params.link;
  mongodb.getlinkbykeyDetail(key,res);
});

router.get('/linkbylink-detail/:link', function(req, res) {
  var key = req.params.link;
  mongodb.getlinkbylinkDetail(key,res);
});

router.post('/values', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  var val = req.body.value;
  var date = req.body.date;


  if (val === undefined || val === "") {
    res.send(JSON.stringify({status: "error", value: "Value undefined"}));
    return
  }
  mongodb.sendVal(val, date, res);
});

router.post('/links', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  var val = req.body.value;
  var link = req.body.link;
  var title = req.body.title;
  var date = req.body.date;


  if (val === undefined || val === "") {
    res.send(JSON.stringify({status: "error", value: "Value undefined"}));
    return
  }
  mongodb.sendLink(val, link, title, date, res);
});

router.delete('/values/:id', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  var uuid = req.params.id;

  if (uuid === undefined || uuid === "") {
    res.send(JSON.stringify({status: "error", value: "UUID undefined"}));
    return
  }
  mongodb.delVal(uuid);
  res.send(JSON.stringify({status: "ok", value: uuid}));
});

module.exports = router;
