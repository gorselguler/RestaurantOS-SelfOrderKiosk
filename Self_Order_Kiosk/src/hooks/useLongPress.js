import { useCallback, useRef } from 'react';

export default function useLongPress(onLongPress, onClick, { shouldPreventDefault = true, delay = 3000 } = {}) {
  const timeout = useRef();
  const target = useRef();

  const start = useCallback(
    (event) => {
      if (shouldPreventDefault && event.target) {
        event.target.addEventListener('touchend', preventDefault, { passive: false });
        target.current = event.target;
      }
      timeout.current = setTimeout(() => {
        onLongPress(event);
      }, delay);
    },
    [onLongPress, delay, shouldPreventDefault]
  );

  const clear = useCallback(
    (event, shouldTriggerClick = true) => {
      timeout.current && clearTimeout(timeout.current);
      if (shouldTriggerClick && !shouldPreventDefault && onClick) {
        onClick(event);
      }
      if (shouldPreventDefault && target.current) {
        target.current.removeEventListener('touchend', preventDefault);
      }
    },
    [shouldPreventDefault, onClick]
  );

  return {
    onMouseDown: (e) => start(e),
    onTouchStart: (e) => start(e),
    onMouseUp: (e) => clear(e),
    onMouseLeave: (e) => clear(e, false),
    onTouchEnd: (e) => clear(e),
  };
}

const preventDefault = (event) => {
  if (!('touches' in event)) return;
  if (event.touches.length < 2 && event.preventDefault) {
    event.preventDefault();
  }
};
