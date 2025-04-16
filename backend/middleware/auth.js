const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // Get token from Authorization header
    const authHeader = req.header('Authorization');

    // Check if Authorization header exists and follows the Bearer format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Extract the token from the Bearer <token> format
    const token = authHeader.split(' ')[1];

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
