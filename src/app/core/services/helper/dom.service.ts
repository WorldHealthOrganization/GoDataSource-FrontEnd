import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable()
export class DomService {

  /**
     * Scroll to the end of the list of elements with the given css selector
     * @param selector
     * @param block
     */
  scrollItemIntoView(
    selector,
    block: string = 'end'
  ) {
    setTimeout(function() {
      const item = document.querySelector(selector);
      if (
        item &&
                item.scrollIntoView
      ) {
        item.scrollIntoView({
          behavior: 'smooth',
          block: block
        } as ScrollIntoViewOptions);
      }
    });
  }

  /**
     * Convert SVG to PNG image
     */
  getPNGBase64(
    selector: string,
    tempCanvasSelector: string,
    splitFactor: number = 1,
    exportAsSinglePage?: boolean
  ): Observable<string> {
    return new Observable((observer) => {
      // server page size
      const pageSize = {
        width: 1190,
        height: 840
      };

      // compute render size based on server page size and split factor
      // get graph svg container
      const graphContainer: any = document.querySelector(selector);

      // nothing found ?
      if (!graphContainer) {
        observer.next(null);
        observer.complete();
        return;
      }

      // get graph container dimensions
      const graphContainerSVGWidth = graphContainer.width.baseVal.value;
      const graphContainerSVGHeight = graphContainer.height.baseVal.value;
      // get image ratio
      const imageAspectRatio = graphContainerSVGWidth / graphContainerSVGHeight;

      // initialize canvas dimensions
      const render: any = {};

      // single page format?
      if (exportAsSinglePage) {
        // change resizing logic
        if (imageAspectRatio > 1) {
          render.height = graphContainerSVGHeight * (pageSize.width / graphContainerSVGWidth) * splitFactor;
          render.width = pageSize.width;
        } else {
          if (graphContainerSVGHeight > pageSize.height) {
            render.width = graphContainerSVGWidth * (pageSize.height / graphContainerSVGHeight) * splitFactor;
            render.height = pageSize.height;
          }
        }
      } else {
        // check image format (landscape or portrait)
        if (imageAspectRatio > 1) {
        // landscape mode; enlarge the image vertically, to match the height of the page
          render.width = pageSize.height * splitFactor * imageAspectRatio;
          render.height = pageSize.height * splitFactor;
        } else {
        // portrait mode; enlarge the image horizontally, to match the width of the page
          render.width = pageSize.width * splitFactor;
          render.height = pageSize.width * splitFactor / imageAspectRatio;
        }
      }

      // get SVG as string
      const svgString = new XMLSerializer().serializeToString(graphContainer);
      // get canvas container
      const canvas: any = document.querySelector(tempCanvasSelector);
      // resize canvas to correct dimensions
      canvas.width = render.width;
      canvas.height = render.height;
      // add svg to canvas context
      const context = canvas.getContext('2d');
      const DOMURL: any = self.URL || self;
      const img = new Image();
      const svg = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = DOMURL.createObjectURL(svg);
      img.onload = function() {
        context.drawImage(img, 0, 0, render.width, render.height);
        const png = canvas.toDataURL('image/png');
        DOMURL.revokeObjectURL(png);
        // extract PNG base64 encoded content
        observer.next(png.replace('data:image/png;base64,', ''));
        observer.complete();

      };
      img.src = url;
    });
  }

}
