'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { AIAssistantPopup } from '@/components/ai-assistant-popup';

interface AnalysisResult {
  ok: boolean;
  model: string;
  output_text: string;
  runtime: {
    device: string;
    seconds: number;
  };
  disclaimer: string;
}

export default function CXRAIPage() {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('Find abnormalities and support devices.');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      setError('Invalid file type. Please upload a PNG or JPG image.');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    setError(null);
    setImage(file);
    setResult(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      // Reset drag state
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!image) {
      setError('Please select an image first.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('prompt', prompt);

      const response = await fetch(`${API_BASE_URL}/api/cxr/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-xl font-bold text-gray-900">
              SkinCare Awareness
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/ai-medical-center"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                AI Medical Center
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-white/60 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/"
                className="flex items-center gap-2 bg-white/60 backdrop-blur-md text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-white/80 transition-all duration-300 border-2 border-white/50 hover:border-white/80 shadow-lg hover:shadow-xl"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="backdrop-blur-xl bg-white/50 rounded-3xl p-8 md:p-10 shadow-2xl border border-white/40 hover:border-white/60 transition-all duration-500 inline-block">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-3 tracking-tight">
              CXR AI
              <span className="text-blue-600 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500"> Analysis</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-800 font-light">
              Upload a chest X-ray image for AI-powered analysis and reasoning
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card className="backdrop-blur-xl bg-white/50 rounded-3xl shadow-2xl border border-white/40">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl font-extrabold text-gray-900">
                Upload X-Ray Image
              </CardTitle>
              <CardDescription className="text-base md:text-lg text-gray-800 font-light">
                Upload a chest X-ray image (PNG or JPG, max 10MB)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Prompt Input */}
              <div className="space-y-2">
                <Label htmlFor="prompt" className="text-gray-900 font-semibold">
                  Analysis Prompt
                </Label>
                <Input
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Find abnormalities and support devices."
                  className="bg-white/80 border-white/60"
                />
              </div>

              {/* Image Upload Area */}
              {!imagePreview ? (
                <div
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/60 rounded-2xl p-12 text-center cursor-pointer hover:border-blue-400/60 transition-all duration-300 bg-white/30 backdrop-blur-md hover:bg-white/40"
                >
                  <Upload className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-800 font-semibold mb-2 text-lg">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-600">
                    PNG, JPG up to 10MB
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative rounded-2xl overflow-hidden border-2 border-white/60 bg-white/30 backdrop-blur-md">
                    <img
                      src={imagePreview}
                      alt="X-ray preview"
                      className="w-full h-auto max-h-96 object-contain"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {/* Analyze Button */}
              <Button
                onClick={handleAnalyze}
                disabled={!image || isAnalyzing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze X-Ray'
                )}
              </Button>

              {/* Error Display */}
              {error && (
                <div className="p-5 bg-red-50/80 backdrop-blur-md border-2 border-red-200/60 rounded-2xl flex items-start gap-3 shadow-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-700 mb-1">
                      Error
                    </p>
                    <p className="text-sm text-gray-800">
                      {error}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="backdrop-blur-xl bg-white/50 rounded-3xl shadow-2xl border border-white/40">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl font-extrabold text-gray-900">
                Analysis Results
              </CardTitle>
              <CardDescription className="text-base md:text-lg text-gray-800 font-light">
                AI-powered chest X-ray analysis and reasoning
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                  <p className="text-gray-800 font-light text-lg">
                    Analyzing X-ray image...
                  </p>
                  <p className="text-sm text-gray-600">
                    This may take a few moments
                  </p>
                </div>
              ) : result ? (
                <div className="space-y-6">
                  {/* Success Indicator */}
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">Analysis Complete</span>
                  </div>

                  {/* Model Info */}
                  <div className="bg-white/60 backdrop-blur-md rounded-xl p-4 border border-white/60">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">Model:</span>
                      <span className="text-sm text-gray-900">{result.model}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">Device:</span>
                      <span className="text-sm text-gray-900">{result.runtime.device.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700">Processing Time:</span>
                      <span className="text-sm text-gray-900">{result.runtime.seconds}s</span>
                    </div>
                  </div>

                  {/* Analysis Output */}
                  <div className="bg-white/60 backdrop-blur-md rounded-xl p-6 border border-white/60">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Analysis Report
                    </h3>
                    <div className="prose prose-sm max-w-none">
                      <div className="text-gray-800 font-light leading-relaxed whitespace-pre-wrap">
                        {result.output_text}
                      </div>
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="bg-amber-50/80 backdrop-blur-md rounded-xl p-4 border-2 border-amber-200/60">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-800 leading-relaxed">
                        <strong className="font-semibold text-gray-900">Disclaimer:</strong>{' '}
                        {result.disclaimer}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-600 font-light">
                  <p className="text-lg mb-2">No analysis yet</p>
                  <p className="text-sm">Upload an X-ray image and click "Analyze X-Ray" to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Safety Disclaimer Footer */}
        <footer className="border-t border-white/20 bg-white/40 backdrop-blur-lg py-8 mt-12 rounded-3xl">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="backdrop-blur-xl bg-white/50 rounded-2xl p-6 shadow-xl border border-white/40">
              <p className="text-xs md:text-sm text-gray-800 text-center leading-relaxed font-light">
                <strong className="font-semibold text-gray-900">Medical Disclaimer:</strong> CXR AI is a research and educational tool and does not 
                replace professional medical advice, diagnosis, or treatment. Always seek the advice 
                of your physician or other qualified health provider with any questions you may have 
                regarding a medical condition. Never disregard professional medical advice or delay in 
                seeking it because of something you have read or analyzed using CXR AI.
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* AI Assistant Popup - Available in all sections */}
      <AIAssistantPopup />
    </div>
  );
}
