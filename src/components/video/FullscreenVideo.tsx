import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface FullscreenVideoProps {
  src: string;
  show: boolean;
}

export const FullscreenVideo: React.FC<FullscreenVideoProps> = ({ src, show }) => {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    setIsVisible(show);
  }, [show]);

  const handleVideoEnded = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return createPortal(
    <video
      autoPlay
      muted
      playsInline
      onEnded={handleVideoEnded}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        objectFit: 'cover',
        zIndex: 1000,
        backgroundColor: 'black'
      }}
    >
      <source src={src} type="video/mp4" />
    </video>,
    document.body
  );
};