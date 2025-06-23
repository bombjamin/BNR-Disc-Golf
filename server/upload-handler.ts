import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'client', 'public', 'assets');
    await mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    cb(null, `satellite-${timestamp}${extension}`);
  }
});

// File filter for images
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WebP) are allowed'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  }
});

// Process uploaded satellite image
export async function processSatelliteImageUpload(filePath: string): Promise<{
  originalPath: string;
  optimizedPath: string;
  thumbnailPath: string;
}> {
  try {
    const directory = path.dirname(filePath);
    const filename = path.basename(filePath, path.extname(filePath));
    
    // Configure Sharp to handle large images
    sharp.cache(false);
    sharp.simd(false);
    
    // Create optimized version for web display (2048px max width)
    const optimizedPath = path.join(directory, `${filename}-optimized.jpg`);
    await sharp(filePath, { 
      limitInputPixels: false,
      sequentialRead: true 
    })
      .resize(2048, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ quality: 85, progressive: true })
      .toFile(optimizedPath);

    // Create thumbnail for previews (512px max width)
    const thumbnailPath = path.join(directory, `${filename}-thumbnail.jpg`);
    await sharp(filePath, { 
      limitInputPixels: false,
      sequentialRead: true 
    })
      .resize(512, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    console.log('Satellite image processed successfully');
    
    return {
      originalPath: `/assets/${path.basename(filePath)}`,
      optimizedPath: `/assets/${path.basename(optimizedPath)}`,
      thumbnailPath: `/assets/${path.basename(thumbnailPath)}`
    };
  } catch (error) {
    console.error('Error processing satellite image:', error);
    throw error;
  }
}

// Store satellite image paths in memory (in production, use database)
let satelliteImagePaths: {
  originalPath: string;
  optimizedPath: string;
  thumbnailPath: string;
} | null = null;

// Auto-detect existing satellite images on startup
export function detectExistingSatelliteImages(): {
  originalPath: string;
  optimizedPath: string;
  thumbnailPath: string;
} | null {
  try {
    const assetsDir = path.join(process.cwd(), 'client', 'public', 'assets');
    console.log('Checking assets directory:', assetsDir);
    
    if (!fs.existsSync(assetsDir)) {
      console.log('Assets directory does not exist');
      return null;
    }
    
    const files = fs.readdirSync(assetsDir);
    console.log('Found files:', files);
    
    // Find satellite files that have corresponding optimized and thumbnail versions
    const satelliteFiles = files.filter(f => f.startsWith('satellite-') && !f.endsWith('-optimized.jpg') && !f.endsWith('-thumbnail.jpg'));
    console.log('Satellite files found:', satelliteFiles);
    
    if (satelliteFiles.length === 0) return null;
    
    // Find the file that has both optimized and thumbnail versions
    let latestFile = null;
    for (const file of satelliteFiles.sort().reverse()) {
      const baseName = path.basename(file, path.extname(file));
      const optimizedFile = `${baseName}-optimized.jpg`;
      const thumbnailFile = `${baseName}-thumbnail.jpg`;
      
      if (files.includes(optimizedFile) && files.includes(thumbnailFile)) {
        latestFile = file;
        break;
      }
    }
    
    if (!latestFile) return null;
    
    console.log('Latest satellite file:', latestFile);
    
    const baseName = path.basename(latestFile, path.extname(latestFile));
    const optimizedFile = `${baseName}-optimized.jpg`;
    const thumbnailFile = `${baseName}-thumbnail.jpg`;
    
    console.log('Looking for optimized:', optimizedFile);
    console.log('Looking for thumbnail:', thumbnailFile);
    
    // Check if all files exist
    const optimizedExists = files.includes(optimizedFile);
    const thumbnailExists = files.includes(thumbnailFile);
    
    console.log('Optimized exists:', optimizedExists);
    console.log('Thumbnail exists:', thumbnailExists);
    
    if (optimizedExists && thumbnailExists) {
      const result = {
        originalPath: `/assets/${latestFile}`,
        optimizedPath: `/assets/${optimizedFile}`,
        thumbnailPath: `/assets/${thumbnailFile}`
      };
      console.log('Returning satellite paths:', result);
      return result;
    }
    
    return null;
  } catch (error) {
    console.error('Error detecting existing satellite images:', error);
    return null;
  }
}

export function setSatelliteImagePaths(paths: {
  originalPath: string;
  optimizedPath: string;
  thumbnailPath: string;
}) {
  satelliteImagePaths = paths;
}

export function getSatelliteImagePaths() {
  // If no paths in memory, try to detect existing files
  if (!satelliteImagePaths) {
    satelliteImagePaths = detectExistingSatelliteImages();
  }
  return satelliteImagePaths;
}