import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';

export const isNativePlatform = () => Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform();

// Camera functionality for iOS
export const takePicture = async () => {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
    });
    
    return image;
  } catch (error) {
    console.error('Error taking picture:', error);
    throw error;
  }
};

// Photo gallery access
export const selectFromGallery = async () => {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos,
    });
    
    return image;
  } catch (error) {
    console.error('Error selecting from gallery:', error);
    throw error;
  }
};

// Device info
export const getDeviceInfo = async () => {
  try {
    const info = await Device.getInfo();
    return info;
  } catch (error) {
    console.error('Error getting device info:', error);
    return null;
  }
};

// File system utilities
export const saveImageToDevice = async (imageUri: string, fileName: string) => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const base64Data = await convertBlobToBase64(blob);
    
    await Filesystem.writeFile({
      path: `golf-photos/${fileName}`,
      data: base64Data,
      directory: Directory.Documents,
    });
    
    return true;
  } catch (error) {
    console.error('Error saving image:', error);
    return false;
  }
};

const convertBlobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(blob);
  });
};