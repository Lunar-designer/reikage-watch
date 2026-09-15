import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const videosDir = path.join(__dirname, '../uploads/videos');
const thumbnailsDir = path.join(__dirname, '../uploads/thumbnails');
const avatarsDir = path.join(__dirname, '../uploads/avatars');

[videosDir, thumbnailsDir, avatarsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'video') {
      cb(null, videosDir);
    } else if (file.fieldname === 'thumbnail') {
      cb(null, thumbnailsDir);
    } else if (file.fieldname === 'avatar') {
      cb(null, avatarsDir);
    } else {
      cb(new Error('Invalid fieldname'), false);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'video') {
    const allowedVideoTypes = /mp4|webm|mkv|mov/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const mime = file.mimetype;
    if (allowedVideoTypes.test(ext) || mime.startsWith('video/')) {
      return cb(null, true);
    }
    return cb(new Error('Invalid video format. Supported: MP4, WebM, MOV, MKV.'));
  }

  if (file.fieldname === 'thumbnail' || file.fieldname === 'avatar') {
    const allowedImgTypes = /jpg|jpeg|png|webp|svg\+xml|svg/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const mime = file.mimetype;
    if (allowedImgTypes.test(ext) || mime.startsWith('image/')) {
      return cb(null, true);
    }
    return cb(new Error('Invalid image format. Supported: PNG, JPG, JPEG, WEBP, SVG.'));
  }

  cb(new Error('Unsupported file field'));
};

export const uploadMedia = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500 MB limit
  }
});
