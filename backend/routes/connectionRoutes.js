const express = require('express');
const { sendConnectionRequest, getConnectionRequests, acceptConnectionRequest, rejectConnectionRequest, deleteConnectionRequest,getUserConnections } = require('../controllers/connectionController');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all connections for a specific user
router.get('/:userId/connections', auth, getUserConnections);

// Send a connection request
router.post('/request', auth, sendConnectionRequest);

// Get all connection requests
router.get('/', auth, getConnectionRequests);

// Accept a connection request
router.put('/accept/:connectionId', auth, acceptConnectionRequest);

// Reject a connection request
router.put('/reject/:connectionId', auth, rejectConnectionRequest);

// Delete a connection request
router.delete('/delete/:connectionId', auth, deleteConnectionRequest);

module.exports = router;
