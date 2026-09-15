import { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';

// Fix for react-pdf worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface DocumentViewerProps {
  url: string;
  type?: 'pdf' | 'image';
}

export function DocumentViewer({ url, type = 'pdf' }: DocumentViewerProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  return (
    <div className="flex flex-col h-full bg-gray-100 rounded-lg overflow-hidden border">
      <div className="flex items-center justify-between p-3 bg-white border-b shadow-sm">
        <h3 className="font-semibold text-sm text-gray-700">Original Document</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><ZoomOut className="w-4 h-4" /></button>
          <span className="text-xs font-medium w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(3, s + 0.25))} className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><ZoomIn className="w-4 h-4" /></button>
          <div className="w-px h-4 bg-gray-300 mx-1" />
          <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><RotateCw className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 flex justify-center items-start">
        {type === 'pdf' ? (
          <Document file={url} loading={<div className="text-sm text-gray-500 mt-10">Loading PDF...</div>}>
            <Page pageNumber={1} scale={scale} rotate={rotation} renderTextLayer={false} renderAnnotationLayer={false} className="shadow-lg border" />
          </Document>
        ) : (
          <div style={{ transform: `scale(${scale}) rotate(${rotation}deg)`, transformOrigin: 'top center', transition: 'transform 0.2s' }}>
            <img src={url} alt="Document" className="max-w-full shadow-lg border bg-white" />
          </div>
        )}
      </div>
    </div>
  );
}
