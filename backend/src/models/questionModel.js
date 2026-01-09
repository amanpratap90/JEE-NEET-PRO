const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    exam: {
        type: String,
        enum: ['jee-mains', 'neet'],
        required: [true, 'Exam type is required (jee-mains or neet)']
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        lowercase: true,
        trim: true
    },
    section: {
        type: String, // For Test Series: 'Physics', 'Chemistry', etc.
        lowercase: true,
        trim: true
    },
    chapter: {
        type: String,
        required: [true, 'Chapter name is required'],
        trim: true
    },
    questionText: {
        type: String,
        required: [true, 'Question text is required']
    },
    options: {
        type: [String], // Array of strings e.g. ["Option A", "Option B", "C", "D"]
        validate: [arrayLimit, '{PATH} must have at least 2 options']
    },
    correctAnswer: {
        type: String, // Code or index, or the full text. Let's use the actual string or index. Let's send index 0-3 for simplicity in UI? Or string. Let's use String for robustness.
        required: [true, 'Correct answer is required']
    },
    solution: {
        type: String, // Detailed explanation
        default: ''
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    image: {
        type: String, // URL or path to the image
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

function arrayLimit(val) {
    return val.length >= 2;
}

// Compound index for efficient searching by chapter
questionSchema.index({ exam: 1, subject: 1, chapter: 1 });

module.exports = mongoose.model('Question', questionSchema);
