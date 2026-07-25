'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bot } from 'lucide-react';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function AssistantWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const [offset, setOffset] = React.useState({ right: 24, bottom: 88 });
  const dragRef = React.useRef({ startX: 0, startY: 0, right: 0, bottom: 0, moved: false, active: false });

  const handlePointerDown = (event: React.PointerEvent) => {
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      right: offset.right,
      bottom: offset.bottom,
      moved: false,
      active: true,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag.active) {
      return;
    }
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      drag.moved = true;
    }
    setOffset({
      right: clamp(drag.right - deltaX, 8, window.innerWidth - 80),
      bottom: clamp(drag.bottom - deltaY, 8, window.innerHeight - 80),
    });
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    dragRef.current.active = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleClick = () => {
    if (dragRef.current.moved) {
      return;
    }
    router.push('/dashboard/assistant');
  };

  const isDashboardArea =
    pathname.startsWith('/dashboard') &&
    !pathname.startsWith('/dashboard/verify') &&
    !pathname.startsWith('/dashboard/rejected');

  if (!isDashboardArea || pathname.startsWith('/dashboard/assistant')) {
    return null;
  }

  return (
    <div className="fixed z-50" style={{ right: offset.right, bottom: offset.bottom }}>
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
        aria-label="Buka asisten"
        className="flex h-14 w-14 touch-none items-center justify-center rounded-full bg-primary-400 text-primary-950 shadow-lg transition-colors hover:bg-primary-500"
      >
        <Bot className="h-6 w-6" />
      </button>
    </div>
  );
}
