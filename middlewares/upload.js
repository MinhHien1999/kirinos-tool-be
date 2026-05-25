import multer from 'multer';

const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 50 * 1024 * 1024, // Cho phép file đơn lẻ lên tới 50MB

    fieldSize: 50 * 1024 * 1024,
  },
});

export const uploadSingleFile =
  upload.single('logo');

export const uploadMultipleFiles =
  upload.array('images', 9);