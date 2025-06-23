import multer from 'multer';
import path from 'path';
import fs from 'fs';

const UPLOADS_DIR = 'uploads/videos';
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB in bytes

export function ensureVideosDirectory() {
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads', { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

// Configure multer for video uploads
export const videoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      ensureVideosDirectory();
      cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `course-tour-${timestamp}-${sanitizedName}`;
      cb(null, filename);
    },
  }),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    // Only allow MP4 files
    if (file.mimetype === 'video/mp4') {
      cb(null, true);
    } else {
      const error = new Error('Only MP4 files are allowed') as any;
      error.code = 'INVALID_FILE_TYPE';
      cb(error, false);
    }
  },
});

export function getVideoUrl(filename: string): string {
  return `/uploads/videos/${filename}`;
}

export function deleteVideoFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting video file:', error);
  }
}