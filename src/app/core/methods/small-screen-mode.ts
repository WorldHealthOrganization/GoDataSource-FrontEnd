/**
 * Determine if small screen mode
 */
export const determineIfSmallScreenMode: () => boolean = () => {
  return window.innerWidth < 768;
};
