import { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle, AlertCircle, Sparkles, X, Image as ImageIcon, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

interface LiveCameraCaptureProps {
  onCapture: (imageBlob: Blob, dataUrl: string) => void;
  onCancel?: () => void;
}

export function LiveCameraCapture({ onCapture, onCancel }: LiveCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  // Start video stream
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.warn('Video play error:', e));
        };
      }

      setHasPermission(true);
    } catch (err) {
      console.warn('Camera access unavailable:', err);
      setHasPermission(false);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  // Capture current frame from webcam
  const takeSnapshot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      toast.error('Camera stream not ready. Please try using file selection.');
      return;
    }

    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedDataUrl(dataUrl);
    setIsScanning(false);
    toast.success('Document captured successfully!');
  };

  // Direct device camera input fallback
  const handleDeviceFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      setCapturedDataUrl(dataUrl);
      setIsScanning(false);
      toast.success('Photo loaded from camera!');
    };
    reader.readAsDataURL(file);
  };

  // Confirm and send image
  const confirmCapture = () => {
    if (!capturedDataUrl) return;

    // Convert dataUrl to blob
    fetch(capturedDataUrl)
      .then(res => res.blob())
      .then(blob => {
        onCapture(blob, capturedDataUrl);
      })
      .catch(() => {
        // Fallback canvas to blob
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.toBlob(blob => {
            if (blob) onCapture(blob, capturedDataUrl);
          }, 'image/jpeg', 0.95);
        }
      });
  };

  const retake = () => {
    setCapturedDataUrl(null);
    setIsScanning(true);
    if (videoRef.current && streamRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl relative text-white">
      {/* Top Bar */}
      <div className="p-4 bg-slate-800/80 backdrop-blur-md border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
              Live Document Camera Scanner
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                A4 Reticle
              </span>
            </h3>
            <p className="text-xs text-slate-400">Position Khatauni / Khasra document inside the box</p>
          </div>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Viewfinder Frame */}
      <div className="relative aspect-[4/3] md:aspect-[16/9] bg-black overflow-hidden flex items-center justify-center">
        {capturedDataUrl ? (
          /* Snapshot Preview */
          <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
            <img
              src={capturedDataUrl}
              alt="Captured Land Record"
              className="max-w-full max-h-full object-contain"
            />
            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-emerald-500/40 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Snapshot Ready for Multilingual OCR
            </div>
          </div>
        ) : hasPermission === false ? (
          /* Permission fallback */
          <div className="p-8 text-center max-w-md space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h4 className="font-semibold text-slate-200">Camera Access Direct Mode</h4>
            <p className="text-xs text-slate-400">
              Click below to snap directly using your device's native camera or upload a saved photo.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 mx-auto transition-colors shadow-lg shadow-emerald-600/30"
            >
              <Camera className="w-4 h-4" /> Open Device Camera
            </button>
          </div>
        ) : (
          /* Active Live Stream */
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Document Reticle */}
            <div className="absolute inset-8 md:inset-12 border-2 border-emerald-400/60 rounded-xl pointer-events-none flex flex-col justify-between p-4">
              <div className="flex justify-between">
                <div className="w-6 h-6 border-t-4 border-l-4 border-emerald-400" />
                <div className="w-6 h-6 border-t-4 border-r-4 border-emerald-400" />
              </div>

              {isScanning && (
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-bounce duration-1000" />
              )}

              <div className="flex justify-between">
                <div className="w-6 h-6 border-b-4 border-l-4 border-emerald-400" />
                <div className="w-6 h-6 border-b-4 border-r-4 border-emerald-400" />
              </div>
            </div>

            <div className="absolute bottom-4 bg-slate-900/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-700 text-xs text-slate-300 pointer-events-none flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Auto-Deconvolution &amp; Binarization Active
            </div>
          </>
        )}

        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleDeviceFileInput}
          className="hidden"
        />
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-slate-800/90 border-t border-slate-700 flex items-center justify-between">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors"
        >
          <ImageIcon className="w-3.5 h-3.5" /> Direct Camera / Gallery
        </button>

        <div className="flex items-center gap-3">
          {capturedDataUrl ? (
            <>
              <button
                type="button"
                onClick={retake}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retake Photo
              </button>
              <button
                type="button"
                onClick={confirmCapture}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/30 active:scale-95"
              >
                <CheckCircle className="w-4 h-4" /> Run Multilingual OCR →
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={takeSnapshot}
              className="px-7 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/30 active:scale-95"
            >
              <Camera className="w-4 h-4" /> Snap Photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
