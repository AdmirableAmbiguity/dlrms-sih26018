import { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle, AlertCircle, Scan, Maximize2, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface LiveCameraCaptureProps {
  onCapture: (imageBlob: Blob, dataUrl: string) => void;
  onCancel?: () => void;
}

export function LiveCameraCapture({ onCapture, onCancel }: LiveCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [deviceList, setDeviceList] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Start webcam video stream
  const startCamera = useCallback(async (deviceId?: string) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          facingMode: deviceId ? undefined : { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setHasPermission(true);

      // Enumerate available video input devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      setDeviceList(videoInputs);
      if (!selectedDeviceId && videoInputs.length > 0) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setHasPermission(false);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  // Take high-resolution snapshot from video stream
  const takeSnapshot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedDataUrl(dataUrl);
    setIsScanning(false);
    toast.success('Document photo captured!');
  };

  // Confirm and send captured image to OCR pipeline
  const confirmCapture = () => {
    const canvas = canvasRef.current;
    if (!canvas || !capturedDataUrl) return;

    canvas.toBlob(blob => {
      if (blob) {
        onCapture(blob, capturedDataUrl);
      }
    }, 'image/jpeg', 0.95);
  };

  // Retake photo
  const retake = () => {
    setCapturedDataUrl(null);
    setIsScanning(true);
    if (videoRef.current && streamRef.current) {
      videoRef.current.play();
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl relative text-white">
      {/* Top Header */}
      <div className="p-4 bg-slate-800/80 backdrop-blur-md border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
              Live Document Scanner
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                A4 Document Guide
              </span>
            </h3>
            <p className="text-xs text-slate-400">Position Khatauni or Khasra paper inside the reticle</p>
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

      {/* Camera Viewfinder / Preview Area */}
      <div className="relative aspect-[4/3] md:aspect-[16/9] bg-black overflow-hidden flex items-center justify-center">
        {hasPermission === false ? (
          <div className="p-8 text-center max-w-md space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h4 className="font-semibold text-slate-200">Camera Permission Required</h4>
            <p className="text-xs text-slate-400">
              Please grant webcam permission in your browser or use the file upload option to digitize land records.
            </p>
            <button
              onClick={() => startCamera()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Retry Camera Connection
            </button>
          </div>
        ) : capturedDataUrl ? (
          /* Snapshot Preview */
          <div className="relative w-full h-full">
            <img
              src={capturedDataUrl}
              alt="Captured Land Record"
              className="w-full h-full object-contain bg-black"
            />
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-emerald-500/40 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Snapshot Ready for Multilingual OCR
            </div>
          </div>
        ) : (
          /* Live Stream */
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Document Alignment Reticle (A4 Aspect Ratio Guide) */}
            <div className="absolute inset-8 md:inset-12 border-2 border-emerald-400/50 rounded-xl pointer-events-none flex flex-col justify-between p-4">
              <div className="flex justify-between">
                <div className="w-6 h-6 border-t-4 border-l-4 border-emerald-400" />
                <div className="w-6 h-6 border-t-4 border-r-4 border-emerald-400" />
              </div>

              {/* Animated Laser Scanning Beam */}
              {isScanning && (
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-bounce duration-1000" />
              )}

              <div className="flex justify-between">
                <div className="w-6 h-6 border-b-4 border-l-4 border-emerald-400" />
                <div className="w-6 h-6 border-b-4 border-r-4 border-emerald-400" />
              </div>
            </div>

            {/* Guide Badge */}
            <div className="absolute bottom-4 bg-slate-900/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-700 text-xs text-slate-300 pointer-events-none flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Auto-Deconvolution &amp; Binarization Active
            </div>
          </>
        )}

        {/* Hidden Canvas for Frame Capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Bottom Action Controls */}
      <div className="p-4 bg-slate-800/90 border-t border-slate-700 flex items-center justify-between">
        <div className="text-xs text-slate-400 hidden sm:block">
          {deviceList.length > 1 ? (
            <select
              value={selectedDeviceId}
              onChange={e => {
                setSelectedDeviceId(e.target.value);
                startCamera(e.target.value);
              }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 text-xs"
            >
              {deviceList.map(dev => (
                <option key={dev.deviceId} value={dev.deviceId}>
                  {dev.label || `Camera ${dev.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
          ) : (
            'High-Resolution Sensor'
          )}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {capturedDataUrl ? (
            <>
              <button
                onClick={retake}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retake Photo
              </button>
              <button
                onClick={confirmCapture}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-emerald-600/30"
              >
                <CheckCircle className="w-4 h-4" /> Run Sarvam AI OCR →
              </button>
            </>
          ) : (
            <button
              onClick={takeSnapshot}
              disabled={hasPermission === false}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/30 active:scale-95"
            >
              <Camera className="w-4 h-4" /> Capture Document
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
