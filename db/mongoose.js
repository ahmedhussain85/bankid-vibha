const mongoose = require('mongoose')


mongoose.connect('mongodb://localhost:27017/bankid-api', function(error) {
    if(error){
      return console.log(error);  
    } 

    console.log("connection successful");
});