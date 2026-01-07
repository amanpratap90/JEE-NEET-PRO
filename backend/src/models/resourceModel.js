const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'A resource must have a title'],
        trim: true
    },
    description: String,
    fileUrl: {
        type: String,
        required: [true, 'File URL is required']
    },
    exam: {
        type: String,
        enum: ['jee-mains', 'neet'],
        required: true
    },
    subject: {
        type: String,
        required: true,
        lowercase: true
    },
    chapter: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['notes', 'short-notes', 'book', 'test-series', 'video'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Resource', resourceSchema);
