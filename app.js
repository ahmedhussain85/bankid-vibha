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
const multer = require('multer')

const app = express()
app.use(express.json())
app.set("view engine", "ejs");

const bodyParser = require('body-parser');
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, "public")));
app.use('/images', express.static('images'));
let bid = new bankId(fs, https, pdfjsLib);

const port = process.env.PORT || 3001
const userIp = ip.address()

app.use(bodyParser.urlencoded({ extended: true }));

// Define a route to render layout.ejs
app.get('/', (req, res) => {
    //res.send('Hello')
    //res.render('index')
    res.render('layout', { title: 'Paylego AB - BankID Demo' });
  })

// Define a route to render login-ssn.ejs
app.get('/login-ssn', (req, res) => {
  res.render('login-ssn', { title: 'BankID Login using SSN (Personnummer)' });
});

// Define a route to render login-qr.ejs
app.get('/login-qr', (req, res) => {
  loginqrfunc(req);
  res.render('login-qr', { title: 'BankID Login using QR Code', qrImg: bid.generatedQrCode, orderStatus: bid.orderStat});
});

// Define a route to render login-same-device.ejs
app.get('/login-same-device', (req, res) => {
  res.render('login-same-device', { title: 'BankID Login using Same Device' });
});

// Define a route to render login-different-device.ejs
app.get('/login-different-device', (req, res) => {
  res.render('login-different-device', { title: 'BankID Login using Different Device' });
});

// Define a route to render sign-document.ejs
app.get('/sign-document', (req, res) => {
  res.render('sign-document', { title: 'Sign Document using BankID' });
});

//Bank ID using Social Security Number (personnummer in Sweden)  
app.get('/ssn', async (req, res) => {
  res.render('ssn')
})

app.get('/uploadfile', (req, res) => {
  res.render('uploadfile')
})


app.post('/signqrcode', async (req, res) => {
  checkURI(req);  
  //checkipaddress();
  bid.time = 0;
  bid.sign = true;
  console.log(req.body);
  const ssn = req.body.ssn;

  if(!ssn){
    return res.send("Please Enter social security number")
  }
  bid.documentToSign = "Bolagsverket.pdf";
  await bid.signQr(ssn);
  await bid.orderStatus();
  
  var qrStartSecret = bid.qrStartSecret;

  var qrgeneratedcode = "bankid." + bid.qrStartToken + "." + bid.time.toString() + "." + crypto.createHmac('sha256', qrStartSecret).update(bid.time.toString()).digest('hex');
  bid.generatedQrCode = qrgeneratedcode;
  
  res.render("ssn-status", {qrImg: bid.generatedQrCode, orderStatus:bid.orderStat}); // qrcode refers to qrcode.ejs
})


app.get('/onsamedevice', async (req, res) => {
  checkURI(req);  
  //checkipaddress();
  bid.time = 0;
  bid.sign = true;
  
  await bid.authQr();
  await bid.orderStatus();
  console.log(bid.autoStartToken)
  
  const sameDeviceURL = new URL(`https://demo.bankid.com//?autostarttoken=[${bid.autoStartToken}]&redirect=http://localhost:3001/home`);

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


app.get('/auth', async (req, res) => {
  const data = JSON.stringify({
    //personalNumber  : req.params.personalNumber, 
    endUserIp       : userIp,
    requirement     : {"allowFingerprint": true},
  })
  
  const options = {
    hostname: 'appapi2.test.bankid.com',
    port: 443,
    path: '/rp/v5.1/auth',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    },
    json: true, 
    pfx: fs.readFileSync('./FPTestcert4_20230629.p12'),
    passphrase: 'qwerty123',
    rejectUnauthorized: false,
    resolveWithFullResponse: true,
    timeout: 5000,
  }
 
  let d = await getDetailsForCollect(data, options);
        //console.log(d);
        parsedData = JSON.parse(d);

  let orderStatus = await orderStatusCollect(parsedData.orderRef)
  //console.log(orderStatus.status)
  
  var qrgeneratedcode = "bankid." + parsedData.qrStartToken + "." + 1 + "." + parsedData.qrStartSecret;
  let stringdata = JSON.stringify(qrgeneratedcode)

      // Print the QR code to terminal
    QRCode.toString(stringdata,{type:'terminal'},
    function (err, QRcode) {

    if(err) {
      return console.log("error occurred")
    }
    // Printing the generated code
    console.log(QRcode)
    
    
    })

  res.send('See QR Code in console')
         
})

const getDetailsForCollect = async (data, options) => {
  //console.log('dopost function')
  let responseBody = '';

  let p = new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
          //res.setEncoding('utf8');

          res.on('data', (chunk) => {
              responseBody += chunk;
          });

          res.on('end', () => {
              resolve(JSON.parse(responseBody));
          });
      });

      req.on('error', (err) => {
          reject(err);
      });

      req.write(data)
      req.end();
  });

  await p;
  return responseBody;
}

