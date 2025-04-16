const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    address: String,
    country: String,
    state: String,
    city: String,
    zipcode: String,
    category: String,
    skill: String,
    profilePicture: { type: String }, // Field for profile picture URL
    date: { type: Date, default: Date.now },

    // Fields for connection functionality
    sentConnectionRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users to whom this user sent requests
    receivedConnectionRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who sent requests to this user
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Accepted connections

    // Fields for barter requests
    sentBarterRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BarterRequest' }], // Barter requests sent by this user
    receivedBarterRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BarterRequest' }], // Barter requests received by this user
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports = mongoose.model('User', UserSchema);
