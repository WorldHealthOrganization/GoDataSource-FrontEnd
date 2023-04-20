/**
 * Used for input data - category item
 */
export interface ITreeEditorDataCategoryItem {
  // required
  id: string;
  label: string;

  // optional
  disabled?: boolean;
  colorCode?: string;
}

/**
 * Used for input data - category
 */
export interface ITreeEditorDataCategory {
  // required
  id: string;
  label: string;
  children: {
    options: ITreeEditorDataCategoryItem[],
    selected: {
      [id: string]: true
    }
  };

  // used by ui
  collapsed?: boolean;
  checked?: number;
}
