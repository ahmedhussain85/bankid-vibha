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

const SignPDF = require('./models/sign')
const multer = require('multer')
//const sharp = require('sharp')
require('./db/mongoose')
const generateUniqueId = require('generate-unique-id');

const app = express()
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use('/images', express.static('images'));
let bId = new bankId(fs, https, pdfjsLib);

const port = process.env.PORT || 3001
const userIp = ip.address()
global.transactionId = 0 ;


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
  //console.log("generated qrimage is " + bId.autoStartToken);
  
  res.render("qrcode", {qrImg: bId.generatedQrCode, orderStatus: bId.orderStat}); // qrcode refers to qrcode.ejs
  
})

//Bank ID using Social Security Number (personnummer in Sweden)
app.get('/ssn', async (req, res) => {
  res.render('ssn')
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


app.get('/onsamedevice', async (req, res) => {
  checkURI(req);  
  //checkipaddress();
  bId.time = 0;
  bId.sign = true;
  
  await bId.authQr();

  await bId.orderStatus();

  console.log(bId.autoStartToken)
  
//   const options = {
//     hostname: `appapi2.test.bankid.com`,
//     port: 443,
//     method: 'POST',
//     path: `/?autostarttoken=[${bId.autoStartToken}]&redirect=null`,
//     headers: {
//       'Content-Type': 'application/json'
//     },
//     json: true,
//     //key: this.fs.readFileSync('./bankid-test.key.pem'),
//     //cert: this.fs.readFileSync('./bankid-test.crt.pem'),  
//     passphrase: 'qwerty123',
//     rejectUnauthorized: false,
//     resolveWithFullResponse: true,
//     timeout: 5000,   
// }

  const sameDeviceURL = new URL(`https://demo.bankid.com//?autostarttoken=[${bId.autoStartToken}]&redirect=http://localhost:3001/home`);

  res.redirect(sameDeviceURL) 
  
})


 const storage = multer.memoryStorage()

var upload = multer({ 
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if(!file.originalname.endsWith('.pdf')) {
      return cb(new Error('Please upload a PDF file only!'))
    }

    cb(undefined, true)
  }

});

app.post('/signdocs', upload.single('upload'), async (req, res) => {
  transactionId = generateUniqueId({
    length: 15,
    useLetters: false
  });
  const buffer = req.file.buffer
 console.log(transactionId)
    const pdfDocs = new SignPDF()
    pdfDocs.upload = buffer
    pdfDocs.transactionId = transactionId

    try{
      const token = await pdfDocs.save()
      bId.time = 0;
      bId.sign = false;
      bId.transactionId = transactionId;
    
      await bId.authQr();
    
      const abc = await bId.orderStatus();
      
      var qrStartSecret = bId.qrStartSecret;

      var qrgeneratedcode = "bankid." + bId.qrStartToken + "." + bId.time.toString() + "." + crypto.createHmac('sha256', qrStartSecret).update(bId.time.toString()).digest('hex');
      bId.generatedQrCode = qrgeneratedcode;
   
      
      res.render("qrcode", {qrImg: bId.generatedQrCode, orderStatus: bId.orderStat}); // qrcode refers to qrcode.ejs
        //res.status(201).redirect('/authqrcode') 

    }catch(e) {
        res.status(400).send(e) 
    }
},(error, req, res, next) => {
  res.status(404).send({error: error.message})
})

app.get('/signdocs/:id', async (req, res) => {
  try{
      const user = await SignPDF.findById(req.params.id)

      if(!user || !user.upload) {
          throw new Error()
      }

      res.set('Content-Type', 'application/pdf')
      res.send(user.upload)
  } catch(e) {
      res.status(404).send()
  }
})

app.get('/transactionId', async (req, res) => {
  res.render('getInfoTransactionId')
})
app.post('/getInfoFortransId/', async (req, res) => {
  const transactionId = req.body.transactionId
  if(!transactionId){
    return res.send("Please Enter Transaction Id")
  }
  try{
      const user = await SignPDF.findOne({transactionId:transactionId})
      if(!user) {
          throw new Error()
      }
      res.send(user)
  } catch(e) {
      res.status(404).send(e)
  }
})

app.get('/ajaxcall/', async (req, res) => {
  checkURI(req);  
  //checkipaddress();

  let startCode = req.params.qrstartcode;

  await bId.orderStatus();
  if(bId.orderStat == "complete")
  {
    if(transactionId != 0){
      const perNumber = bId.personalNumber
      const perName = bId.name
      await SignPDF.findOneAndUpdate({transactionId:transactionId}, {personalNumber:perNumber, personName:perName})

      console.log(transactionId);
    }else{
      console.log('transactionId undefined')
    }
    
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