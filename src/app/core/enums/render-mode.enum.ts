export enum RenderMode {
  FULL,
  MEDIUM,
  SMALL
}

/**
 * Determine render mode
 */
export const determineRenderMode: () => RenderMode = () => {
  // determine render mode
  if (window.innerWidth < 1200) {
    return RenderMode.SMALL;
  } else if (window.innerWidth < 1600) {
    return RenderMode.MEDIUM;
  }

  // default
  return RenderMode.FULL;
};
