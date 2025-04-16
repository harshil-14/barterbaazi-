const express = require('express');
const {
    createPost,
    getFeed,
    updatePost,
    deletePost,
    addLike,
    removeLike,
    addComment,
    deleteComment
} = require('../controllers/feedController');
const auth = require('../middleware/auth');
const router = express.Router();

// Create a new post
router.post('/create', auth, createPost);

// Get all posts with pagination
router.get('/', auth, getFeed);

// Update a post
router.put('/:id', auth, updatePost);

// Delete a post
router.delete('/:id', auth, deletePost);

// Like a post
router.post('/:id/like', auth, addLike);

// Unlike a post
router.delete('/:id/unlike', auth, removeLike);

// Add a comment to a post
router.post('/:id/comment', auth, addComment);

// Delete a comment from a post
router.delete('/:id/comment/:comment_id', auth, deleteComment);

module.exports = router;
