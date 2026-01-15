export type Condition = 'MEL' | 'NV' | 'BCC' | 'AK' | 'DF';

export interface AnalysisResult {
  id: string;
  condition: Condition;
  confidence: number;
  clinicalNote: string;
  metadata: {
    skinTone: number;
    lightingScore: number;
  };
}

export interface SkinScan {
  id: string;
  date: Date; // Appointment date
  patientName: string;
  dateOfBirth: Date;
  age: number;
  imageUrl: string;
  assessment: AnalysisResult;
  riskLevel: 'Low Risk' | 'Stable' | 'Action Required';
}

export interface PatientInfo {
  name?: string;
  dateOfBirth?: Date;
  age?: number; // Calculated from dateOfBirth or manually entered
  gender?: 'male' | 'female' | 'other';
  skinTone?: number;
}
