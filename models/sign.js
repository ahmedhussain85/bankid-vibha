const mongoose = require('mongoose')
//const validator = require('validator')

const userSchema = new mongoose.Schema({ 
    upload: {
        type: Buffer
    }
},{
    timestamps: true
})

const SignPDF = mongoose.model('SignPDF', userSchema)

module.exports = SignPDF