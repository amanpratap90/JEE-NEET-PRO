const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userModel');
const { getRedisClient } = require('../config/redis');

exports.protect = async (req, res, next) => {
    try {
        let token;

        // 1) Getting token and check of it's there
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies.jwt) {
            token = req.cookies.jwt;
        }

        if (!token) {
            return res.status(401).json({ message: 'You are not logged in! Please log in to get access.' });
        }

        // 2) Verification token
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

        // 3) Check if user still exists
        // optimization: Check Redis first
        const redisClient = getRedisClient();
        let currentUser;

        if (redisClient) {
            const cachedUser = await redisClient.get(`user:${decoded.id}`);
            if (cachedUser) {
                currentUser = JSON.parse(cachedUser);
                console.log('⚡ Redis Cache HIT: User session found');
                console.log('⚡ Redis Cache HIT: User session found');
            }
        }

        if (!currentUser) {
            currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return res.status(401).json({ message: 'The user belonging to this token does no longer exist.' });
            }
        }

        // GRANT ACCESS TO PROTECTED ROUTE
        req.user = currentUser;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token or session expired' });
    }
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles ['admin', 'lead-guide']. role='user'
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'You do not have permission to perform this action' });
        }
        next();
    };
};
