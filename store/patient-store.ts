import { create } from 'zustand';
import { PatientInfo } from '@/types';

interface PatientStore extends PatientInfo {
  updateName: (name: string | undefined) => void;
  updateDateOfBirth: (dateOfBirth: Date) => void;
  updateAge: (age: number) => void;
  updateGender: (gender: 'male' | 'female' | 'other') => void;
  updateSkinTone: (skinTone: number) => void;
  reset: () => void;
}

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

export const usePatientStore = create<PatientStore>((set, get) => ({
  name: undefined,
  dateOfBirth: undefined,
  age: undefined,
  gender: undefined,
  skinTone: undefined,
  updateName: (name) => set({ name }),
  updateDateOfBirth: (dateOfBirth) => {
    const age = calculateAge(dateOfBirth);
    set({ dateOfBirth, age });
  },
  updateAge: (age) => set({ age }),
  updateGender: (gender) => set({ gender }),
  updateSkinTone: (skinTone) => set({ skinTone }),
  reset: () => set({ name: undefined, dateOfBirth: undefined, age: undefined, gender: undefined, skinTone: undefined }),
}));
