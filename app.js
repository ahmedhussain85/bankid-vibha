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
app.use(express.json())
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use('/images', express.static('images'));
let bId = new bankId(fs, https, pdfjsLib);

const port = process.env.PORT || 3001
const userIp = ip.address()

app.get('/', (req, res) => {
    res.send('Hello')
  })

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
    pfx: fs.readFileSync('./FPTestcert4_20220818.p12'),
    passphrase: 'qwerty123',
    rejectUnauthorized: false,
    resolveWithFullResponse: true,
    timeout: 5000,
  }
 
  let d = await getDetailsForCollect(data, options);
        //console.log(d);
        parsedData = JSON.parse(d);

  let orderStatus = await orderStatusCollect(parsedData.orderRef)
  console.log(orderStatus.status)
  
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
      pfx: fs.readFileSync('./FPTestcert4_20220818.p12'),
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
    console.log("[orderRef] Input param is: "+q.query.orderRef);
    console.log("[startTime] Input param is: "+q.query.startTime);
    console.log("[qrStartSecret] Input param is: "+q.query.qrStartSecret);
  }
}
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
  console.log("generated qrimage is " + bId.generatedQrCode);
  res.render("qrcode", {qrImg: bId.generatedQrCode, orderStatus: bId.orderStat}); // qrcode refers to qrcode.ejs
})

app.get('/ajaxcall/', async (req, res) => {
  checkURI(req);  
  //checkipaddress();

  let startCode = req.params.qrstartcode;

  await bId.orderStatus();
  if(bId.orderStat == "complete")
  {
    console.log("Order Complete");
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