import { create } from 'zustand';

export type PipelineStep = 'uploading' | 'gate' | 'ocr' | 'extraction' | 'triage' | 'complete';
export type TriageOutcome = 'auto_accepted' | 'needs_review' | 'rejected' | null;

interface UploadState {
  isUploading: boolean;
  progress: number;
  currentStep: PipelineStep;
  documentId: string | null;
  triageOutcome: TriageOutcome;
  extractedData: any | null;
  confidence: number;
  setUploading: (val: boolean) => void;
  setProgress: (val: number) => void;
  setStep: (step: PipelineStep) => void;
  setResult: (id: string, outcome: TriageOutcome, data: any, conf: number) => void;
  reset: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  isUploading: false,
  progress: 0,
  currentStep: 'uploading',
  documentId: null,
  triageOutcome: null,
  extractedData: null,
  confidence: 0,
  setUploading: (val) => set({ isUploading: val }),
  setProgress: (val) => set({ progress: val }),
  setStep: (step) => set({ currentStep: step }),
  setResult: (documentId, triageOutcome, extractedData, confidence) => 
    set({ documentId, triageOutcome, extractedData, confidence, currentStep: 'complete' }),
  reset: () => set({
    isUploading: false,
    progress: 0,
    currentStep: 'uploading',
    documentId: null,
    triageOutcome: null,
    extractedData: null,
    confidence: 0
  })
}));
