import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AnalysisResult } from '@/types';
import { usePatientStore } from '@/store/patient-store';

interface AnalysisRequest {
  image: File;
  name?: string;
  dateOfBirth?: Date;
  age?: number;
}

interface AnalysisResponse {
  result: AnalysisResult;
  imageUrl: string;
}

async function analyzeImage(request: AnalysisRequest): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append('image', request.image);
  if (request.name) formData.append('name', request.name);
  if (request.dateOfBirth) formData.append('dateOfBirth', request.dateOfBirth.toISOString());
  if (request.age) formData.append('age', request.age.toString());

  // Simulate API call - replace with actual API endpoint
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock response - replace with actual API response
  return {
    result: {
      id: Math.random().toString(36).substring(7),
      condition: 'NV',
      confidence: 0.85,
      clinicalNote: 'Appears to be a benign nevus. Monitor for changes.',
      metadata: {
        skinTone: request.age || 30,
        lightingScore: 0.9,
      },
    },
    imageUrl: URL.createObjectURL(request.image),
  };
}

export function useAnalysis() {
  const { name, dateOfBirth, age } = usePatientStore();
  const [currentImage, setCurrentImage] = useState<File | null>(null);

  const mutation = useMutation({
    mutationFn: analyzeImage,
    onSuccess: () => {
      // Handle success
    },
  });

  const analyze = useCallback(
    (image: File) => {
      setCurrentImage(image);
      mutation.mutate({ image, name, dateOfBirth, age });
    },
    [name, dateOfBirth, age, mutation]
  );

  return {
    analyze,
    isLoading: mutation.isPending,
    error: mutation.error,
    result: mutation.data?.result,
    imageUrl: mutation.data?.imageUrl || (currentImage ? URL.createObjectURL(currentImage) : null),
  };
}
