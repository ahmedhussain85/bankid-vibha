const express = require('express')
const ip = require('ip')
const fs = require('fs')
const https = require('https')

const app = express()
app.use(express.json())

const port = process.env.PORT || 3000
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
            hostname: 'appapi2.test.bankid.com',
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
          
      
        
        const pnoRequest = https.request(options, (req, response) => {
            //console.log(req)
            console.log('Response: ' + response)
            res.send('Response : ' + response)
            
        })
          
})

app.listen(port, () => {
    console.log('Server is up on port: ' + port)
})