// Method
const orderStatusCollect = async (orderRef) => {
  var parsedData;
  const data = JSON.stringify({
      orderRef  : orderRef,
    })
    
    const options = {
      hostname: 'appapi2.test.bankid.com',
      port: 443,
      path: '/rp/v5.1/collect',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      },
      json: true,
      pfx: fs.readFileSync('./FPTestcert4_20230629.p12'),
      //key: this.fs.readFileSync('./bankid-test.key.pem'),
      //cert: this.fs.readFileSync('./bankid-test.crt.pem'),  
      passphrase: 'qwerty123',
      rejectUnauthorized: false,
      resolveWithFullResponse: true,
      timeout: 5000,
    }

    try{
      let d = await getDetailsForCollect(data, options);
      console.log(JSON.parse(d));
      return parsedData = JSON.parse(d);
      // this.orderStat = parsedData.status;
      // this.hintCode = parsedData.hintCode;
    }
    catch (err) {
      console.log(err);
    }
}

function checkURI(q){
  if(!q.query){
    console.log("NO PARAMS PASSED");
  }
  else{
    console.log("checkURI function start");
    console.log("[orderRef] Input param is: "+q.query.orderRef);
    console.log("[startTime] Input param is: "+q.query.startTime);
    console.log("[qrStartSecret] Input param is: "+q.query.qrStartSecret);
    console.log(q.body);
    console.log("checkURI function stop");
  }
}

//QR Code Call
async function loginqrfunc(req){
  checkURI(req);  
  //checkipaddress();

  bid.time = 0;
  bid.sign = false;

  await bid.authQr();
  await bid.orderStatus();

  var qrStartSecret = bid.qrStartSecret;

  var qrgeneratedcode = "bankid." + bid.qrStartToken + "." + bid.time.toString() + "." + crypto.createHmac('sha256', qrStartSecret).update(bid.time.toString()).digest('hex');
  bid.generatedQrCode = qrgeneratedcode;

  console.log("generated qrimage is " + bid.generatedQrCode);
}

app.get('/ajaxcall/', async (req, res) => {
  checkURI(req);  
  //checkipaddress();

  let startCode = req.params.qrstartcode;

  await bid.orderStatus();
  if(bid.orderStat == "complete")
  {
    console.log("Order Complete");
  }
  else if (bid.orderStat == "failed")
  {
    bid.time = 0;
    bid.cancel();
    if(bid.sign == true)
    {
      await bid.signQr();
    }
    else
    {
      await bid.authQr();
    }
    await bid.orderStatus();
    startCode = bid.qrStartToken;
  }
  else if (bid.time >= 27)
  {
    bid.time = 0;
    bid.cancel();
    if(bid.sign == true)
    {
      await bid.signQr();
    }
    else
    {
      await bid.authQr();
    }
    await bid.orderStatus();
    startCode = bid.qrStartToken;
  }
  else if ((bid.time >=0) && (bid.time < 27))
  {
    await bid.orderStatus();
    if (bid.orderStat == "failed")
    {
      time = 0;
      bid.cancel();
      if(bid.sign == true)
      {
        await bid.signQr();
      }
      else
      {
        await bid.authQr();
      }
      await bid.orderStatus();
      startCode = bid.qrStartToken;
    }
    if(bid.hintCode == "userSign")
    {
      console.log("bid.orderStat is " + bid.orderStat);
      console.log("bid.hintCode is " + bid.hintCode);

    }
    else
    {
      bid.time = bid.time + 3;
    }

  }

  var qrStartSecret = bid.qrStartSecret;

  bid.generatedQrCode = "bankid." + bid.qrStartToken + "." + bid.time.toString() + "." + crypto.createHmac('sha256', qrStartSecret).update(bid.time.toString()).digest('hex');
  res.json({qrImg: bid.generatedQrCode, orderStatus: bid.orderStat, hintCode: bid.hintCode});
})

app.listen(port, () => {
  console.log('Server is up on port: ' + port)
})