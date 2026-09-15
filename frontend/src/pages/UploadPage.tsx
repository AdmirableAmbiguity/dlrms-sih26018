import { useEffect } from 'react';
import { PageTransition } from '../components/ui/PageTransition';
import { DropZone } from '../components/upload/DropZone';
import { PipelineStatus } from '../components/upload/PipelineStatus';
import { TriageResult } from '../components/upload/TriageResult';
import { useUploadStore } from '../store/uploadStore';
import { SimulatedBadge } from '../components/ui/SimulatedBadge';

export default function UploadPage() {
  const { currentStep, isUploading, progress, triageOutcome, confidence, documentId, setUploading, setProgress, setStep, setResult, reset } = useUploadStore();

  useEffect(() => {
    return () => reset();
  }, [reset]);

  const handleDrop = (files: File[]) => {
    if (files.length === 0) return;
    
    // Simulate upload and pipeline
    reset();
    setUploading(true);
    
    // 1. Uploading
    let p = 0;
    const interval = setInterval(() => {
      p += 10;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setUploading(false);
        runPipeline();
      }
    }, 100);
  };

  const runPipeline = () => {
    setStep('gate');
    
    setTimeout(() => {
      setStep('ocr');
      
      setTimeout(() => {
        setStep('extraction');
        
        setTimeout(() => {
          setStep('triage');
          
          setTimeout(() => {
            // Mock result
            const rand = Math.random();
            if (rand > 0.6) {
              setResult('doc_123', 'auto_accepted', { owner: 'Ramesh' }, 92.5);
            } else if (rand > 0.2) {
              setResult('doc_123', 'needs_review', { owner: 'Ramesh' }, 74.2);
            } else {
              setResult('doc_123', 'rejected', {}, 21.0);
            }
          }, 1500);
        }, 1500);
      }, 1500);
    }, 1000);
  };

  return (
    <PageTransition className="max-w-4xl mx-auto space-y-8 py-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Land Record</h1>
          <p className="text-gray-500">Digitize legacy physical records through our AI pipeline.</p>
        </div>
        <SimulatedBadge label="Sarvam AI Vision" />
      </div>

      <div className="bg-white p-8 rounded-xl border shadow-sm">
        {currentStep === 'uploading' && !isUploading ? (
          <DropZone onDrop={handleDrop} />
        ) : (
          <div className="space-y-10">
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Uploading Document...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
            
            {!isUploading && (
              <>
                <PipelineStatus currentStep={currentStep} />
                {currentStep === 'complete' && (
                  <TriageResult outcome={triageOutcome} confidence={confidence} documentId={documentId} />
                )}
                
                {currentStep === 'complete' && (
                  <div className="mt-6 flex justify-center">
                    <button onClick={reset} className="text-sm font-medium text-primary hover:underline">
                      Upload another document
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
