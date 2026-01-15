'use client';

import { useEffect, useState } from 'react';

export default function SplineScene({ scene }: { readonly scene: string }) {
  const [SplineComponent, setSplineComponent] = useState<any>(null);

  useEffect(() => {
    import('@splinetool/react-spline')
      .then((mod) => {
        setSplineComponent(() => mod.default);
      })
      .catch((err) => {
        console.error('Failed to load Spline:', err);
      });
  }, []);

  if (!SplineComponent) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-indigo-950/30 to-purple-950/30 flex items-center justify-center">
        <div className="text-white/50 text-sm">Loading 3D Scene...</div>
      </div>
    );
  }

  return <SplineComponent scene={scene} />;
}
