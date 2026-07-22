'use client';

import * as React from 'react';
import Webcam from 'react-webcam';
import { Button } from './ui/Button';
import { Camera, RefreshCw, Check } from 'lucide-react';
import Image from 'next/image';

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void;
  label: string;
}

export function CameraCapture({ onCapture, label }: CameraCaptureProps) {
  const webcamRef = React.useRef<Webcam>(null);
  const [image, setImage] = React.useState<string | null>(null);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const capture = React.useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setImage(imageSrc);
      }
    }
  }, [webcamRef]);

  const retake = () => {
    setImage(null);
  };

  const confirm = () => {
    if (image) {
      onCapture(image);
    }
  };

  if (!isClient) return null;

  return (
    <div className="flex flex-col gap-4 p-4 border border-border rounded-md bg-white">
      <h3 className="text-h3 text-text-main font-semibold">{label}</h3>
      <div className="relative w-full aspect-video bg-cream rounded-md overflow-hidden flex items-center justify-center">
        {!image ? (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: 'environment' }}
            className="w-full h-full object-cover"
          />
        ) : (
          <Image src={image} alt={label} fill className="object-cover" />
        )}
      </div>

      <div className="flex justify-center gap-4">
        {!image ? (
          <Button type="button" onClick={capture} className="flex-1 flex items-center justify-center gap-2">
            <Camera className="w-5 h-5" />
            Ambil Foto
          </Button>
        ) : (
          <>
            <Button type="button" variant="secondary" onClick={retake} className="flex-1 flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Ulangi
            </Button>
            <Button type="button" variant="success" onClick={confirm} className="flex-1 flex items-center justify-center gap-2">
              <Check className="w-5 h-5" />
              Gunakan
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
