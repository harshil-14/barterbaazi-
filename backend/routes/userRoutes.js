const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const {
    register,
    login,
    updateProfile,
    getProfile,
    deleteProfile,
    getUserProfileById
} = require('../controllers/userController');
const auth = require('../middleware/auth');

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer configuration for Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'profile_pictures',
        allowed_formats: ['jpg', 'png'],
    },
});

const upload = multer({ storage });

const router = express.Router();

// Route for registering a new user
router.post('/register', register);

// Route for logging in a user
router.post('/login', login);

// Route for updating user profile with profile picture upload
router.put('/profile', auth, upload.single('profilePicture'), updateProfile); // Added multer middleware for profile picture upload

// Route for getting user profile
router.get('/profile', auth, getProfile);


// Route for getting another user's profile by ID
router.get('/profile/:userId', auth, getUserProfileById);


// Route for deleting user profile
router.delete('/profile', auth, deleteProfile);

module.exports = router;
