const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});




// Register a new user
exports.register = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({ firstName, lastName, email, password });
        await user.save();

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
            if (err) throw err;
            res.json({ token, user });  // Return token and user object
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};



// Login user
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
            if (err) throw err;
            res.json({ token, user });  // Return token and user object
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};






// Update user profile with optional profile picture upload and password update
exports.updateProfile = async (req, res) => {
    const { firstName, lastName, address, country, state, city, zipcode, category, skill, password } = req.body;

    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Update fields
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.address = address || user.address;
        user.country = country || user.country;
        user.state = state || user.state;
        user.city = city || user.city;
        user.zipcode = zipcode || user.zipcode;
        user.category = category || user.category;
        user.skill = skill || user.skill;

        // If a new password is provided, assign it (the pre-save hook will handle hashing)
        if (password) {
            user.password = password;
        }

        // Check if a new profile picture is uploaded
        if (req.file && req.file.path) {
            user.profilePicture = req.file.path;
        }

        await user.save();

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};



// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Get other user's profile by ID
exports.getUserProfileById = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId)
            .select('-password -sentConnectionRequests -receivedConnectionRequests -sentBarterRequests -receivedBarterRequests'); // Adjust based on your User model
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        res.json(user);
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).send('Server error');
    }
};




// Delete user profile
exports.deleteProfile = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json({ msg: 'User deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};


// Send connection request
exports.sendConnectionRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { targetUserId } = req.body;

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if the connection request is already sent or the users are already connected
        if (targetUser.receivedRequests.includes(userId) || targetUser.connections.includes(userId)) {
            return res.status(400).json({ msg: 'Connection request already sent or users already connected' });
        }

        // Add the request to both users
        targetUser.receivedRequests.push(userId);
        const user = await User.findById(userId);
        user.sentRequests.push(targetUserId);

        await targetUser.save();
        await user.save();

        res.json({ msg: 'Connection request sent' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Accept connection request
exports.acceptConnectionRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { requesterId } = req.body;

        const requester = await User.findById(requesterId);
        const user = await User.findById(userId);

        if (!requester || !user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if there's a pending request
        if (!user.receivedRequests.includes(requesterId)) {
            return res.status(400).json({ msg: 'No connection request from this user' });
        }

        // Add each other to connections
        user.connections.push(requesterId);
        requester.connections.push(userId);

        // Remove the request from both users' requests arrays
        user.receivedRequests = user.receivedRequests.filter(id => id.toString() !== requesterId);
        requester.sentRequests = requester.sentRequests.filter(id => id.toString() !== userId);

        await user.save();
        await requester.save();

        res.json({ msg: 'Connection request accepted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Get all connections for a user
exports.getConnections = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('connections', 'firstName lastName profilePicture');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user.connections);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
