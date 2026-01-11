const Resource = require('../models/resourceModel');
const Question = require('../models/questionModel');
const { getRedisClient } = require('../config/redis');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const sharp = require('sharp');

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

exports.bulkImportQuestions = async (req, res, next) => {
    let tempDir = null;
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a zip file' });
        }

        const { exam, subject, chapter, section } = req.body;
        if (!exam || !subject || !chapter) {
            return res.status(400).json({ message: 'Missing exam, subject, or chapter' });
        }

        // 1. Unzip
        const zip = new AdmZip(req.file.path);
        const zipEntries = zip.getEntries();
        tempDir = path.join(__dirname, '../../uploads', `temp-${Date.now()}`);

        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
        zip.extractAllTo(tempDir, true);

        // 2. Read data.json (Recursively find it)
        /**
         * Recursively searches for a file in a directory.
         * @param {string} dirPath - The directory to search.
         * @param {string} fileName - The name of the file to find.
         * @returns {string|null} - The full path to the file, or null if not found.
         */
        const findFileRecursive = (dirPath, fileName) => {
            const files = fs.readdirSync(dirPath);
            for (const file of files) {
                const fullPath = path.join(dirPath, file);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    const result = findFileRecursive(fullPath, fileName);
                    if (result) return result;
                } else if (file === fileName) {
                    return fullPath;
                }
            }
            return null;
        };

        const dataFile = findFileRecursive(tempDir, 'data.json');

        if (!dataFile) {
            // Debug: List all files found to show in error
            const getAllFiles = (dir, fileList = []) => {
                const files = fs.readdirSync(dir);
                files.forEach(file => {
                    const filePath = path.join(dir, file);
                    if (fs.statSync(filePath).isDirectory()) {
                        getAllFiles(filePath, fileList);
                    } else {
                        fileList.push(path.relative(tempDir, filePath));
                    }
                });
                return fileList;
            };
            const allFiles = getAllFiles(tempDir);
            throw new Error(`data.json not found. Files found in zip: ${allFiles.join(', ')}`);
        }

        // Determine the root directory relative to data.json for resolving images
        // If data.json is in tempDir/folder/data.json, images should be in tempDir/folder/
        const dataDir = path.dirname(dataFile);

        const rawData = fs.readFileSync(dataFile, 'utf8');
        let questions = JSON.parse(rawData);

        // 3. Process Questions & Images
        const processedQuestions = [];
        const uploadDir = path.join(__dirname, '../../uploads');

        for (const q of questions) {
            const newQ = {
                ...q,
                exam,
                subject: subject.toLowerCase(),
                section: section || q.section, // Use provided section OR fallback to JSON, but mainly provided
                chapter: chapter.trim()
            };

            // Process Image
            if (newQ.image && typeof newQ.image === 'string' && newQ.image.trim() !== '') {
                const imagePath = path.join(dataDir, newQ.image); // Use dataDir instead of tempDir
                if (fs.existsSync(imagePath)) {
                    // Optimize Image
                    const filename = `bulk-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
                    const outputPath = path.join(uploadDir, filename);

                    await sharp(imagePath)
                        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                        .toFormat('webp', { quality: 80 })
                        .toFile(outputPath);

                    newQ.image = `/uploads/${filename}`;
                } else {
                    console.warn(`Image not found: ${newQ.image} at ${imagePath}`);
                    newQ.image = null;
                }
            } else {
                newQ.image = null;
            }

            processedQuestions.push(newQ);
        }

        // 4. Bulk Insert
        await Question.insertMany(processedQuestions);

        // 5. Cleanup
        fs.rmSync(tempDir, { recursive: true, force: true }); // Delete temp folder
        fs.unlinkSync(req.file.path); // Delete the uploaded zip file

        res.status(201).json({
            status: 'success',
            message: `Successfully added ${processedQuestions.length} questions`,
            data: { count: processedQuestions.length }
        });

    } catch (err) {
        // Cleanup on error
        if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        next(err);
    }
};
