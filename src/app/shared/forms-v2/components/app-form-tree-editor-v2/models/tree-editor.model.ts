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
  global?: boolean;

  // used by ui
  flash?: boolean;
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
