import { useEffect, useState } from 'react';
import { isNativePlatform, getPlatform, getDeviceInfo } from '@/lib/capacitor';

export function usePlatform() {
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState<string>('web');
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    const initPlatform = async () => {
      const native = isNativePlatform();
      const platformName = getPlatform();
      const info = await getDeviceInfo();
      
      setIsNative(native);
      setPlatform(platformName);
      setDeviceInfo(info);
    };

    initPlatform();
  }, []);

  return {
    isNative,
    platform,
    deviceInfo,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isWeb: platform === 'web'
  };
}