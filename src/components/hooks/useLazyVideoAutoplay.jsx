import { useEffect, useRef, useState } from 'react';

/**
 * Lazy load videos and autoplay when buffer threshold is met
 * Improves performance and user experience
 */
export function useLazyVideoAutoplay(shouldPlay = false) {
  const videoRef = useRef(null);
  const [isBuffered, setIsBuffered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const BUFFER_THRESHOLD = 0.3; // 30% buffered before playing

  useEffect(() => {
    if (!videoRef.current || !shouldPlay) return;

    const video = videoRef.current;

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const duration = video.duration;
        const bufferedPercent = bufferedEnd / duration;

        if (bufferedPercent >= BUFFER_THRESHOLD && !isBuffered) {
          setIsBuffered(true);
          // Auto-play when buffer threshold met
          video.play()?.catch(err => console.log('Autoplay prevented:', err));
          setIsPlaying(true);
        }
      }
    };

    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);

    video.addEventListener('progress', handleProgress);
    video.addEventListener('pause', handlePause);
    video.addEventListener('play', handlePlay);

    return () => {
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('play', handlePlay);
    };
  }, [shouldPlay, isBuffered]);

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return {
    videoRef,
    isBuffered,
    isPlaying,
    togglePlayPause,
  };
}