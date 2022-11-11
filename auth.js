const express = require('express')
const ip = require('ip')
const fs = require('fs')
const https = require('https')
const QRCode = require('qrcode');
const qrimg = require('qr-image'); 

const bankId = require('./bankIdClass.js')
const path = require("path");
const pdfjsLib = require("pdfjs");
const crypto = require('crypto');

const app = express()
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use('/images', express.static('images'));
let bId = new bankId(fs, https, pdfjsLib);

const port = process.env.PORT || 3001
const userIp = ip.address()


function checkURI(q){
  if(!q.query){
    console.log("NO PARAMS PASSED");
  }
  // else{
  //   console.log("[orderRef] Input param is: "+q.query.orderRef);
  //   console.log("[startTime] Input param is: "+q.query.startTime);
  //   console.log("[qrStartSecret] Input param is: "+q.query.qrStartSecret);
  // }
}
app.get('/', async (req, res) => {
  res.render('index')
})
app.get('/home', async (req, res) => {
  res.render('home')
})
 //QR Code Call
 app.get('/authqrcode', async (req, res) => {
  checkURI(req);  
  //checkipaddress();

  bId.time = 0;
  bId.sign = false;

  await bId.authQr();

  await bId.orderStatus();

  var qrStartSecret = bId.qrStartSecret;

  var qrgeneratedcode = "bankid." + bId.qrStartToken + "." + bId.time.toString() + "." + crypto.createHmac('sha256', qrStartSecret).update(bId.time.toString()).digest('hex');
  bId.generatedQrCode = qrgeneratedcode;
  //console.log("generated qrimage is " + bId.generatedQrCode);
  res.render("qrcode", {qrImg: bId.generatedQrCode, orderStatus: bId.orderStat}); // qrcode refers to qrcode.ejs
  
})
app.get('/privetnumber', async (req, res) => {
  res.render('personalnumber')
})

app.post('/signqrcode', async (req, res) => {
  checkURI(req);  
  //checkipaddress();
  bId.time = 0;
  bId.sign = true;
  
  const personalNumber = req.body.personalNumber
  if(!personalNumber){
    return res.send("Please Enter social security number")
  }
  bId.documentToSign = "Bolagsverket.pdf";
  await bId.signQr(personalNumber);
  await bId.orderStatus();
 
  var qrStartSecret = bId.qrStartSecret;

  var qrgeneratedcode = "bankid." + bId.qrStartToken + "." + bId.time.toString() + "." + crypto.createHmac('sha256', qrStartSecret).update(bId.time.toString()).digest('hex');
  bId.generatedQrCode = qrgeneratedcode;
  
  res.render("perno-status", {qrImg: bId.generatedQrCode, orderStatus:bId.orderStat}); // qrcode refers to qrcode.ejs
})

app.get('/ajaxcall/', async (req, res) => {
  checkURI(req);  
  //checkipaddress();

  let startCode = req.params.qrstartcode;

  await bId.orderStatus();
  if(bId.orderStat == "complete")
  {
    
    
    console.log("Order Complete");
    //res.send('home');
  }
  else if (bId.orderStat == "failed")
  {
    bId.time = 0;
    bId.cancel();
    if(bId.sign == true)
    {
      await bId.signQr();
    }
    else
    {
      await bId.authQr();
    }
    await bId.orderStatus();
    startCode = bId.qrStartToken;
  }
  else if (bId.time >= 27)
  {
    bId.time = 0;
    bId.cancel();
    if(bId.sign == true)
    {
      await bId.signQr();
    }
    else
    {
      await bId.authQr();
    }
    await bId.orderStatus();
    startCode = bId.qrStartToken;
  }
  else if ((bId.time >=0) && (bId.time < 27))
  {
    await bId.orderStatus();
    if (bId.orderStat == "failed")
    {
      time = 0;
      bId.cancel();
      if(bId.sign == true)
      {
        await bId.signQr();
      }
      else
      {
        await bId.authQr();
      }
      await bId.orderStatus();
      startCode = bId.qrStartToken;
    }
    if(bId.hintCode == "userSign")
    {
      console.log("bId.orderStat is " + bId.orderStat);
      console.log("bId.hintCode is " + bId.hintCode);

    }
    else
    {
      bId.time = bId.time + 3;
    }

  }

  var qrStartSecret = bId.qrStartSecret;

  bId.generatedQrCode = "bankid." + bId.qrStartToken + "." + bId.time.toString() + "." + crypto.createHmac('sha256', qrStartSecret).update(bId.time.toString()).digest('hex');
  res.json({qrImg: bId.generatedQrCode, orderStatus: bId.orderStat, hintCode: bId.hintCode});
})

app.listen(port, () => {
  console.log('Server is up on port: ' + port)
})