class BankId {
    constructor(fs, https, pdfjsLib)
    {
        this.fs = fs;
        this.https = https;
        this.pdfjsLib = pdfjsLib;
        this.qrStartSecret = "";
        this.generatedQrCode = "";
        this.orderRef = "";
        this.orderStat = "";
        this.qrStartToken = "";
        this.hintCode = "";
        this.endUserIp = "";
        this.usereVisibleData = "";
        this.userNonVisibleData = "";
        this.documentToSign = "";
        this.sign = false;
        this.time = 0;
    }

    // Method
    async orderStatus() {
        var parsedData;
        const data = JSON.stringify({
            orderRef       : this.orderRef,
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
            pfx: this.fs.readFileSync('./FPTestcert4_20220818.p12'),
            //key: this.fs.readFileSync('./bankid-test.key.pem'),
            //cert: this.fs.readFileSync('./bankid-test.crt.pem'),  
            passphrase: 'qwerty123',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            timeout: 5000,
          }

          try{
            let d = await this.doPostToDoItem(data, options);
            console.log(JSON.parse(d));
            parsedData = JSON.parse(d);
            this.orderStat = parsedData.status;
            this.hintCode = parsedData.hintCode;
          }
          catch (err) {
            console.log(err);
          }
    }

    // Method
    cancel() {
        const data = JSON.stringify({
            orderRef       : this.orderRef,
        })
        
        const options = {
            hostname: 'appapi2.test.bankid.com',
            port: 443,
            path: '/rp/v5.1/cancel',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            },
            json: true,
            pfx: this.fs.readFileSync('./FPTestcert4_20220818.p12'),
            //key: this.fs.readFileSync('./bankid-test.key.pem'),
            //cert: this.fs.readFileSync('./bankid-test.crt.pem'),  
            passphrase: 'qwerty123',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            timeout: 5000,
        }
        this.https.request(options, res => {
            console.log(`statusCode: ${res.statusCode}`);
        }).write(data)
        console.log("Order cancelled");
    }

    async authQr()
    {
        var parsedData;
        const data = JSON.stringify({
            endUserIp       : "83.254.22.249",
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
            pfx: this.fs.readFileSync('./FPTestcert4_20220818.p12'),
            //key: this.fs.readFileSync('./bankid-test.key.pem'),
            //cert: this.fs.readFileSync('./bankid-test.crt.pem'),  
            passphrase: 'qwerty123',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            timeout: 5000,   
        }
        try{
            let d = await this.doPostToDoItem(data, options);
            parsedData = JSON.parse(d);

            console.log(d);

        }
        catch (err) {
            console.error(err);
        }
    
        this.qrStartSecret = parsedData.qrStartSecret;
        this.orderRef = parsedData.orderRef;
        this.qrStartToken = parsedData.qrStartToken;
        this.autoStartToken = parsedData.autoStartToken
        
    }

    async signQr(prno)
    {
        // const documentToSign = "vaccine.pdf"
        const message = "I hearby sign the document "  + this.documentToSign + " using bankid";
        var parsedData;
        
        // const loadingTask = this.pdfjsLib.getDocument(this.documentToSign);
        // const pdf = await loadingTask.promise;

        // const fingerprints = await JSON.stringify(pdf.fingerprints.join(""));
        //console.log(fingerprints);
      
        const data = JSON.stringify({
            personalNumber:prno,
            endUserIp: "83.254.22.249",
            requirement: { "allowFingerprint": true
          },
          userVisibleData: Buffer.from(message).toString('base64')
          //userNonVisibleData: Buffer.from(fingerprints).toString('base64'),
        })
        console.log(data)
        
        const options = {
          hostname: 'appapi2.test.bankid.com',
          port: 443,
          path: '/rp/v5.1/sign',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
          },
          json: true,
          pfx: this.fs.readFileSync('./FPTestcert4_20220818.p12'),
          //key: this.fs.readFileSync('./bankid-test.key.pem'),
          //cert: this.fs.readFileSync('./bankid-test.crt.pem'),  
          passphrase: 'qwerty123',
          rejectUnauthorized: false,
          resolveWithFullResponse: true,
          timeout: 5000,
        }
        let d = await this.doPostToDoItem(data, options);
        console.log(d);
        parsedData = JSON.parse(d);

        this.qrStartSecret = parsedData.qrStartSecret;
        this.orderRef = parsedData.orderRef;
        this.qrStartToken = parsedData.qrStartToken;
    }

    ///////////////////////////////////////
    async sameDevice()
    {
        var parsedData;
        const data = JSON.stringify({
            endUserIp       : "83.254.22.249",
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
            pfx: this.fs.readFileSync('./FPTestcert4_20220818.p12'),
            //key: this.fs.readFileSync('./bankid-test.key.pem'),
            //cert: this.fs.readFileSync('./bankid-test.crt.pem'),  
            passphrase: 'qwerty123',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            timeout: 5000,   
        }
        try{
            let d = await this.doPostToDoItem(data, options);
            parsedData = JSON.parse(d);

            console.log(d);

        }
        catch (err) {
            console.error(err);
        }
    
        this.qrStartSecret = parsedData.qrStartSecret;
        this.orderRef = parsedData.orderRef;
        this.qrStartToken = parsedData.qrStartToken;
        this.autoStartToken = parsedData.autoStartToken
        
        
    }
    ///////////////////////////////////////////////////

    async doPostToDoItem(data, options) {
        let responseBody = '';
      
        let p = new Promise((resolve, reject) => {
            const req = this.https.request(options, (res) => {
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

    async readPDFPages() {
        const loadingTask = this.pdfjsLib.getDocument('./vaccine.pdf');
        // Start reading all pages 1...numPages
        // const promises = pageNumbers.map(pageNo => pdf.getPage(pageNo));
        const pdf = await loadingTask.promise;
        
        //console.log(pdf);
        const fingerprints = await JSON.stringify(pdf.fingerprints.join(""));
        console.log(fingerprints);
        
        // You can do something with pages here.
        return fingerprints;
    }

}

module.exports = BankId