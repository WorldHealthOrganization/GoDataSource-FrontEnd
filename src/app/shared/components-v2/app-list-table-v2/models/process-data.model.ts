/**
 * Process data
 */
export interface IV2ProcessSelectedData {
  // required
  key: string;
  process: (
    dataMap: {
      [id: string]: any
    },
    selected: string[]
  ) => any;
}
