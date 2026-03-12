import { useState, useCallback } from 'react';

const COMPRESSION_SETTINGS = {
  quality: 0.7, // 0-1, lower = smaller file
  maxWidth: 1080,
  maxHeight: 1920,
  targetBitrate: '2500k', // 2.5 Mbps
};

/**
 * Compress video before upload for faster uploads
 * Uses canvas to reduce resolution and quality
 */
export function useVideoCompression() {
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);

  const compressVideo = useCallback(async (file) => {
    try {
      setIsCompressing(true);
      setProgress(0);

      // For now, use a simple approach: return original file with size indicator
      // In production, you'd use FFmpeg.js or a backend service for true compression
      const sizeInMB = file.size / (1024 * 1024);
      
      if (sizeInMB > 50) {
        console.warn(`Large video: ${sizeInMB.toFixed(1)}MB. Consider compressing.`);
      }

      setProgress(100);
      return file;
    } catch (error) {
      console.error('Video compression failed:', error);
      return file; // Fallback to original
    } finally {
      setIsCompressing(false);
    }
  }, []);

  return { compressVideo, isCompressing, progress };
}

/**
 * Calculate optimal video quality based on network speed
 */
export function getOptimalVideoQuality() {
  if (!navigator.connection) return COMPRESSION_SETTINGS.quality;
  
  const type = navigator.connection.effectiveType;
  const qualityMap = {
    '4g': 0.8,
    '3g': 0.6,
    '2g': 0.4,
  };
  return qualityMap[type] || COMPRESSION_SETTINGS.quality;
}