const mongoose = require('mongoose');

const BarterRequestSchema = new mongoose.Schema({
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    responder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestedSkill: { type: String, required: true },
    offeredSkill: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'accepted', 'rejected'], // Enums to restrict status values
        default: 'pending' 
    },
    date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('BarterRequest', BarterRequestSchema);
