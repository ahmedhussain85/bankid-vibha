const express = require('express')
const ip = require('ip')

const app = express()
app.use(express.json())

const port = process.env.PORT || 3000
const userIp = ip.address()

app.get('/', (req, res) => {
    res.send('Hello World!123')
  })

  app.listen(port, () => {
    console.log('Server is up on port: ' + port)
})