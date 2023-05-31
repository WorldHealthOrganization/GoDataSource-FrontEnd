/**
 * Process data
 */
export interface IV2ProcessSelectedData {
  // required
  key: string;
  shouldProcess: (
    dataMap: {
      [id: string]: any
    },
    selected: string[]
  ) => boolean;
  process: (
    dataMap: {
      [id: string]: any
    },
    selected: string[]
  ) => any;
}
