const mongoose = require('mongoose')
//const validator = require('validator')

const userSchema = new mongoose.Schema({ 
    upload: {
        type: Buffer
    },
    transactionId: {
        type: Number
    },
    personName: {
        type: String
    },
    personalNumber: {
        type: Number
    }
},{
    timestamps: true
})

const SignPDF = mongoose.model('SignPDF', userSchema)

module.exports = SignPDF