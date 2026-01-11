const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept zip or rar
    if (!file.originalname.match(/\.(zip|rar|7z)$/)) {
        return cb(new Error('Only compressed files (.zip, .rar) are allowed!'), false);
    }
    cb(null, true);
};

const uploadZip = multer({
    storage: storage,
    fileFilter: fileFilter
});

module.exports = uploadZip;
