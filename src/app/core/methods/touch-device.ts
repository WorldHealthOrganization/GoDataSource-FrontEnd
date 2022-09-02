/**
 * Determine if touch device
 */
export const determineIfTouchDevice: () => boolean = () => {
  return ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0);
};
