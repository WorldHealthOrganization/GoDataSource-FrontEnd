import { ChangeDetectorRef } from '@angular/core';

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
      changeDetectorRef: ChangeDetectorRef
    ) => void,
    values: {
      label: string,
      color: string,
      value: string
    }[]
  }
}
