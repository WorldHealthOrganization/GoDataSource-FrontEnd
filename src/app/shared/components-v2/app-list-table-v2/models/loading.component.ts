import { ILoadingOverlayComp } from '@ag-grid-community/core';

/**
 * Loading element
 */
export class V2LoadingComponent implements ILoadingOverlayComp {
  // loading element
  private static _loadingHtmlElement: HTMLElement;
  static get loadingHtmlElement(): HTMLElement {
    return this._loadingHtmlElement;
  }

  /**
   * Initialize
   */
  init(): void {
    // find loading element
    if (!V2LoadingComponent.loadingHtmlElement) {
      const loadingElements = document.getElementsByClassName('gd-list-table-data-loading');
      V2LoadingComponent._loadingHtmlElement = loadingElements.length > 0 ? loadingElements.item(0) as any : null;
    }
  };

  /**
   * Loading element
   */
  getGui(): HTMLElement {
    return V2LoadingComponent.loadingHtmlElement;
  }
}
