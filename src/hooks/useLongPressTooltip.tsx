import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

const HOLD_DURATION = 450;
const AUTO_DISMISS_MS = 2800;

interface TooltipPos {
  x: number;
  y: number;
}

export function useLongPressTooltip(text: string | undefined) {
  const [pos, setPos] = useState<TooltipPos | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHold = useCallback(() => {
    if (holdTimer.current !== null) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }, []);

  const clearDismiss = useCallback(() => {
    if (dismissTimer.current !== null) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  }, []);

  const show = useCallback((rect: DOMRect) => {
    if (!text) return;
    clearDismiss();
    setPos({ x: rect.left + rect.width / 2, y: rect.top });
    dismissTimer.current = setTimeout(() => setPos(null), AUTO_DISMISS_MS);
  }, [text, clearDismiss]);

  const hide = useCallback(() => {
    clearHold();
    clearDismiss();
    setPos(null);
  }, [clearHold, clearDismiss]);

  const handlers = {
    onMouseDown: (e: React.MouseEvent<HTMLElement>) => {
      if (!text) return;
      const rect = e.currentTarget.getBoundingClientRect();
      holdTimer.current = setTimeout(() => show(rect), HOLD_DURATION);
    },
    onMouseUp: hide,
    onMouseLeave: hide,
    onTouchStart: (e: React.TouchEvent<HTMLElement>) => {
      if (!text) return;
      const rect = e.currentTarget.getBoundingClientRect();
      holdTimer.current = setTimeout(() => show(rect), HOLD_DURATION);
    },
    onTouchEnd: () => {
      // If tooltip is showing, let it auto-dismiss; otherwise cancel hold
      if (pos === null) hide();
      else clearHold();
    },
    onTouchMove: hide,
    onContextMenu: (e: React.MouseEvent<HTMLElement>) => {
      // Suppress long-press context menu on mobile browsers
      if (pos !== null || holdTimer.current !== null) e.preventDefault();
    },
  };

  const tooltip = pos
    ? createPortal(
        <div
          className="lp-tooltip"
          style={{ left: pos.x, top: pos.y }}
          onPointerDown={hide}
        >
          {text}
        </div>,
        document.body
      )
    : null;

  return { handlers, tooltip };
}
