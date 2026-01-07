const Resource = require('../models/resourceModel');
const Question = require('../models/questionModel');
const { getRedisClient } = require('../config/redis');

// --- Resources (Notes, Books, etc) ---

exports.getAllResources = async (req, res, next) => {
    try {
        const queryObj = { ...req.query };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]);

        // Basic filtering (e.g. ?exam=jee-mains&subject=physics)
        const resources = await Resource.find(queryObj);

        res.status(200).json({
            status: 'success',
            results: resources.length,
            data: { resources }
        });
    } catch (err) {
        next(err);
    }
};

exports.createResource = async (req, res, next) => {
    try {
        const newResource = await Resource.create(req.body);
        res.status(201).json({ status: 'success', data: { resource: newResource } });
    } catch (err) {
        next(err);
    }
};

// --- Questions ---

exports.createQuestion = async (req, res, next) => {
    try {
        // Handle Image Upload
        if (req.file) {
            req.body.image = `/uploads/${req.file.filename}`;
        }

        // Normalize Chapter (trim)
        if (req.body.chapter) {
            req.body.chapter = req.body.chapter.trim();
        }

        const newQuestion = await Question.create(req.body);
        res.status(201).json({ status: 'success', data: { question: newQuestion } });
    } catch (err) {
        next(err);
    }
};

exports.getQuestions = async (req, res, next) => {
    try {
        const { exam, subject, chapter } = req.query;
        console.log('GET /questions query:', req.query); // DEBUG LOG

        if (!exam || !subject) {
            return res.status(400).json({ message: 'Please provide exam and subject' });
        }

        // Case-insensitive match for subject
        const filter = {
            exam,
            subject: { $regex: new RegExp(`^${subject}$`, 'i') }
        };

        if (chapter) {
            // Case-insensitive match for chapter too, to be safe
            filter.chapter = { $regex: new RegExp(`^${chapter}$`, 'i') };
        }

        console.log('Filtering questions with:', filter);

        const questions = await Question.find(filter);
        console.log(`Found ${questions.length} questions`);

        res.status(200).json({
            status: 'success',
            results: questions.length,
            data: { questions }
        });
    } catch (err) {
        next(err);
    }
};

exports.updateQuestion = async (req, res, next) => {
    try {
        if (req.file) {
            req.body.image = `/uploads/${req.file.filename}`;
        }

        if (req.body.chapter) {
            req.body.chapter = req.body.chapter.trim();
        }

        const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }
        res.status(200).json({ status: 'success', data: { question } });
    } catch (err) {
        next(err);
    }
};

exports.deleteQuestion = async (req, res, next) => {
    try {
        await Question.findByIdAndDelete(req.params.id);
        res.status(204).json({ status: 'success', data: null });
    } catch (err) {
        next(err);
    }
};

exports.getChapters = async (req, res, next) => {
    try {
        const { exam, subject } = req.query;
        console.log('GET /chapters query:', req.query); // DEBUG LOG

        const filter = {
            exam,
            // Case-insensitive match for subject
            subject: subject ? { $regex: new RegExp(`^${subject}$`, 'i') } : null
        };

        console.log('Finding chapters with filter:', filter);

        // Get distinct chapters from both Questions and Resources
        const questionChapters = await Question.distinct('chapter', filter);
        const resourceChapters = await Resource.distinct('chapter', filter);

        // Merge and unique
        const allChapters = [...new Set([...questionChapters, ...resourceChapters])].sort();
        console.log('Found chapters:', allChapters);

        res.status(200).json({
            status: 'success',
            results: allChapters.length,
            data: { chapters: allChapters }
        });
    } catch (err) {
        next(err);
    }
};

exports.renameChapter = async (req, res, next) => {
    try {
        const { exam, subject, oldChapterName, newChapterName } = req.body;

        await Question.updateMany(
            { exam, subject: subject.toLowerCase(), chapter: oldChapterName },
            { chapter: newChapterName }
        );

        await Resource.updateMany(
            { exam, subject: subject.toLowerCase(), chapter: oldChapterName },
            { chapter: newChapterName }
        );

        res.status(200).json({ status: 'success', message: 'Chapter renamed successfully' });
    } catch (err) {
        next(err);
    }
};

exports.deleteChapter = async (req, res, next) => {
    try {
        const { exam, subject, chapter } = req.body;

        if (!exam || !subject || !chapter) {
            return res.status(400).json({ message: 'Please provide exam, subject, and chapter' });
        }

        const deleteQuestions = await Question.deleteMany({
            exam,
            subject: subject.toLowerCase(),
            chapter
        });

        const deleteResources = await Resource.deleteMany({
            exam,
            subject: subject.toLowerCase(),
            chapter
        });

        res.status(200).json({
            status: 'success',
            message: `Chapter deleted successfully. Removed ${deleteQuestions.deletedCount} questions and ${deleteResources.deletedCount} resources.`
        });
    } catch (err) {
        next(err);
    }
};
