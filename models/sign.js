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

userSchema.methods.toJSON = function(){
    const user = this
    const userObject = user.toObject()

    delete userObject.transactionId
    delete userObject.upload
    delete userObject._id
    delete userObject.createdAt
    delete userObject.updatedAt
    delete userObject.__v

    return userObject
}

const SignPDF = mongoose.model('SignPDF', userSchema)

module.exports = SignPDF