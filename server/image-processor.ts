import fs from 'fs';
import path from 'path';
import https from 'https';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// Convert Google Drive share link to direct download URL
function getDirectDownloadUrl(shareUrl: string): string {
  const fileIdMatch = shareUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (!fileIdMatch) {
    throw new Error('Invalid Google Drive URL');
  }
  const fileId = fileIdMatch[1];
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

// Download file from URL
async function downloadFile(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    
    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 302 || response.statusCode === 301) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          return downloadFile(redirectUrl, outputPath).then(resolve).catch(reject);
        }
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(outputPath, () => {}); // Delete partial file
        reject(err);
      });
    }).on('error', reject);
  });
}

// Process satellite image for web use
export async function processSatelliteImage(googleDriveUrl: string): Promise<string> {
  try {
    // Create assets directory if it doesn't exist
    const assetsDir = path.join(process.cwd(), 'client', 'public', 'assets');
    await mkdir(assetsDir, { recursive: true });
    
    // Convert to direct download URL
    const downloadUrl = getDirectDownloadUrl(googleDriveUrl);
    console.log('Downloading satellite image from:', downloadUrl);
    
    // Download the image
    const originalPath = path.join(assetsDir, 'satellite-original.jpg');
    await downloadFile(downloadUrl, originalPath);
    
    console.log('Satellite image downloaded successfully');
    
    // For now, just return the path - we'll add image optimization later
    return '/assets/satellite-original.jpg';
    
  } catch (error) {
    console.error('Error processing satellite image:', error);
    throw error;
  }
}

// Get hole coordinates (to be customized based on actual course layout)
export const HOLE_COORDINATES = {
  1: { x: 20, y: 15, name: "Downhill Drive" },
  2: { x: 35, y: 25, name: "Crosswind Challenge" },
  3: { x: 50, y: 35, name: "Across the Pasture" },
  4: { x: 65, y: 20, name: "Threading the Needle" },
  5: { x: 80, y: 30, name: "Tree-ohi" },
  6: { x: 75, y: 50, name: "Round the Bend" },
  7: { x: 60, y: 65, name: "Back to the Bush" },
  8: { x: 40, y: 70, name: "Drive the Line" },
  9: { x: 25, y: 60, name: "Through the V" },
  10: { x: 15, y: 80, name: "Sunset" },
  11: { x: 30, y: 85, name: "Stiletto" },
  12: { x: 45, y: 90, name: "Tunnel Vision" },
  13: { x: 60, y: 85, name: "Lucky" },
  14: { x: 75, y: 80, name: "Lost" },
  15: { x: 85, y: 70, name: "The Damn Hole" },
  16: { x: 90, y: 55, name: "The Big Show" },
  17: { x: 85, y: 40, name: "Found" },
  18: { x: 80, y: 25, name: "Coming Home" }
};