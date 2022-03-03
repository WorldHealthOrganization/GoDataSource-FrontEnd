import { INoRowsOverlayComp } from '@ag-grid-community/core';

/**
 * No rows element
 */
export class V2NoRowsComponent implements INoRowsOverlayComp {
  // no rows element
  private static _noRowsHtmlElement: HTMLElement;
  static get noRowsHtmlElement(): HTMLElement {
    return this._noRowsHtmlElement;
  }

  /**
   * Initialize
   */
  init(): void {
    // find no rows element
    if (!V2NoRowsComponent.noRowsHtmlElement) {
      const noRowsElements = document.getElementsByClassName('gd-list-table-data-no-rows');
      V2NoRowsComponent._noRowsHtmlElement = noRowsElements.length > 0 ? noRowsElements.item(0) as any : null;
    }
  };

  /**
   * Loading element
   */
  getGui(): HTMLElement {
    return V2NoRowsComponent.noRowsHtmlElement;
  }
}
