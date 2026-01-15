import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SkinScan } from '@/types';

// Mock data - replace with actual API calls
const mockHistory: SkinScan[] = [
  {
    id: '1',
    date: new Date('2026-01-14'),
    patientName: 'John Doe',
    dateOfBirth: new Date('1985-05-15'),
    age: 40,
    imageUrl: '/placeholder-scan.jpg',
    assessment: {
      id: '1',
      condition: 'DF',
      confidence: 0.78,
      clinicalNote: 'Dermatofibroma detected. Low risk.',
      metadata: {
        skinTone: 3,
        lightingScore: 0.88,
      },
    },
    riskLevel: 'Low Risk',
  },
  {
    id: '2',
    date: new Date('2025-11-12'),
    patientName: 'Jane Smith',
    dateOfBirth: new Date('1990-08-22'),
    age: 35,
    imageUrl: '/placeholder-scan.jpg',
    assessment: {
      id: '2',
      condition: 'NV',
      confidence: 0.92,
      clinicalNote: 'Benign nevus. Stable.',
      metadata: {
        skinTone: 3,
        lightingScore: 0.85,
      },
    },
    riskLevel: 'Stable',
  },
];

async function fetchHistory(): Promise<SkinScan[]> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockHistory;
}

async function saveScan(scan: Omit<SkinScan, 'id'>): Promise<SkinScan> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    ...scan,
    id: Math.random().toString(36).substring(7),
  };
}

export function useSkinHistory() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['skinHistory'],
    queryFn: fetchHistory,
  });

  const saveMutation = useMutation({
    mutationFn: saveScan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skinHistory'] });
    },
  });

  return {
    history: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    saveScan: saveMutation.mutate,
    isSaving: saveMutation.isPending,
  };
}
