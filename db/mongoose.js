const mongoose = require('mongoose')


mongoose.connect('mongodb://127.0.0.1:27017/bankid-api', function(error) {
    if(error) console.log(error);

        //console.log("connection successful");
});