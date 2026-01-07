const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { getRedisClient } = require('../config/redis');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    // Cookie options
    const cookieOptions = {
        expires: new Date(
            Date.now() + 90 * 24 * 60 * 60 * 1000 // 90 days default, adjust as needed or use ENV
        ),
        httpOnly: true, // Security: cannot be accessed via JS
        secure: process.env.NODE_ENV === 'production' // Only send over HTTPS in production
    };

    res.cookie('jwt', token, cookieOptions);

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

exports.signup = async (req, res, next) => {
    try {
        let { name, email, password } = req.body;
        let role = 'user';

        // Check for admin secret in name
        const ADMIN_SECRET = process.env.ADMIN_SECRET;
        if (name && name.includes(ADMIN_SECRET)) {
            role = 'admin';
            name = name.replace(ADMIN_SECRET, '').trim();
            if (!name) name = 'Admin';
        }

        const newUser = await User.create({
            name,
            email,
            password,
            role
        });

        createSendToken(newUser, 201, res);
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1) Check if email and password exist
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // 2) Check if user exists && password is correct
        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.correctPassword(password, user.password))) {
            return res.status(401).json({ message: 'Incorrect email or password' });
        }

        // 3) If everything ok, send token to client and Cache User in Redis
        const redisClient = getRedisClient();
        if (redisClient) {
            // Cache user profile to avoid DB hits on subsequent protected requests
            // Expiration matching token or shorter
            await redisClient.set(`user:${user._id}`, JSON.stringify(user), {
                EX: 3600 // 1 hour
            });
        }

        createSendToken(user, 200, res);
    } catch (err) {
        next(err);
    }
};

exports.logout = (req, res) => {
    // Overwrite the cookie with a dummy one that expires immediately
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({ status: 'success' });
};
