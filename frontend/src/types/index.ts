export type Role = 'citizen' | 'revenue_officer' | 'verifier_admin';

export interface User {
  id: string;
  phone?: string;
  email?: string;
  full_name?: string;
  role: Role;
  name?: string;
  avatar?: string;
  picture?: string;
}

export type ValidationStatus = 'pending' | 'needs_review' | 'approved' | 'rejected' | 'validated';

export interface DocumentRecord {
  id: string;
  filename: string;
  uploadDate: string;
  status: ValidationStatus;
  confidence: number;
  extractedFields: Record<string, any>;
  assignedOfficer?: string;
  originalImage?: string;
  missingFields?: string[];
}

export interface ReviewQueueItem extends DocumentRecord {}

export interface PropertyRecord {
  id: string;
  ownerName: string;
  surveyNumber: string;
  khasraNumber: string;
  village: string;
  tehsil: string;
  district: string;
  status: ValidationStatus;
  blockchainLocked: boolean;
  blockchainTxHash?: string;
  landClassification: string;
  area: number; // in hectares
}

export interface FraudFlag {
  id: string;
  recordId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  evidence: string;
  createdAt: string;
  resolved: boolean;
}

export interface OwnershipHistory {
  id: string;
  recordId: string;
  previousOwner: string;
  newOwner: string;
  transferDate: string;
  txHash: string;
}
