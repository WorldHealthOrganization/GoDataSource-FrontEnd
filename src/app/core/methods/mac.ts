/**
 * Determine if mac device
 */
export const determineIfMacDevice: () => boolean = () => {
  return navigator.userAgent.toUpperCase().includes('MAC');
};
