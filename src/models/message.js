const mongoose = require('mongoose')


const messageSchema = new mongoose.Schema({
    text: {
        type: String,
        trim: true
    }

}, {
    timestamps: true     
})


const Message = mongoose.model('Message', messageSchema)

module.exports = Message  //It is important to export your model