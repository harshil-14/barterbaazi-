const mongoose = require('mongoose');

// Create a Comment Schema to store individual comments
const CommentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  
    text: { type: String, required: true }
}, { timestamps: true });  // This will add createdAt and updatedAt fields for comments

const FeedSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  
    content: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],  
    comments: [CommentSchema]
}, { timestamps: true });  // This will add createdAt and updatedAt fields for posts

module.exports = mongoose.model('Feed', FeedSchema);
