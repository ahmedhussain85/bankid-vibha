const express = require('express')
const ip = require('ip')
const fs = require('fs')
const https = require('https')
//const postmanReq = require('postman-request')

const app = express()
app.use(express.json())

const port = process.env.PORT || 3001
const userIp = ip.address()

app.get('/', (req, res) => {
    res.send('Hello World!')
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
 
  let d = await doPostToDoItem(data, options);
        console.log(d);
        parsedData = JSON.parse(d);

        this.qrStartSecret = parsedData.qrStartSecret;
        this.orderRef = parsedData.orderRef;
        this.qrStartToken = parsedData.qrStartToken;

  res.send('orderRef : ' +parsedData.orderRef)
          
})





app.listen(port, () => {
    console.log('Server is up on port: ' + port)
})

const doPostToDoItem = async (data, options) => {
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

