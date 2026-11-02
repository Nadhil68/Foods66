import multer from 'multer';
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter(req, file, cb) {
        if (file.mimetype === 'image/jpeg' ||
            file.mimetype === 'image/png' ||
            file.mimetype === 'image/webp') {
            cb(null, true);
        }
        else {
            cb(new Error('Only JPG, PNG, WEBP are allowed'));
        }
    }
});
export default upload;
//# sourceMappingURL=upload.js.map