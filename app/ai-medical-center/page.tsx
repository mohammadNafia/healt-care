'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, X, Loader2, AlertCircle, CheckCircle2, Stethoscope, Brain, Activity, Scan, Heart } from 'lucide-react';
import Link from 'next/link';
import { AIAssistantPopup } from '@/components/ai-assistant-popup';

// X-ray API result interface
interface XRayAnalysisResult {
  ok: boolean;
  model: string;
  output_text: string;
  runtime: {
    device: string;
    seconds: number;
  };
  disclaimer: string;
}

// Generic analysis result interface
interface AnalysisResult {
  success: boolean;
  model: string;
  result: string | any;
  confidence?: number;
  processingTime?: number;
  error?: string;
  thinking?: string; // For structured thinking from NV-Reason-CXR
  answer?: string; // For structured answer from NV-Reason-CXR
  device?: string; // For X-ray device info
  originalImage?: string; // Base64 or URL for original image
  segmentedImage?: string; // Base64 or URL for segmented image
  hasVisualResult?: boolean; // Whether result includes visual segmentation
  detectedDisease?: string; // For Skin: detected disease name
  diseaseDetails?: string; // For Skin: detailed disease information
}

export default function AIMedicalCenterPage() {
  // Image state
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'skin' | 'brain' | 'xray' | 'breast'>('skin');
  
  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // X-ray specific
  const [prompt, setPrompt] = useState('Analyze this chest X-ray and list findings and devices.');
  const [showThinking, setShowThinking] = useState(false);
  
  // Iframe fallback state for X-ray when backend is not available
  const [showXRayIframe, setShowXRayIframe] = useState(false);
  
  // Predefined prompt suggestions for X-ray
  const xrayPromptSuggestions = [
    'Analyze this chest X-ray and list findings and devices.',
    'Describe all abnormalities visible in this chest X-ray.',
    'Identify any support devices or medical equipment in this image.',
    'Provide a detailed radiology report for this chest X-ray.',
    'What are the key findings and clinical significance?'
  ];
  
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

  // Skin Disease Detection using direct HTTP API (avoiding WebSocket)
  const analyzeSkin = async (imageFile: File) => {
    try {
      // Get original image as base64 for display
      const originalImageBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(imageFile);
      });
      
      try {
        // Convert image to base64 for API
        const imageBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            const base64Data = base64.split(',')[1];
            resolve(base64Data);
          };
          reader.readAsDataURL(imageFile);
        });
        
        // Use direct HTTP API call instead of Gradio client (avoids WebSocket)
        const apiUrl = "https://hassam001-skin-disease-detection.hf.space/api/predict";
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: [`data:image/jpeg;base64,${imageBase64}`],
            fn_index: 0,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        console.log('Skin Gradio result:', result);
        
        // Parse result - Skin API returns text with disease name and details
        const resultData = Array.isArray(result.data) ? result.data : [result.data];
        
        let fullText = '';
        let detectedDisease = '';
        let diseaseDetails = '';
        
        // Extract text from result
        resultData.forEach((item: any) => {
          if (typeof item === 'string' && item.length > 0 && !item.startsWith('<!--') && !item.startsWith('http')) {
            fullText = item;
          }
        });
        
        // Parse the response to extract disease name and details
        if (fullText) {
          // Look for "Detected Disease: [Disease Name]"
          const diseaseMatch = fullText.match(/Detected Disease:\s*([^\n]+)/i) || 
                              fullText.match(/Disease:\s*([^\n]+)/i) ||
                              fullText.match(/🩺\s*([^\n]+)/i);
          
          if (diseaseMatch) {
            detectedDisease = diseaseMatch[1].trim();
          }
          
          // Extract details section
          const detailsMatch = fullText.match(/Details:\s*([\s\S]+?)(?:\n\n|💬|🔍|$)/i) ||
                              fullText.match(/Details:\s*([\s\S]+)/i);
          
          if (detailsMatch) {
            diseaseDetails = detailsMatch[1].trim();
          } else {
            // If no "Details:" section, use everything after disease name
            const afterDisease = fullText.split(/Detected Disease:|Disease:/i)[1];
            if (afterDisease) {
              diseaseDetails = afterDisease.split(/Details:/i)[1] || afterDisease;
              diseaseDetails = diseaseDetails.trim();
            }
          }
          
          // If we couldn't parse, use the full text
          if (!detectedDisease && !diseaseDetails) {
            diseaseDetails = fullText;
          }
        }
        
        return {
          success: true,
          model: "Skin Disease Detection AI",
          result: fullText || 'Analysis completed. Please review the results.',
          detectedDisease: detectedDisease,
          diseaseDetails: diseaseDetails || fullText,
          confidence: undefined,
          originalImage: originalImageBase64,
          segmentedImage: originalImageBase64, // Skin doesn't typically return segmented image
          hasVisualResult: false, // Skin shows text results, not visual segmentation
          processingTime: 0
        };
      } catch (apiError: any) {
        // If API fails with JSON/HTML parsing error, throw to trigger iframe fallback
        const errorMsg = apiError?.message || String(apiError);
        
        if (errorMsg.includes('JSON') || errorMsg.includes('Unexpected token') || errorMsg.includes('<!--') || errorMsg.includes('Copy')) {
          console.warn('Skin API returned HTML instead of JSON, triggering iframe fallback');
          // Throw error to trigger iframe in handleAnalyze
          throw new Error('API_UNAVAILABLE_IFRAME');
        }
        
        throw apiError;
      }
    } catch (err) {
      console.error('Skin analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      // For JSON parsing errors, throw special error to trigger iframe
      if (errorMessage.includes('JSON') || errorMessage.includes('Unexpected token') || errorMessage.includes('<!--') || errorMessage.includes('Copy')) {
        console.log('Triggering iframe fallback due to JSON parsing error');
        throw new Error('API_UNAVAILABLE_IFRAME');
      }
      
      throw new Error(errorMessage);
    }
  };

  // Helper function to convert Gradio file object to base64
  const fetchGradioFile = async (fileData: any): Promise<string | null> => {
    try {
      let imageUrl = null;
      
      // Handle different Gradio file response formats
      if (typeof fileData === 'string') {
        // Direct URL string
        imageUrl = fileData;
      } else if (fileData && typeof fileData === 'object') {
        // File object with url property (Gradio FileData format)
        imageUrl = fileData.url || fileData.path;
      }
      
      if (!imageUrl) {
        console.warn('No URL found in fileData:', fileData);
        return null;
      }
      
      console.log('Processing image URL:', imageUrl);
      
      // If it's already a full HTTP URL, use it directly
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        // URL is complete
      }
      // If it's a Gradio API file path (starts with /tmp/gradio/)
      else if (imageUrl.startsWith('/tmp/gradio/') || imageUrl.includes('/tmp/gradio/')) {
        // Extract the file path
        const filePath = imageUrl.includes('/tmp/gradio/') 
          ? imageUrl.substring(imageUrl.indexOf('/tmp/gradio/'))
          : imageUrl;
        imageUrl = `https://m0hsin123-brain-tumor-detection-and-segmentation.hf.space/file=${filePath}`;
      }
      // If it contains gradio_api/file=, construct full URL
      else if (imageUrl.includes('gradio_api/file=')) {
        if (!imageUrl.startsWith('http')) {
          imageUrl = `https://m0hsin123-brain-tumor-detection-and-segmentation.hf.space${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
        }
      }
      // If it's a relative path
      else if (imageUrl.startsWith('/')) {
        imageUrl = `https://m0hsin123-brain-tumor-detection-and-segmentation.hf.space${imageUrl}`;
      }
      // Otherwise, try to construct URL
      else {
        imageUrl = `https://m0hsin123-brain-tumor-detection-and-segmentation.hf.space/file=${imageUrl}`;
      }
      
      console.log('Final image URL:', imageUrl);
      
      // Fetch and convert to base64
      const response = await fetch(imageUrl, { 
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        console.warn('Failed to fetch image:', response.status, response.statusText);
        return null;
      }
      
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = (e) => {
          console.error('FileReader error:', e);
          reject(e);
        };
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error('Error fetching Gradio file:', e, fileData);
      return null;
    }
  };

  // Breast Cancer Detection using direct HTTP API (avoiding WebSocket)
  const analyzeBreast = async (imageFile: File) => {
    try {
      // Get original image as base64 for display
      const originalImageBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(imageFile);
      });
      
      // Convert image to base64 for API
      const imageBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Remove data:image/...;base64, prefix
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.readAsDataURL(imageFile);
      });
      
      // Use direct HTTP API call instead of Gradio client (avoids WebSocket)
      const apiUrl = "https://mihomes-breastcancer.hf.space/api/predict";
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [`data:image/jpeg;base64,${imageBase64}`],
          fn_index: 0,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Breast API result:', result);
      
      // Parse result - similar to Brain and Skin
      const resultData = Array.isArray(result.data) ? result.data : [result.data];
      
      // Extract images and text results
      let analyzedImageBase64 = null;
      let confidence: number | undefined = undefined;
      let textResult = null;
      const imageResults: string[] = [];
      let diagnosis: string | undefined = undefined;
      let details: string | undefined = undefined;
      
      // Process each element in the result
      for (let i = 0; i < resultData.length; i++) {
        const item = resultData[i];
        
        // Check if it's a file object (Gradio file response)
        if (item && typeof item === 'object') {
          if (item.url || item.path || (item.meta && item.meta._type === 'gradio.FileData')) {
            const fetchedImage = await fetchGradioFile(item);
            if (fetchedImage) {
              imageResults.push(fetchedImage);
            }
          } else if (item.label === "Diagnosis" || item.label === "Detected") {
            diagnosis = item.value || item.text || String(item);
          } else if (item.label === "Details" || item.label === "Information") {
            details = item.value || item.text || String(item);
          } else if (!textResult) {
            textResult = JSON.stringify(item, null, 2);
          }
        }
        // Check if it's a direct URL string
        else if (typeof item === 'string') {
          if (item.startsWith('http') || item.startsWith('data:image')) {
            const fetchedImage = await fetchGradioFile(item);
            if (fetchedImage) {
              imageResults.push(fetchedImage);
            }
          } else if (!textResult && item.length > 0 && !item.startsWith('<!--')) {
            // Check if it looks like a diagnosis or details
            if (item.toLowerCase().includes('diagnosis') || item.toLowerCase().includes('detected')) {
              diagnosis = item;
            } else if (item.length > 50) {
              details = item;
            } else {
              textResult = item;
            }
          }
        }
        // Check if it's a number (confidence score)
        else if (typeof item === 'number') {
          confidence = item;
        }
      }
      
      // Use the last image as analyzed result
      if (imageResults.length > 0) {
        analyzedImageBase64 = imageResults[imageResults.length - 1];
      }
      
      // If no analyzed image found, use original
      if (!analyzedImageBase64) {
        analyzedImageBase64 = originalImageBase64;
      }
      
      return {
        success: true,
        model: "Breast Cancer Detection AI",
        result: details || textResult || diagnosis || 'Analysis completed. Please review the results.',
        confidence: confidence,
        originalImage: originalImageBase64,
        segmentedImage: analyzedImageBase64,
        hasVisualResult: true,
        detectedDisease: diagnosis, // For breast: diagnosis/result
        diseaseDetails: details, // For breast: detailed information
        processingTime: 0
      };
    } catch (err) {
      console.error('Breast analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      // For JSON parsing errors, throw special error to trigger iframe
      if (errorMessage.includes('JSON') || errorMessage.includes('Unexpected token') || errorMessage.includes('<!--') || errorMessage.includes('Copy')) {
        console.log('Triggering iframe fallback due to JSON parsing error');
        throw new Error('API_UNAVAILABLE_IFRAME');
      }
      
      throw new Error(errorMessage);
    }
  };

  // Brain Tumor Detection using direct HTTP API (avoiding WebSocket)
  const analyzeBrain = async (imageFile: File) => {
    try {
      // Get original image as base64 for display
      const originalImageBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(imageFile);
      });
      
      // Convert image to base64 for API
      const imageBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.readAsDataURL(imageFile);
      });
      
      // Use direct HTTP API call instead of Gradio client (avoids WebSocket)
      const apiUrl = "https://m0hsin123-brain-tumor-detection-and-segmentation.hf.space/api/predict";
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [`data:image/jpeg;base64,${imageBase64}`],
          fn_index: 0,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Brain API result:', result);
      
      // Parse result - Gradio API returns { data: [...] }
      const resultData = result.data ? (Array.isArray(result.data) ? result.data : [result.data]) : [result];
      
      // Extract segmented image (usually second element) and confidence
      let segmentedImageBase64 = null;
      let confidence: number | undefined = undefined;
      let textResult = null;
      
      // Process each element in the result
      for (let i = 0; i < resultData.length; i++) {
        const item = resultData[i];
        
        // Check if it's a file object (Gradio file response)
        if (item && typeof item === 'object') {
          // Check for Gradio FileData format
          if (item.url || item.path || (item.meta && item.meta._type === 'gradio.FileData')) {
            const fetchedImage = await fetchGradioFile(item);
            if (fetchedImage) {
              // First image is usually original, second is segmented
              if (!segmentedImageBase64) {
                segmentedImageBase64 = fetchedImage;
              }
            }
          }
          // If it's a plain object, stringify it for text display
          else if (!textResult) {
            textResult = JSON.stringify(item, null, 2);
          }
        }
        // Check if it's a direct URL string
        else if (typeof item === 'string') {
          if (item.startsWith('http') || item.startsWith('data:image')) {
            if (!segmentedImageBase64) {
              const fetchedImage = await fetchGradioFile(item);
              if (fetchedImage) {
                segmentedImageBase64 = fetchedImage;
              }
            }
          } else if (!textResult && item.length > 0) {
            textResult = item;
          }
        }
        // Check if it's a number (confidence score)
        else if (typeof item === 'number') {
          confidence = item;
        }
      }
      
      // If we got multiple images, the second one is usually the segmented one
      // Let's try to get both if available
      const imageResults: string[] = [];
      for (let i = 0; i < resultData.length; i++) {
        const item = resultData[i];
        if (item && typeof item === 'object' && (item.url || item.path)) {
          const fetchedImage = await fetchGradioFile(item);
          if (fetchedImage) {
            imageResults.push(fetchedImage);
          }
        }
      }
      
      // Use the last image as segmented (usually the output)
      if (imageResults.length > 0) {
        segmentedImageBase64 = imageResults[imageResults.length - 1];
      }
      
      // If no segmented image found, use original
      if (!segmentedImageBase64) {
        segmentedImageBase64 = originalImageBase64;
      }
      
      return {
        success: true,
        model: "Brain Tumor Detection AI",
        result: textResult || JSON.stringify(resultData, null, 2),
        confidence: confidence,
        originalImage: originalImageBase64,
        segmentedImage: segmentedImageBase64,
        hasVisualResult: true,
        processingTime: 0
      };
    } catch (err) {
      console.error('Brain analysis error:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to analyze brain image');
    }
  };

  // Parse structured output from NV-Reason-CXR (thinking + answer format)
  const parseStructuredOutput = (text: string) => {
    const thinkingMatch = text.match(/<thinking>([\s\S]*?)<\/thinking>/);
    const answerMatch = text.match(/<answer>([\s\S]*?)<\/answer>/);
    
    return {
      thinking: thinkingMatch ? thinkingMatch[1].trim() : undefined,
      answer: answerMatch ? answerMatch[1].trim() : text,
      raw: text
    };
  };

  // X-ray Analysis using backend API (NV-Reason-CXR-3B)
  const analyzeXRay = async (imageFile: File, promptText: string) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('prompt', promptText);

      // Ensure API_BASE_URL doesn't have trailing slash
      const apiUrl = `${API_BASE_URL.replace(/\/$/, '')}/api/cxr/analyze`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - browser will set it automatically with boundary for FormData
      });

      if (!response.ok) {
        // Check if it's a network error (backend not running)
        if (response.status === 0 || !response.status) {
          throw new Error('BACKEND_NOT_RUNNING');
        }
        
        // Handle 405 Method Not Allowed specifically
        if (response.status === 405) {
          console.error('405 Error - Endpoint:', apiUrl);
          console.error('Response headers:', Object.fromEntries(response.headers.entries()));
          throw new Error(`Method not allowed. Please verify the endpoint ${apiUrl} accepts POST requests.`);
        }
        
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data: XRayAnalysisResult = await response.json();
      const parsed = parseStructuredOutput(data.output_text);
      
      return {
        success: true,
        model: data.model,
        result: parsed.answer,
        thinking: parsed.thinking,
        processingTime: data.runtime.seconds,
        device: data.runtime.device
      };
    } catch (err) {
      // Check for network/fetch errors (backend not running, CORS, etc.)
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      if (errorMessage.includes('Failed to fetch') || 
          errorMessage.includes('NetworkError') || 
          errorMessage.includes('fetch') ||
          errorMessage === 'BACKEND_NOT_RUNNING') {
        // Trigger iframe fallback
        throw new Error('BACKEND_NOT_RUNNING');
      }
      
      throw err;
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
      let analysisResult: AnalysisResult;

      if (activeTab === 'skin') {
        analysisResult = await analyzeSkin(image);
      } else if (activeTab === 'brain') {
        analysisResult = await analyzeBrain(image);
      } else if (activeTab === 'xray') {
        analysisResult = await analyzeXRay(image, prompt);
      } else if (activeTab === 'breast') {
        analysisResult = await analyzeBreast(image);
      } else {
        throw new Error('Invalid tab selected');
      }

      setResult(analysisResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      // For X-ray: If backend is not available, show iframe fallback
      if (activeTab === 'xray' && (
        errorMessage === 'BACKEND_NOT_RUNNING' || 
        errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('405') ||
        errorMessage.includes('Method not allowed')
      )) {
        setShowXRayIframe(true);
        setError(null); // Clear error so iframe can display
        setResult(null); // Clear any partial results
        setIsAnalyzing(false);
        return; // Don't show error, just show iframe
      }
      
      // For other errors, show error message
      if (errorMessage.includes('JSON') || errorMessage.includes('Unexpected token') || errorMessage.includes('<!--')) {
        setError('API service is temporarily unavailable. Please try again later.');
      } else {
        setError(errorMessage);
      }
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'skin':
        return 'Skin Disease Detection';
      case 'brain':
        return 'Brain Tumor Detection';
      case 'xray':
        return 'Chest X-Ray Analysis';
      case 'breast':
        return 'Breast Cancer Detection';
      default:
        return 'AI Medical Center';
    }
  };

  const getTabDescription = () => {
    switch (activeTab) {
      case 'skin':
        return 'Upload a skin image for AI-powered disease detection and analysis';
      case 'brain':
        return 'Upload a brain scan image for tumor detection and segmentation';
      case 'xray':
        return 'Upload a chest X-ray image for AI-powered radiology analysis';
      case 'breast':
        return 'AI-powered breast cancer analysis tool';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              AI Medical Center
            </div>
            <div className="flex items-center gap-4">
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 max-w-7xl">
        {/* Header */}
            <div className="mb-8">
          <div className="backdrop-blur-xl bg-white/50 rounded-3xl p-8 md:p-10 shadow-2xl border border-white/40 hover:border-white/60 transition-all duration-500 inline-block">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-3 tracking-tight flex items-center gap-3">
              <Stethoscope className="w-10 h-10 md:w-12 md:h-12 text-blue-600" />
              AI Medical Center
              <span className="text-blue-600 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500"> Hub</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-800 font-light">
              Advanced AI-powered medical analysis tools powered by NVIDIA NV-Reason-CXR-3B and specialized models
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
                NVIDIA NV-Reason-CXR-3B
              </span>
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                Research & Education
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v as 'skin' | 'brain' | 'xray' | 'breast');
          setResult(null);
          setError(null);
        }} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/60 backdrop-blur-md border border-white/60 rounded-2xl p-2 mb-6">
            <TabsTrigger 
              value="skin" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold rounded-xl transition-all flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Skin Disease AI
            </TabsTrigger>
            <TabsTrigger 
              value="brain" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold rounded-xl transition-all flex items-center gap-2"
            >
              <Brain className="w-4 h-4" />
              Brain Tumor AI
            </TabsTrigger>
            <TabsTrigger 
              value="xray" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold rounded-xl transition-all flex items-center gap-2"
              onClick={() => {
                // Reset iframe state when switching tabs
                setShowXRayIframe(false);
              }}
            >
              <Scan className="w-4 h-4" />
              X-ray AI (NV-Reason-CXR-3B)
            </TabsTrigger>
            <TabsTrigger 
              value="breast" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold rounded-xl transition-all flex items-center gap-2"
            >
              <Heart className="w-4 h-4" />
              Breast Cancer AI
            </TabsTrigger>
          </TabsList>

          {/* Unified Content for All Tabs - Custom UI Only */}
          <TabsContent value={activeTab} className="mt-6">
            {/* All tabs use custom UI with API integration */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Upload Section */}
              <Card className="backdrop-blur-xl bg-white/50 rounded-3xl shadow-2xl border border-white/40">
                <CardHeader>
                  <CardTitle className="text-2xl md:text-3xl font-extrabold text-gray-900">
                    {getTabTitle()}
                  </CardTitle>
                  <CardDescription className="text-base md:text-lg text-gray-800 font-light">
                    {getTabDescription()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* X-ray Prompt Input (only for X-ray tab) */}
                  {activeTab === 'xray' && (
                    <div className="space-y-3">
                      <Label htmlFor="prompt" className="text-gray-900 font-semibold">
                        Analysis Prompt
                      </Label>
                      <Input
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Analyze this chest X-ray and list findings and devices."
                        className="bg-white/80 border-white/60"
                      />
                      <div className="text-xs text-gray-600 space-y-1">
                        <p className="font-semibold mb-1">Quick prompts:</p>
                        <div className="flex flex-wrap gap-2">
                          {xrayPromptSuggestions.slice(0, 3).map((suggestion, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setPrompt(suggestion)}
                              className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs transition-colors border border-blue-200"
                            >
                              {suggestion.length > 40 ? suggestion.substring(0, 40) + '...' : suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

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
                          alt="Preview"
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
                      `Analyze ${getTabTitle()}`
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
                    AI-powered medical analysis results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* X-ray Iframe Fallback */}
                  {activeTab === 'xray' && showXRayIframe ? (
                    <div className="space-y-4">
                      <div className="bg-blue-50/80 backdrop-blur-md rounded-xl p-4 border-2 border-blue-200/60">
                        <p className="text-sm text-gray-800 mb-2">
                          <strong className="font-semibold text-blue-900">Backend API unavailable.</strong> Using Hugging Face Space as fallback:
                        </p>
                      </div>
                      <div className="relative rounded-xl overflow-hidden border-2 border-white/60 bg-white/30 backdrop-blur-md" style={{ minHeight: '600px' }}>
                        <iframe
                          src="https://nvidia-nv-reason-cxr.hf.space"
                          className="w-full h-full border-0"
                          style={{ minHeight: '600px' }}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          title="NV-Reason-CXR X-ray Analysis"
                          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
                        />
                      </div>
                      <div className="bg-amber-50/80 backdrop-blur-md rounded-xl p-4 border-2 border-amber-200/60">
                        <p className="text-xs text-gray-800 leading-relaxed">
                          <strong className="font-semibold text-gray-900">Medical Disclaimer:</strong> This tool is for research and educational purposes only. 
                          It does not replace professional medical advice, diagnosis, or treatment. 
                          Always consult qualified healthcare professionals for medical decisions.
                        </p>
                      </div>
                    </div>
                  ) : isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                      <p className="text-gray-800 font-light text-lg">
                        Analyzing image...
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
                        {result.device && (
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-gray-700">Device:</span>
                            <span className="text-sm text-gray-900">{result.device.toUpperCase()}</span>
                          </div>
                        )}
                        {result.processingTime !== undefined && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">Processing Time:</span>
                            <span className="text-sm text-gray-900">{result.processingTime.toFixed(2)}s</span>
                          </div>
                        )}
                      </div>

                      {/* Thinking Process (for X-ray with NV-Reason-CXR) */}
                      {result.thinking && (
                        <div className="bg-blue-50/80 backdrop-blur-md rounded-xl p-4 border-2 border-blue-200/60">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-blue-900">AI Reasoning Process</h4>
                            <button
                              onClick={() => setShowThinking(!showThinking)}
                              className="text-xs text-blue-700 hover:text-blue-900 underline"
                            >
                              {showThinking ? 'Hide' : 'Show'} thinking
                            </button>
                          </div>
                          {showThinking && (
                            <div className="mt-2 text-xs text-gray-700 font-light leading-relaxed whitespace-pre-wrap bg-white/60 p-3 rounded-lg border border-blue-100">
                              {result.thinking}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Visual Segmentation Results (Brain Tab) */}
                      {activeTab === 'brain' && result.hasVisualResult && (
                        <div className="bg-white/60 backdrop-blur-md rounded-xl p-6 border border-white/60">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Tumor Segmentation Visualization
                          </h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            {/* Original Image */}
                            <div className="space-y-2">
                              <p className="text-sm font-semibold text-gray-700">Original MRI Scan</p>
                              <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                                <img
                                  src={result.originalImage}
                                  alt="Original brain scan"
                                  className="w-full h-auto object-contain"
                                />
                              </div>
                            </div>
                            {/* Segmented Image */}
                            <div className="space-y-2">
                              <p className="text-sm font-semibold text-gray-700">Tumor Location (Segmented)</p>
                              <div className="relative rounded-lg overflow-hidden border-2 border-red-300 bg-gray-50">
                                <img
                                  src={result.segmentedImage}
                                  alt="Segmented brain scan with tumor"
                                  className="w-full h-auto object-contain"
                                />
                                <div className="absolute top-2 right-2 bg-red-500/90 text-white px-2 py-1 rounded text-xs font-semibold">
                                  Tumor Highlighted
                                </div>
                              </div>
                            </div>
                          </div>
                          {result.confidence !== undefined && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm text-gray-700">
                                <span className="font-semibold">Diagnostic Confidence:</span>{' '}
                                <span className="text-blue-700 font-bold">
                                  {typeof result.confidence === 'number' 
                                    ? `${(result.confidence * 100).toFixed(1)}%`
                                    : result.confidence}
                                </span>
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Breast Cancer Detection Results */}
                      {activeTab === 'breast' && result.hasVisualResult && (
                        <div className="bg-white/60 backdrop-blur-md rounded-xl p-6 border border-white/60">
                          <div className="mb-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                                <Heart className="w-6 h-6 text-pink-600" />
                              </div>
                              <div>
                                <h3 className="text-sm font-semibold text-gray-700">Analysis Result</h3>
                                {result.detectedDisease && (
                                  <p className="text-2xl md:text-3xl font-bold text-pink-600 mt-1">{result.detectedDisease}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            {/* Original Image */}
                            <div className="space-y-2">
                              <p className="text-sm font-semibold text-gray-700">Original Image</p>
                              <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                                <img
                                  src={result.originalImage}
                                  alt="Original breast image"
                                  className="w-full h-auto object-contain"
                                />
                              </div>
                            </div>
                            {/* Analyzed Image */}
                            <div className="space-y-2">
                              <p className="text-sm font-semibold text-gray-700">Analyzed Image</p>
                              <div className="relative rounded-lg overflow-hidden border-2 border-pink-300 bg-gray-50">
                                <img
                                  src={result.segmentedImage}
                                  alt="Analyzed breast image"
                                  className="w-full h-auto object-contain"
                                />
                                <div className="absolute top-2 right-2 bg-pink-500/90 text-white px-2 py-1 rounded text-xs font-semibold">
                                  Analyzed
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {result.confidence !== undefined && (
                            <div className="mt-4 p-3 bg-pink-50 rounded-lg border border-pink-200">
                              <p className="text-sm text-gray-700">
                                <span className="font-semibold">Analysis Confidence:</span>{' '}
                                <span className="text-pink-700 font-bold">
                                  {typeof result.confidence === 'number' 
                                    ? `${(result.confidence * 100).toFixed(1)}%`
                                    : result.confidence}
                                </span>
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Skin Disease Detection Results */}
                      {activeTab === 'skin' && result.detectedDisease && (
                        <div className="bg-white/60 backdrop-blur-md rounded-xl p-6 border border-white/60">
                          <div className="mb-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl">🩺</span>
                              </div>
                              <div>
                                <h3 className="text-sm font-semibold text-gray-700">Detected Disease</h3>
                                <p className="text-2xl md:text-3xl font-bold text-blue-600 mt-1">{result.detectedDisease}</p>
                              </div>
                            </div>
                          </div>
                          
                          {result.originalImage && (
                            <div className="mb-6">
                              <p className="text-sm font-semibold text-gray-700 mb-2">Uploaded Image</p>
                              <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                                <img
                                  src={result.originalImage}
                                  alt="Uploaded skin image"
                                  className="w-full h-auto max-h-64 object-contain mx-auto"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Text Analysis Output */}
                      <div className="bg-white/60 backdrop-blur-md rounded-xl p-6 border border-white/60">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {activeTab === 'xray' ? 'Radiology Report' : activeTab === 'skin' || activeTab === 'breast' ? 'Details' : 'Analysis Details'}
                          </h3>
                          {activeTab === 'xray' && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                              NV-Reason-CXR-3B
                            </span>
                          )}
                        </div>
                        <div className="prose prose-sm max-w-none">
                          <div className="text-gray-800 font-light leading-relaxed whitespace-pre-wrap">
                            {(activeTab === 'skin' && result.diseaseDetails) 
                              ? result.diseaseDetails 
                              : (activeTab === 'breast' && result.diseaseDetails)
                                ? result.diseaseDetails
                                : typeof result.result === 'string' 
                                  ? result.result 
                                  : JSON.stringify(result.result, null, 2)}
                          </div>
                        </div>
                      </div>

                      {/* Disclaimer */}
                      <div className="bg-amber-50/80 backdrop-blur-md rounded-xl p-4 border-2 border-amber-200/60">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-gray-800 leading-relaxed">
                            <strong className="font-semibold text-gray-900">Medical Disclaimer:</strong> This tool is for research and educational purposes only. 
                            It does not replace professional medical advice, diagnosis, or treatment. 
                            Always consult qualified healthcare professionals for medical decisions.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-600 font-light">
                      <p className="text-lg mb-2">No analysis yet</p>
                      <p className="text-sm">Upload an image and click "Analyze" to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Safety Disclaimer Footer */}
        <footer className="border-t border-white/20 bg-white/40 backdrop-blur-lg py-8 mt-12 rounded-3xl">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="backdrop-blur-xl bg-white/50 rounded-2xl p-6 shadow-xl border border-white/40">
              <p className="text-xs md:text-sm text-gray-800 text-center leading-relaxed font-light">
                <strong className="font-semibold text-gray-900">Medical Disclaimer:</strong> All AI tools in this Medical Center are for research and educational purposes only and do not 
                replace professional medical advice, diagnosis, or treatment. Always seek the advice 
                of your physician or other qualified health provider with any questions you may have 
                regarding a medical condition. Never disregard professional medical advice or delay in 
                seeking it because of something you have read or analyzed using these AI tools.
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
