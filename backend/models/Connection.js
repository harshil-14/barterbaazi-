const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // The user who sends the request
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // The user who receives the request
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Connection', connectionSchema);
