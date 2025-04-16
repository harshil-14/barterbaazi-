const Message = require('../models/Message');
const User = require('../models/User');

// Send a message
exports.sendMessage = async (req, res) => {
    const { recipientId, content } = req.body;

    try {
        const senderId = req.user.id;

        // Ensure recipient exists
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({ msg: 'Recipient not found' });
        }

        // Ensure sender and recipient are connected
        const sender = await User.findById(senderId);
        if (!sender.connections.includes(recipientId) || !recipient.connections.includes(senderId)) {
            return res.status(403).json({ msg: 'You are not connected with this user' });
        }

        // Create and save message
        const newMessage = new Message({
            sender: senderId,
            receiver: recipientId,
            content,
            status: 'sent'  // Default status when the message is sent
        });

        const message = await newMessage.save();
        res.json(message);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Get all messages for the logged-in user
exports.getMessages = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch messages where the user is either the sender or receiver
        const messages = await Message.find({
            $or: [{ sender: userId }, { receiver: userId }],
        }).sort({ date: -1 })
        .populate('sender', ['firstName', 'lastName', 'profilePicture'])  // Populate sender details
        .populate('receiver', ['firstName', 'lastName', 'profilePicture']); // Populate receiver details

        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Update a message
exports.updateMessage = async (req, res) => {
    const { content } = req.body;

    try {
        let message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ msg: 'Message not found' });
        }

        // Check if the logged-in user is the sender of the message
        if (message.sender.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized to edit this message' });
        }

        // Update the message content and possibly other fields
        message = await Message.findByIdAndUpdate(
            req.params.id,
            { $set: { content, edited: true } }, // Set edited to true
            { new: true }
        );

        res.json(message);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
    try {
        let message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ msg: 'Message not found' });
        }

        // Check if the logged-in user is the sender or recipient of the message
        if (message.sender.toString() !== req.user.id && message.receiver.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized to delete this message' });
        }

        await Message.findByIdAndRemove(req.params.id);
        res.json({ msg: 'Message deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
