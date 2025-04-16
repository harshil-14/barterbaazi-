const express = require('express');
const { sendMessage, getMessages, updateMessage, deleteMessage } = require('../controllers/messageController');
const auth = require('../middleware/auth');
const router = express.Router();

// Send a new message
router.post('/send', auth, sendMessage);

// Get all messages
router.get('/', auth, getMessages);

// Update a message
router.put('/:id', auth, updateMessage);

// Delete a message
router.delete('/:id', auth, deleteMessage);

module.exports = router;
