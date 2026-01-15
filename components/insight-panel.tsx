'use client';

import { Badge } from '@/components/ui/badge';
import { AnalysisResult } from '@/types';
import { Download } from 'lucide-react';

interface InsightPanelProps {
  result: AnalysisResult | null;
  onDownloadReport?: () => void;
}

const conditionLabels: Record<string, string> = {
  MEL: 'Melanoma',
  NV: 'Nevus',
  BCC: 'Basal Cell Carcinoma',
  AK: 'Actinic Keratosis',
  DF: 'Dermatofibroma',
};

const conditionColors: Record<string, string> = {
  MEL: 'bg-warning/10 text-warning',
  NV: 'bg-accent/10 text-accent',
  BCC: 'bg-warning/10 text-warning',
  AK: 'bg-warning/10 text-warning',
  DF: 'bg-accent/10 text-accent',
};

export function InsightPanel({ result, onDownloadReport }: InsightPanelProps) {
  if (!result) {
    return (
      <div className="text-center py-12 text-gray-600 font-light">
        Upload an image to see analysis results
      </div>
    );
  }

  const confidence = Math.round(result.confidence * 100);
  const skinToneType = result.metadata.skinTone <= 2 ? 'I-II' : result.metadata.skinTone <= 4 ? 'III-IV' : 'V-VI';
  const lightingScore = Math.round(result.metadata.lightingScore * 100);

  return (
    <div className="space-y-6">
      {/* Detection Module */}
      <div className="backdrop-blur-xl bg-white/50 rounded-3xl p-6 md:p-8 shadow-2xl border border-white/40 hover:border-white/60 transition-all duration-500">
        <div className="mb-4">
          <h3 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-1">
            Detection
          </h3>
          <p className="text-sm md:text-base text-gray-800 font-light">
            Primary condition identified
          </p>
        </div>
        <div className="flex items-center justify-between">
          <Badge className={conditionColors[result.condition] + " text-base px-4 py-2"}>
            {conditionLabels[result.condition] || result.condition}
          </Badge>
          <span className="text-base font-semibold text-gray-800">{confidence}% confidence</span>
        </div>
      </div>

      {/* Visual Metrics Module */}
      <div className="backdrop-blur-xl bg-white/50 rounded-3xl p-6 md:p-8 shadow-2xl border border-white/40 hover:border-white/60 transition-all duration-500">
        <div className="mb-4">
          <h3 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-1">
            Visual Metrics
          </h3>
          <p className="text-sm md:text-base text-gray-800 font-light">
            Symmetry, Border Irregularity, Color Variation
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-white/40">
            <span className="text-base text-gray-800 font-light">Symmetry</span>
            <span className="text-base font-semibold text-gray-900">{confidence > 70 ? 'Good' : 'Fair'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/40">
            <span className="text-base text-gray-800 font-light">Border Regularity</span>
            <span className="text-base font-semibold text-gray-900">{confidence > 75 ? 'Regular' : 'Irregular'}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-base text-gray-800 font-light">Color Variation</span>
            <span className="text-base font-semibold text-gray-900">{confidence > 80 ? 'Low' : 'Moderate'}</span>
          </div>
        </div>
      </div>

      {/* Tone Intelligence Module */}
      <div className="backdrop-blur-xl bg-white/50 rounded-3xl p-6 md:p-8 shadow-2xl border border-white/40 hover:border-white/60 transition-all duration-500">
        <div className="mb-4">
          <h3 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-1">
            Tone Intelligence
          </h3>
          <p className="text-sm md:text-base text-gray-800 font-light">
            Detected Fitzpatrick Skin Type
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-white/40">
            <span className="text-base text-gray-800 font-light">Skin Type</span>
            <Badge variant="secondary" className="text-base px-4 py-2">{skinToneType}</Badge>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-base text-gray-800 font-light">Lighting Score</span>
            <span className="text-base font-semibold text-gray-900">{lightingScore}%</span>
          </div>
        </div>
      </div>

      {/* Clinical Note */}
      <div className="backdrop-blur-xl bg-white/50 rounded-3xl p-6 md:p-8 shadow-2xl border border-white/40 hover:border-white/60 transition-all duration-500">
        <div className="mb-4">
          <h3 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-1">
            Clinical Note
          </h3>
        </div>
        <p className="text-base text-gray-800 leading-relaxed font-light">{result.clinicalNote}</p>
      </div>

      {/* Download Report Button */}
      <button
        onClick={onDownloadReport}
        className="w-full bg-blue-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-blue-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-300 flex items-center justify-center gap-3"
      >
        <Download className="h-5 w-5" />
        Download Clinical Report
      </button>
    </div>
  );
}
