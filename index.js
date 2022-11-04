const express = require("express");
const app = express();
var fs = require("fs");
const https = require('https')
const crypto = require('crypto');
var qrimg = require('qr-image'); 
const path = require("path");
const publicIp = require('public-ip');
const isIp = require('is-ip');
const bankId = require('./bankIdClass.js')
const QRCode = require('qrcode');
//var pdfjsLib = require("pdfjs");
var pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
const swaggerUi = require('swagger-ui-express')
const swaggerFile = require('./swagger_output.json')

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use('/images', express.static('images'));


let bId = new bankId(fs, https, pdfjsLib);

function checkipaddress(){
  (async () => {
    //if IPV4 only
    if(isIp.v4(await publicIp.v4())){
      console.log("Your public IPV4 Adress is: "+await publicIp.v4());
      //if IPV4 and IPV6 both
      if(isIp.v6(await publicIp.v6())){
        console.log("Your public IPV6 Adress is: "+await publicIp.v6());
        console.log("You have both IPV4 and IPV6");
      }
    }
    //if IPV6 only
    else if(isIp.v6(await publicIp.v6())){
      console.log("Your public IPV6 Adress is: "+await publicIp.v6());
    }
    else{
      console.log("Neither IPV4 nor IP6 found!");
    }
  })();
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

//Root call
app.get("/", (req, res) => {
  res.render("index"); // index refers to index.ejs
 });

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

 //QR Code Call
 app.get('/signqrcode', async (req, res) => {
  checkURI(req);  
  //checkipaddress();
  bId.time = 0;
  bId.sign = true;

  bId.documentToSign = "Bolagsverket.pdf";
  await bId.signQr();
  await bId.orderStatus();
 
  var qrStartSecret = bId.qrStartSecret;

  var qrgeneratedcode = "bankid." + bId.qrStartToken + "." + bId.time.toString() + "." + crypto.createHmac('sha256', qrStartSecret).update(bId.time.toString()).digest('hex');
  bId.generatedQrCode = qrgeneratedcode;
  console.log("generated sign qrimage is " + bId.generatedQrCode);

  var code = qrimg.image(bId.generatedQrCode, { type: 'png', size: 15 });
  res.render("qrcode", {qrImg: bId.generatedQrCode, orderStatus:bId.orderStat}); // qrcode refers to qrcode.ejs
})

async function doPostToDoItem(data, options) {
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

//QR Code Call
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

const generateQR = async text => {
  try {
    console.log(await QRCode.toDataURL(text))
  } catch (err) {
    console.error(err)
  }
}

app.get('/qr', (req, res) => {
  var code = qrimg.image(bId.generatedQrCode, { type: 'png' });
  res.setHeader('Content-type', 'image/png');  //sent qr image to client side
  code.pipe(res);
  //res.sendFile(__dirname + '/myqr.png');

});

app.listen(3000, () => {
  console.log("server started on port 3000");
});

app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile))

require('./endpoints')(app)