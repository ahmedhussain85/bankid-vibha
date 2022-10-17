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

  const postmanRequest = require('postman-request')
  
app.get('/forcast' , (req, res) => {
  const latitude = 20.5937
  const longitude = 78.9629
  const url ='http://api.weatherstack.com/current?access_key=a94de50a3cfc9421255fc77a94b0c600&query='+latitude+','+longitude+'&units=f'

    postmanRequest({ url : url, json: true}, (error, {body} = {}) => {
    //https.request({ url, json: true}, (error, {body} = {}) => {
    
        if(error){
            //callback('Unable to connect weather service!', undefined)
            console.log('Unable to connect weather service!')
        }else if(body.error){
            console.log('Unable to find location. Try another search.')
        }else{
          
            res.send(body.current.weather_descriptions[0] + ', It is currently '+body.current.temperature +' degree out. It feels like '+body.current.feelslike+' degree out')
        }
        
    })
})

app.get('/auth/:personalNumber', async (req, res) => {
    const data = JSON.stringify({
       // personalNumber  : req.params.personalNumber, 
        endUserIp       : userIp,
        //requirement     : {"allowFingerprint": true},
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
            minVersion: "TLSv1.2",
            maxVersion: "TLSv1.2"
            //timeout: 5000,
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