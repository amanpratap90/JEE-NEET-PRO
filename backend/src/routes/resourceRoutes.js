const express = require('express');
const resourceController = require('../controllers/resourceController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const upload = require('../middlewares/upload');
const uploadZip = require('../middlewares/uploadZip');

const router = express.Router();

// Public routes (or optional auth if you want to track progress later)
router.get('/', resourceController.getAllResources);
router.get('/questions', resourceController.getQuestions);
router.get('/chapters', resourceController.getChapters);

// Protected Admin routes
router.use(protect);
router.use(restrictTo('admin'));

router.post('/', resourceController.createResource);
router.post('/questions', upload.single('image'), resourceController.createQuestion);
router.post('/questions/bulk', uploadZip.single('file'), resourceController.bulkImportQuestions);

router.route('/questions/:id')
    .patch(upload.single('image'), resourceController.updateQuestion)
    .delete(resourceController.deleteQuestion);

router.post('/chapters/rename', resourceController.renameChapter);
router.post('/chapters/delete', resourceController.deleteChapter);

module.exports = router;
