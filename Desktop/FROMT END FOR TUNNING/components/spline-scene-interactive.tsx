'use client';

import { useEffect, useRef, useState } from 'react';
import { Application } from '@splinetool/runtime';

interface SplineSceneInteractiveProps {
  readonly scene: string;
  readonly onLoad?: (spline: Application) => void;
}

export default function SplineSceneInteractive({ scene, onLoad }: SplineSceneInteractiveProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [SplineComponent, setSplineComponent] = useState<any>(null);
  const splineRef = useRef<Application | null>(null);

  // Dynamically import Spline component only on client side
  useEffect(() => {
    import('@splinetool/react-spline')
      .then((mod) => {
        setSplineComponent(() => mod.default);
      })
      .catch((err) => {
        console.error('Failed to load Spline:', err);
        setError('Failed to load 3D scene');
        setIsLoading(false);
      });
  }, []);

  const handleLoad = (spline: Application) => {
    splineRef.current = spline;
    setIsLoading(false);
    if (onLoad) {
      onLoad(spline);
    }
  };

  const handleError = (error?: any) => {
    console.error('Spline loading error:', error);
    setIsLoading(false);
    setError('Failed to load 3D scene');
    if (onLoad) {
      try {
        onLoad({} as Application);
      } catch (e) {
        console.error('Error in onLoad callback:', e);
      }
    }
  };

  // Return completely transparent container - no white backgrounds
  if (error || !SplineComponent) {
    return (
      <div className="w-full h-full" style={{ background: 'transparent' }}></div>
    );
  }

  // Add CSS to make canvas transparent
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      canvas {
        background: transparent !important;
        background-color: transparent !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div 
      className="w-full h-full relative" 
      style={{ 
        background: 'transparent',
        backgroundColor: 'transparent',
      }}
    >
      <div 
        className="w-full h-full" 
        style={{ 
          background: 'transparent',
          backgroundColor: 'transparent',
        }}
      >
        <SplineComponent
          scene={scene}
          onLoad={handleLoad}
          onError={handleError}
          style={{ 
            background: 'transparent',
            backgroundColor: 'transparent',
          }}
        />
      </div>
    </div>
  );
}
