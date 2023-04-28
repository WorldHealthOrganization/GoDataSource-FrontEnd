/**
 * Tree accepted value format
 */
export interface ITreeEditorDataValue {
  // categoryId => allowed ref data items
  [categoryId: string]: {
    [itemId: string]: true
  };
}

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
  isSystemWide?: boolean;
  iconUrl?: string;

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
  children: ITreeEditorDataCategoryItem[];

  // used by ui
  collapsed?: boolean;
  checked?: number;
}
