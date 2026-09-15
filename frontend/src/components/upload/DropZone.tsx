import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface DropZoneProps {
  onDrop: (files: File[]) => void;
  disabled?: boolean;
}

export function DropZone({ onDrop, disabled }: DropZoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/tiff': ['.tiff', '.tif'],
    },
    maxFiles: 1
  });

  return (
    <div 
      {...getRootProps()} 
      className={cn(
        "relative w-full p-12 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer bg-white group",
        isDragActive ? "border-secondary bg-secondary/5" : "border-gray-300 hover:border-primary/50 hover:bg-gray-50",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none"
      )}
    >
      <input {...getInputProps()} />
      <motion.div 
        animate={isDragActive ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
        className="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors"
      >
        <UploadCloud className="w-8 h-8" />
      </motion.div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {isDragActive ? "Drop document here..." : "Drag & drop land record"}
      </h3>
      <p className="text-sm text-gray-500 mb-4 text-center max-w-sm">
        Supports PDF, JPG, PNG, TIFF. Max file size: 20MB. Ensure the document is well-lit and legible.
      </p>
      <button 
        type="button" 
        className="px-6 py-2 bg-primary text-white font-medium rounded-md hover:bg-primary/90 transition-colors pointer-events-none"
      >
        Browse Files
      </button>
    </div>
  );
}
