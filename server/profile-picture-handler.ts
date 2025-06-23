import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

// Ensure profile pictures directory exists
export function ensureProfilePicturesDirectory() {
  const dir = path.join(process.cwd(), 'uploads', 'profiles');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Configure multer for profile picture uploads
export const profilePictureUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      ensureProfilePicturesDirectory();
      cb(null, path.join(process.cwd(), 'uploads', 'profiles'));
    },
    filename: (req, file, cb) => {
      const userId = (req as any).user?.id;
      const ext = path.extname(file.originalname);
      const filename = `profile-${userId}-${Date.now()}${ext}`;
      cb(null, filename);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

// Process and optimize profile picture
export async function processProfilePicture(filePath: string): Promise<string> {
  const outputPath = filePath.replace(/\.[^/.]+$/, '_optimized.jpg');
  
  try {
    await sharp(filePath)
      .rotate() // Auto-rotate based on EXIF orientation
      .resize(300, 300, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: 80,
        progressive: true
      })
      .toFile(outputPath);
    
    // Delete original file
    fs.unlinkSync(filePath);
    
    return outputPath;
  } catch (error) {
    // If processing fails, delete the original file and throw error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw new Error('Failed to process profile picture');
  }
}

// Get profile picture URL for serving
export function getProfilePictureUrl(filename: string): string {
  return `/uploads/profiles/${filename}`;
}