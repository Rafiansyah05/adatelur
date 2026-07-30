'use client';

import * as React from 'react';
import Webcam from 'react-webcam';
import { Button } from './ui/Button';
import { RefreshCw, Camera as CameraIcon } from 'lucide-react';
import Image from 'next/image';

interface CameraCaptureProps {
  onCapture: (imageSrc: string | null) => void;
  label: string;
  nextButton?: React.ReactNode;
}

export function CameraCapture({ onCapture, label, nextButton }: CameraCaptureProps) {
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
        onCapture(imageSrc);
      }
    }
  }, [webcamRef, onCapture]);

  const retake = () => {
    setImage(null);
    onCapture(null);
  };

  if (!isClient) return null;

  return (
    <div className="w-full flex flex-col border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900 shadow-xl">
      <div className="bg-neutral-900 px-5 py-4 flex items-center justify-between border-b border-neutral-800">
        <h3 className="text-base sm:text-lg text-white font-bold tracking-wide">{label}</h3>
        <span className="text-xs font-semibold text-neutral-400 bg-neutral-800 px-2.5 py-1 rounded-full">
          {image ? 'Foto Diambil' : 'Kamera Aktif'}
        </span>
      </div>

      <div className="relative w-full aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
        {!image ? (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: 'environment', aspectRatio: 4 / 3 }}
            className="w-full h-full object-cover"
          />
        ) : (
          <Image src={image} alt={label} fill className="object-cover" />
        )}

        {!image && (
          <div className="absolute inset-0 border-2 border-white/20 m-4 sm:m-6 rounded-lg pointer-events-none" />
        )}
      </div>

      <div className="bg-neutral-900 p-6 flex flex-col items-center justify-center min-h-[120px] border-t border-neutral-800">
        {!image ? (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={capture}
              className="w-16 h-16 rounded-full bg-white flex items-center justify-center border-4 border-neutral-400 hover:scale-105 active:scale-95 transition-transform shadow-lg cursor-pointer"
              aria-label="Ambil Gambar"
            >
              <CameraIcon className="w-6 h-6 text-black" />
            </button>
            <span className="text-xs text-neutral-400 font-medium">Ketuk tombol untuk memotret</span>
          </div>
        ) : (
          <div className="flex w-full gap-4">
            <Button
              type="button"
              onClick={retake}
              className="flex-1 min-h-[52px] bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg border-transparent flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Ulangi Foto
            </Button>
            {nextButton && <div className="flex-1">{nextButton}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
