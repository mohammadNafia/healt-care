'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SkinScan } from '@/types';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';

interface HistoryTableProps {
  scans: SkinScan[];
  onView?: (scan: SkinScan) => void;
}

const conditionLabels: Record<string, string> = {
  MEL: 'Melanoma',
  NV: 'Nevus',
  BCC: 'Basal Cell Carcinoma',
  AK: 'Actinic Keratosis',
  DF: 'Dermatofibroma',
};

const riskLevelVariants: Record<string, 'default' | 'secondary' | 'destructive'> = {
  'Low Risk': 'secondary',
  'Stable': 'default',
  'Action Required': 'destructive',
};

export function HistoryTable({ scans, onView }: HistoryTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl">
      <Table>
        <TableHeader>
          <TableRow className="border-white/20 hover:bg-white/10">
            <TableHead className="text-gray-900 font-semibold">Appointment Date</TableHead>
            <TableHead className="text-gray-900 font-semibold">Patient Name</TableHead>
            <TableHead className="text-gray-900 font-semibold">Date of Birth</TableHead>
            <TableHead className="text-gray-900 font-semibold">Age</TableHead>
            <TableHead className="text-gray-900 font-semibold">AI Assessment</TableHead>
            <TableHead className="text-gray-900 font-semibold">Risk Level</TableHead>
            <TableHead className="text-gray-900 font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scans.map((scan) => {
            // Ensure dateOfBirth is a valid Date object
            const dateOfBirth = scan.dateOfBirth instanceof Date 
              ? scan.dateOfBirth 
              : new Date(scan.dateOfBirth);
            const isValidDateOfBirth = !isNaN(dateOfBirth.getTime());
            
            // Ensure date is a valid Date object
            const appointmentDate = scan.date instanceof Date 
              ? scan.date 
              : new Date(scan.date);
            const isValidAppointmentDate = !isNaN(appointmentDate.getTime());

            return (
              <TableRow key={scan.id} className="border-white/20 hover:bg-white/30 transition-colors">
                <TableCell className="text-gray-800">
                  {isValidAppointmentDate ? format(appointmentDate, 'MMM d, yyyy') : 'N/A'}
                </TableCell>
                <TableCell className="font-semibold text-gray-900">{scan.patientName || 'N/A'}</TableCell>
                <TableCell className="text-gray-800">
                  {isValidDateOfBirth ? format(dateOfBirth, 'MMM d, yyyy') : 'N/A'}
                </TableCell>
                <TableCell className="text-gray-800">{scan.age ? `${scan.age} years` : 'N/A'}</TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-white/40">
                    <AvatarImage src={scan.imageUrl} alt={scan.patientName} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                      {scan.patientName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-gray-800 font-medium">
                    {conditionLabels[scan.assessment.condition] || scan.assessment.condition}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={riskLevelVariants[scan.riskLevel] || 'default'} className="text-sm px-3 py-1">
                  {scan.riskLevel}
                </Badge>
              </TableCell>
              <TableCell>
                <button
                  onClick={() => onView?.(scan)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/60 backdrop-blur-md text-gray-900 font-semibold hover:bg-white/80 transition-all duration-300 border border-white/50 hover:border-white/80 shadow-lg hover:shadow-xl"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
              </TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
