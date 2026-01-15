'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePatientStore } from '@/store/patient-store';

export function ClinicalSidebar() {
  const { name, dateOfBirth, gender, updateName, updateDateOfBirth, updateGender } = usePatientStore();

  // Format date for input (YYYY-MM-DD)
  const dateOfBirthString = dateOfBirth 
    ? dateOfBirth.toISOString().split('T')[0]
    : '';

  return (
    <div className="space-y-6">
      <div className="backdrop-blur-xl bg-white/50 rounded-3xl p-8 md:p-10 shadow-2xl border border-white/40 hover:border-white/60 transition-all duration-500">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
            Clinical Context
          </h2>
          <p className="text-base md:text-lg text-gray-800 font-light">
            Provide context to improve analysis accuracy
          </p>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter patient name"
              value={name ?? ''}
              onChange={(e) => {
                const value = e.target.value.trim();
                updateName(value === '' ? undefined : value);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              placeholder="Select date of birth"
              value={dateOfBirthString}
              onChange={(e) => {
                const value = e.target.value;
                if (value) {
                  updateDateOfBirth(new Date(value));
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select value={gender || ''} onValueChange={(value: 'male' | 'female' | 'other') => updateGender(value)}>
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
