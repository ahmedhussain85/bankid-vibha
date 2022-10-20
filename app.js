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

app.get('/auth/:personalNumber', async (req, res) => {
  const data = JSON.stringify({
    personalNumber  : req.params.personalNumber, 
    endUserIp       : userIp,
    requirement     : {"allowFingerprint": true},
  })
  
  const options = {
    hostname: 'demo.bankid.com',
    port: 443,
    path: '/rp/v5.1/auth',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    },
    json: true,
    key: fs.readFileSync('./bankid-test.key.pem'),
    cert: fs.readFileSync('./bankid-test.crt.pem'),  
    passphrase: 'qwerty123',
    rejectUnauthorized: false,
    resolveWithFullResponse: true,
    timeout: 5000,
  }
  https.request(options, (res) => {
    console.log("statusCode:" +res.statusCode)
    //console.log(res)
    res.on('data', d => {
      process.stdout.write(d)
    })
  }).write(data)

  res.send()
          
})

app.listen(port, () => {
    console.log('Server is up on port: ' + port)
})

