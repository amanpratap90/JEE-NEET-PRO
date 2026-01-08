require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/db');
require('./src/config/redis'); // This will trigger connection
const path = require('path');

const app = express();
// Trust Proxy for Render/Vercel (Load Balancers)
app.set('trust proxy', 1);


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to Databases
connectDB();


// Middlewares
app.use(helmet()); // Set security HTTP headers
app.use(compression()); // Compress all responses
app.use(express.json({ limit: '10kb' })); // Body parser, reading data from body into req.body
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
// app.use(mongoSanitize()); // Data sanitization against NoSQL query injection (Disabled due to req.query read-only error)
// app.use(xss()); // Data sanitization against XSS (Disabled due to req.query read-only error)

// CORS
const allowedOrigins = [
    'https://jee-neet-pro.onrender.com',
    'https://jee-neet-pro.onrender.co', // Handling user provided typo
    'http://localhost:5173',
    'http://localhost:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            console.log("Blocked by CORS:", origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Request Logger
app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.originalUrl}`);
    next();
});

// Rate Limiting
const limiter = rateLimit({
    max: 100, // Limit each IP to 100 requests per windowMs
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Routes
app.use('/api/v1/auth', require('./src/routes/authRoutes'));
app.use('/api/v1/resources', require('./src/routes/resourceRoutes'));

app.get('/', (req, res) => {
    res.status(200).json({ message: 'API is running successfully with optimizations!' });
});

// Global Error Handler
// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);

    // Duplicate Key Error (MongoDB code 11000)
    if (err.code === 11000) {
        return res.status(400).json({
            status: 'fail',
            message: 'Email already exists! Please use another email.'
        });
    }

    res.status(err.statusCode || 500).json({
        status: 'error',
        message: err.message || 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
