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
    <div className="w-full flex flex-col border border-neutral-800 rounded-xl overflow-hidden bg-black shadow-xl mb-[140px]">
      <div className="bg-black px-5 py-4 flex items-center justify-between border-b border-neutral-800">
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
          <div className="absolute inset-0 border-[1px] border-white/20 m-4 sm:m-6 pointer-events-none" />
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-black p-4 pb-8 sm:p-6 flex flex-col items-center justify-center min-h-[140px] border-t border-neutral-800 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
        {!image ? (
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={capture}
              className="w-[72px] h-[72px] rounded-full bg-transparent flex items-center justify-center border-[4px] border-white hover:scale-105 active:scale-95 transition-transform shadow-xl cursor-pointer"
              aria-label="Ambil Gambar"
            >
              <div className="w-[56px] h-[56px] rounded-full bg-white flex items-center justify-center">
                <CameraIcon className="w-7 h-7 text-black" />
              </div>
            </button>
            <span className="text-xs text-neutral-400 font-medium">Ketuk untuk memotret</span>
          </div>
        ) : (
          <div className="flex w-full gap-4 max-w-sm mx-auto">
            <Button
              type="button"
              onClick={retake}
              className="flex-1 min-h-[52px] bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Ulangi
            </Button>
            {nextButton && <div className="flex-1 flex">{nextButton}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
