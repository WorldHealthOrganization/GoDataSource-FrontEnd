/**
 * Grouped data
 */
export interface IV2GroupedData {
  // required
  label: string;
  data: {
    loading: boolean,
    get: (
      data: IV2GroupedData,
      refreshUI: () => void
    ) => void,
    values: {
      label: string,
      color: string,
      value: string
    }[]
  }
}
