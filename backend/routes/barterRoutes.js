const express = require('express');
const { 
    createRequest, 
    getRequests, 
    updateRequest, 
    deleteRequest, 
    acceptRequest, 
    rejectRequest 
} = require('../controllers/barterController');
const auth = require('../middleware/auth');
const router = express.Router();

// Create a new barter request
router.post('/create', auth, createRequest);

// Get all requests for the logged-in user
router.get('/', auth, getRequests);

// Update a specific barter request
router.put('/:id', auth, updateRequest);

// Delete a specific barter request
router.delete('/:id', auth, deleteRequest);

// Accept a barter request
router.put('/accept/:id', auth, acceptRequest);

// Reject a barter request
router.put('/reject/:id', auth, rejectRequest);

module.exports = router;
