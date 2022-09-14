import { ColDef } from '@ag-grid-community/core';
import { IV2Column, IV2ColumnAction } from './column.model';

/**
 * Extended AG-Grid column definition
 */
export interface IExtendedColDef extends ColDef {
  // column definition
  columnDefinition: IV2Column | IV2ColumnAction;

  // optional
  columnDefinitionData?: any;
}
