"use client";

import { useRef, useState, useCallback } from "react";
import { Camera, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SelfieCaptureProps {
  onCapture: (dataUrl: string) => void;
}

export function SelfieCapture({ onCapture }: SelfieCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false); // <-- new: state instead of reading ref in JSX
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStreaming(true);
    } catch {
      setError("Camera access denied or unavailable");
    }
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreaming(false);
  }

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setPhoto(dataUrl);
    onCapture(dataUrl);
    stopCamera();
  }

  function retake() {
    setPhoto(null);
    startCamera();
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!photo && !streaming && (
        <Button type="button" variant="outline" onClick={startCamera} className="w-full">
          <Camera className="h-4 w-4 mr-2" />
          Open Camera
        </Button>
      )}

      {!photo && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={streaming ? "w-full rounded-md aspect-video object-cover bg-muted" : "hidden"}
        />
      )}

      {!photo && streaming && (
        <Button type="button" onClick={capture} className="w-full">
          Capture Photo
        </Button>
      )}

      {photo && (
        <div className="space-y-2">
          <img src={photo} alt="Selfie preview" className="w-full rounded-md aspect-video object-cover" />
          <Button type="button" variant="outline" onClick={retake} className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Retake
          </Button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}