const multer = require('multer');

const upload = multer({
  limits: { fileSize: 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload a image'));
    }

    cb(undefined, true);
  }
});

module.exports = upload;
