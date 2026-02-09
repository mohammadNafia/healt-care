'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClinicalSidebar } from '@/components/clinical-sidebar';
import { DiagnosticCanvas } from '@/components/diagnostic-canvas';
import { InsightPanel } from '@/components/insight-panel';
import { HistoryTable } from '@/components/history-table';
import { QualityAlert } from '@/components/quality-alert';
import { useAnalysis } from '@/hooks/use-analysis';
import { useSkinHistory } from '@/hooks/use-skin-history';
import { Upload, AlertCircle, Home } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import { AIAssistantPopup } from '@/components/ai-assistant-popup';

export default function DashboardPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { analyze, isLoading, error, result, imageUrl } = useAnalysis();
  const { history, isLoading: historyLoading } = useSkinHistory();
  const [showQualityAlert, setShowQualityAlert] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check image quality (mock check)
      const img = new Image();
      img.onload = () => {
        // Simulate quality check
        if (img.width < 200 || img.height < 200) {
          setShowQualityAlert(true);
          return;
        }
        setShowQualityAlert(false);
        analyze(file);
      };
      img.src = URL.createObjectURL(file);
    }
  };

  const handleDownloadReport = () => {
    if (!result) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Curbside Clinical Report', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Condition: ${result.condition}`, 20, 40);
    doc.text(`Confidence: ${Math.round(result.confidence * 100)}%`, 20, 50);
    doc.text(`Clinical Note: ${result.clinicalNote}`, 20, 60);
    doc.text(`Skin Tone: ${result.metadata.skinTone}`, 20, 70);
    doc.text(`Lighting Score: ${Math.round(result.metadata.lightingScore * 100)}%`, 20, 80);

    doc.text('Disclaimer:', 20, 100);
    doc.setFontSize(10);
    doc.text('This report is for informational purposes only and does not replace', 20, 110);
    doc.text('professional medical advice. Please consult with a healthcare provider.', 20, 115);

    doc.save(`curbside-report-${result.id}.pdf`);
  };

  const handleRetryScan = () => {
    setShowQualityAlert(false);
    fileInputRef.current?.click();
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
                href="/"
                className="flex items-center gap-2 bg-white/60 backdrop-blur-md text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-white/80 transition-all duration-300 border-2 border-white/50 hover:border-white/80 shadow-lg hover:shadow-xl"
              >
                <Home className="w-4 h-4" />
                Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="mb-8">
          <div className="backdrop-blur-xl bg-white/50 rounded-3xl p-8 md:p-10 shadow-2xl border border-white/40 hover:border-white/60 transition-all duration-500 inline-block">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-3 tracking-tight">
              Clinical
              <span className="text-blue-600 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500"> Hub</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-800 font-light">
              Upload a skin scan for AI-powered analysis
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Clinical Sidebar */}
          <div className="lg:col-span-1">
            <ClinicalSidebar />
          </div>

          {/* Main Analysis Area */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="scan" className="space-y-6">
              <TabsList className="backdrop-blur-xl bg-white/50 rounded-2xl p-1.5 shadow-xl border border-white/40 gap-2">
                <TabsTrigger 
                  value="scan"
                  className="data-[state=active]:bg-white/80 data-[state=active]:shadow-lg rounded-xl px-6 py-2.5 font-semibold text-gray-800 data-[state=active]:text-blue-600 transition-all duration-300"
                >
                  New Scan
                </TabsTrigger>
                <TabsTrigger 
                  value="history"
                  className="data-[state=active]:bg-white/80 data-[state=active]:shadow-lg rounded-xl px-6 py-2.5 font-semibold text-gray-800 data-[state=active]:text-blue-600 transition-all duration-300"
                >
                  History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="scan" className="space-y-6">
                {/* Upload Area */}
                <div className="backdrop-blur-xl bg-white/50 rounded-3xl p-8 md:p-10 shadow-2xl border border-white/40 hover:border-white/60 transition-all duration-500">
                  <div className="mb-6">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
                      Upload Scan
                    </h2>
                    <p className="text-base md:text-lg text-gray-800 font-light">
                      Upload a clear image of the skin area to analyze
                    </p>
                  </div>
                  <div className="space-y-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {!imageUrl && (
                      <div
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
                    )}

                    {imageUrl && (
                      <DiagnosticCanvas
                        imageUrl={imageUrl}
                        isAnalyzing={isLoading}
                        className="w-full h-64"
                      />
                    )}

                    {showQualityAlert && (
                      <QualityAlert
                        message="Image clarity is low. For a 99% accuracy rate, please move to natural lighting and retry."
                        onRetry={handleRetryScan}
                      />
                    )}

                    {error && (
                      <div className="p-5 bg-red-50/80 backdrop-blur-md border-2 border-red-200/60 rounded-2xl flex items-start gap-3 shadow-lg">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-red-700 mb-1">
                            Analysis Error
                          </p>
                          <p className="text-sm text-gray-800">
                            {error instanceof Error ? error.message : 'An error occurred during analysis'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Insight Panel */}
                <InsightPanel
                  result={result || null}
                  onDownloadReport={handleDownloadReport}
                />
              </TabsContent>

              <TabsContent value="history">
                <div className="backdrop-blur-xl bg-white/50 rounded-3xl p-8 md:p-10 shadow-2xl border border-white/40 hover:border-white/60 transition-all duration-500">
                  <div className="mb-6">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
                      Scan History
                    </h2>
                    <p className="text-base md:text-lg text-gray-800 font-light">
                      View your previous scans and assessments
                    </p>
                  </div>
                  <div>
                    {historyLoading ? (
                      <div className="text-center py-12 text-gray-800 font-light">
                        Loading history...
                      </div>
                    ) : history.length === 0 ? (
                      <div className="text-center py-12 text-gray-800 font-light">
                        No scan history yet. Upload your first scan to get started.
                      </div>
                    ) : (
                      <HistoryTable
                        scans={history}
                        onView={(scan) => {
                          console.log('View scan:', scan);
                          // Handle view action
                        }}
                      />
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Safety Disclaimer Footer */}
      <footer className="border-t border-white/20 bg-white/40 backdrop-blur-lg py-8 mt-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="backdrop-blur-xl bg-white/50 rounded-2xl p-6 shadow-xl border border-white/40 max-w-4xl mx-auto">
            <p className="text-xs md:text-sm text-gray-800 text-center leading-relaxed font-light">
              <strong className="font-semibold text-gray-900">Medical Disclaimer:</strong> Curbside is a diagnostic aid tool and does not 
              replace professional medical advice, diagnosis, or treatment. Always seek the advice 
              of your physician or other qualified health provider with any questions you may have 
              regarding a medical condition. Never disregard professional medical advice or delay in 
              seeking it because of something you have read or analyzed using Curbside.
            </p>
          </div>
        </div>
      </footer>

      {/* AI Assistant Popup - Available in all sections */}
      <AIAssistantPopup />
    </div>
  );
}
