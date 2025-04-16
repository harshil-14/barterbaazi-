const mongoose = require('mongoose');
const BarterRequest = require('../models/BarterRequest');
const User = require('../models/User');

// Create a new barter request
exports.createRequest = async (req, res) => {
    const { responder, requestedSkill, offeredSkill } = req.body;

    try {
        // Check if req.user is defined
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'User not authenticated' });
        }

        // Check if responder is provided
        if (!responder) {
            return res.status(400).json({ msg: 'Responder is required' });
        }

        // Check if IDs are valid ObjectIDs
        if (!mongoose.Types.ObjectId.isValid(req.user.id) || !mongoose.Types.ObjectId.isValid(responder)) {
            return res.status(400).json({ msg: 'Invalid user ID' });
        }

        // Create a new barter request
        const newRequest = new BarterRequest({
            requester: req.user.id,
            responder,
            requestedSkill,
            offeredSkill,
            status: 'pending', // Default status when the request is created
        });

        const request = await newRequest.save();

        // Update sentBarterRequests for the requester (logged-in user)
        await User.findByIdAndUpdate(
            req.user.id,
            { $push: { sentBarterRequests: request._id } }, // Add the request ID to the sentBarterRequests array
            { new: true }
        );

        // Update receivedBarterRequests for the responder
        await User.findByIdAndUpdate(
            responder,
            { $push: { receivedBarterRequests: request._id } }, // Add the request ID to the receivedBarterRequests array
            { new: true }
        );

        res.json(request);
    } catch (err) {
        console.error('Error:', err); // Log the full error object for better debugging
        res.status(500).send('Server error');
    }
};

// Get all requests for the logged-in user (either requester or responder)
exports.getRequests = async (req, res) => {
    try {
        const requests = await BarterRequest.find({
            $or: [
                { requester: req.user.id },
                { responder: req.user.id }
            ]
        }).populate('requester responder', ['firstName', 'lastName', 'profilePicture']); // Include profilePicture
        
        res.json(requests);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Update a barter request by ID
exports.updateRequest = async (req, res) => {
    const { requestedSkill, offeredSkill, status } = req.body;

    try {
        let request = await BarterRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ msg: 'Request not found' });
        }

        // Check if the logged-in user is the requester
        if (request.requester.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Update the fields
        request = await BarterRequest.findByIdAndUpdate(
            req.params.id,
            { $set: { requestedSkill, offeredSkill, status } },
            { new: true }
        );

        res.json(request);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Delete a barter request by ID
exports.deleteRequest = async (req, res) => {
    try {
        let request = await BarterRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ msg: 'Request not found' });
        }

        // Check if the logged-in user is the requester or responder
        if (request.requester.toString() !== req.user.id && request.responder.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await BarterRequest.findByIdAndDelete(req.params.id);
        
        // Update sentBarterRequests for the requester
        await User.findByIdAndUpdate(
            request.requester,
            { $pull: { sentBarterRequests: req.params.id } }, // Remove the request ID from the sentBarterRequests array
            { new: true }
        );

        // Update receivedBarterRequests for the responder
        await User.findByIdAndUpdate(
            request.responder,
            { $pull: { receivedBarterRequests: req.params.id } }, // Remove the request ID from the receivedBarterRequests array
            { new: true }
        );

        res.json({ msg: 'Request removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Accept a barter request by ID
exports.acceptRequest = async (req, res) => {
    try {
        let request = await BarterRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ msg: 'Request not found' });
        }

        // Check if the logged-in user is the responder
        if (request.responder.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Update the request status to 'accepted'
        request = await BarterRequest.findByIdAndUpdate(
            req.params.id,
            { $set: { status: 'accepted' } },
            { new: true }
        );

        res.json(request);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Reject a barter request by ID
exports.rejectRequest = async (req, res) => {
    try {
        let request = await BarterRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ msg: 'Request not found' });
        }

        // Check if the logged-in user is the responder
        if (request.responder.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Update the request status to 'rejected'
        request = await BarterRequest.findByIdAndUpdate(
            req.params.id,
            { $set: { status: 'rejected' } },
            { new: true }
        );

        res.json(request);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
