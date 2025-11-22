import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'university' | 'student';
  };
}

export interface SignupUniversityDTO {
  name: string;
  email: string;
  password: string;
  walletAddress?: string;
}

export interface SignupStudentDTO {
  name: string;
  regNo: string;
  email: string;
  password: string;
  universityId: string;
  walletAddress?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
  role: 'university' | 'student';
}

export interface IssueCertificateDTO {
  credentialNo: string;
  studentId: string;
  degreeName: string;
  graduationYear: number;
  encryptedFile: string; // base64
  fileHash: string;
  jsonHash: string;
  iv: string;
  authTag: string;
  encryptedShares: Array<{
    custodianId: string;
    encryptedShare: string;
  }>;
}

export interface VerifyCertificateDTO {
  fileHash?: string;
  jsonHash?: string;
}
