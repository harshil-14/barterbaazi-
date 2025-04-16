const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, default: 'sent' }, // Example statuses: 'sent', 'delivered', 'read'
    edited: { type: Boolean, default: false }  // Indicates if the message has been edited
});

module.exports = mongoose.model('Message', MessageSchema);
