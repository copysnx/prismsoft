import { useState, useEffect, useRef } from 'react';
import celebrationVideo from '@/assets/celebration-video.mp4';

interface CelebrationVideoProps {
  show: boolean;
  onComplete?: () => void;
  duration?: number; // Duration in milliseconds, default 10 seconds
}

const CelebrationVideo = ({ show, onComplete, duration = 10000 }: CelebrationVideoProps) => {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (show) {
      setVisible(true);
      setFading(false);

      // Play video
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(console.error);
      }

      // Start fade out before duration ends
      const fadeTimeout = setTimeout(() => {
        setFading(true);
      }, duration - 1000);

      // Hide completely after duration
      const hideTimeout = setTimeout(() => {
        setVisible(false);
        setFading(false);
        if (videoRef.current) {
          videoRef.current.pause();
        }
        onComplete?.();
      }, duration);

      return () => {
        clearTimeout(fadeTimeout);
        clearTimeout(hideTimeout);
      };
    }
  }, [show, duration, onComplete]);

  if (!visible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 pointer-events-none transition-opacity duration-1000 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        muted
        playsInline
        autoPlay
      >
        <source src={celebrationVideo} type="video/mp4" />
      </video>
      
      {/* Gradient overlay to blend with content */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
    </div>
  );
};

export default CelebrationVideo;
