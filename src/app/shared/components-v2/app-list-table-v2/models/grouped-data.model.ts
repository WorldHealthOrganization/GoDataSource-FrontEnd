/**
 * Grouped data value
 */
export interface IV2GroupedDataValue {
  // required
  label: string;
  bgColor: string;
  textColor: string;
  value: string;

  // optional
  active?: boolean;
}

/**
 * Grouped data
 */
export interface IV2GroupedData {
  // required
  label: string;
  data: {
    // required
    loading: boolean,
    get: (
      data: IV2GroupedData,
      refreshUI: () => void
    ) => void,
    values: IV2GroupedDataValue[]

    // optional
    blockNextGet?: boolean;
  };

  // optional
  click?: (value: IV2GroupedDataValue | null, group: IV2GroupedData) => void;
}
