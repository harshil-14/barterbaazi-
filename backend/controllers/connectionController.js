const Connection = require('../models/Connection');
const User = require('../models/User');

// Get all connections for a specific user
exports.getUserConnections = async (req, res) => {
    const { userId } = req.params; // The ID of the user whose connections are being requested
    try {
        const user = await User.findById(userId).populate('connections', 'firstName lastName email profilePicture');

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (user.connections.length === 0) {
            return res.status(200).json({ msg: 'This user has no connections', connections: [] });
        }

        res.status(200).json({ connections: user.connections });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};




// Send connection request
exports.sendConnectionRequest = async (req, res) => {
    const { recipientId } = req.body; // User to whom the request is sent
    try {
        const requesterId = req.user.id; // The logged-in user sending the request

        // Prevent user from sending connection request to himself
        if (requesterId === recipientId) {
            return res.status(400).json({ msg: 'You cannot send a connection request to yourself' });
        }
        
        // Check if connection already exists between requester and recipient (in either direction)
        const existingConnection = await Connection.findOne({
            $or: [
                { requester: requesterId, recipient: recipientId },
                { requester: recipientId, recipient: requesterId }
            ]
        });

        if (existingConnection) {
            return res.status(400).json({ msg: 'A connection request already exists between these users' });
        }

        // Create new connection request
        const connection = new Connection({
            requester: requesterId,
            recipient: recipientId
        });

        await connection.save();

        // Add the connection request to both users
        await User.findByIdAndUpdate(requesterId, { $push: { sentConnectionRequests: recipientId } });
        await User.findByIdAndUpdate(recipientId, { $push: { receivedConnectionRequests: requesterId } });

        res.status(200).json({ msg: 'Connection request sent successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// Get all connection requests
exports.getConnectionRequests = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find connection requests where the user is either the requester or recipient
        const connections = await Connection.find({
            $or: [{ requester: userId }, { recipient: userId }]
        }).populate('requester recipient', 'firstName lastName email profilePicture'); // Populate user details

        res.status(200).json(connections);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// Accept a connection request
exports.acceptConnectionRequest = async (req, res) => {
    try {
        const { connectionId } = req.params;
        const userId = req.user.id; // The logged-in user (recipient trying to accept)

        // Find the connection
        const connection = await Connection.findById(connectionId);

        if (!connection) {
            return res.status(404).json({ msg: 'Connection not found' });
        }

        // Ensure the logged-in user is the recipient of the request
        if (connection.recipient.toString() !== userId) {
            return res.status(403).json({ msg: 'You can only accept connection requests sent to you' });
        }

        // Update the connection status to 'accepted'
        connection.status = 'accepted';
        await connection.save();

        // Add the connection to both users' connection lists
        await User.findByIdAndUpdate(connection.requester, { $push: { connections: connection.recipient } });
        await User.findByIdAndUpdate(connection.recipient, { $push: { connections: connection.requester } });

        // Optionally, remove the request from sentRequests/receivedRequests since it's now accepted
        await User.findByIdAndUpdate(connection.requester, { $pull: { sentConnectionRequests: connection.recipient } });
        await User.findByIdAndUpdate(connection.recipient, { $pull: { receivedConnectionRequests: connection.requester } });

        res.status(200).json({ msg: 'Connection accepted', connection });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};


// Reject a connection request
exports.rejectConnectionRequest = async (req, res) => {
    try {
        const { connectionId } = req.params;
        const userId = req.user.id; // The logged-in user (recipient trying to reject)

        // Find the connection
        const connection = await Connection.findById(connectionId);

        if (!connection) {
            return res.status(404).json({ msg: 'Connection not found' });
        }

        // Ensure the logged-in user is the recipient of the request
        if (connection.recipient.toString() !== userId) {
            return res.status(403).json({ msg: 'You can only reject connection requests sent to you' });
        }

        // Update the connection status to 'rejected'
        connection.status = 'rejected';
        await connection.save();

        // Optionally, remove the request from sentRequests/receivedRequests since it's now rejected
        await User.findByIdAndUpdate(connection.requester, { $pull: { sentConnectionRequests: connection.recipient } });
        await User.findByIdAndUpdate(connection.recipient, { $pull: { receivedConnectionRequests: connection.requester } });

        res.status(200).json({ msg: 'Connection rejected', connection });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};


// Delete or Cancel a connection request
exports.deleteConnectionRequest = async (req, res) => {
    try {
        const { connectionId } = req.params; // ID of the connection request to delete

        // Find the connection request by its ID
        const connection = await Connection.findById(connectionId);

        if (!connection) {
            return res.status(404).json({ msg: 'Connection request not found' });
        }

        // Remove the connection request from the sender's sentRequests and recipient's receivedRequests
        await User.findByIdAndUpdate(connection.requester, {
            $pull: { sentConnectionRequests: connection.recipient }
        });

        await User.findByIdAndUpdate(connection.recipient, {
            $pull: { receivedConnectionRequests: connection.requester }
        });

        // Delete the connection request from the Connection collection
        await connection.deleteOne();

        res.status(200).json({ msg: 'Connection request deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

