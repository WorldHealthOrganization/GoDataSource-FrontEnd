import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { OutbreakModel } from '../../models/outbreak.model';

@Injectable()
export class DomService {

    /**
     * Scroll to the end of the list of elements with the given css selector
     * @param selector
     */
    scrollItemIntoView(
        selector,
        block: string = 'end'
    ) {
        setTimeout(function () {
            const item = document.querySelector(selector);
            if (
                item &&
                item.scrollIntoView
            ) {
                item.scrollIntoView({
                    behavior: 'smooth',
                    block: block
                });
            }
        });
    }

    /**
     * convert svg images to png images
     * @param selector
     * @param splitFactor
     * @param tempCanvasSelector
     * @returns {Observable<string>}
     */
    getPNGBase64(selector: string, tempCanvasSelector: string, splitFactor: number = 1): Observable<string> {
        return Observable.create((observer) => {
            // server page size
            const pageSize = {
                width: 1190,
                height: 840
            };
            // compute render size based on server page size and split factor
            // compute page and image aspect ratio
            const pageAspectRatio = pageSize.width / pageSize.height;
            // get graph svg container
            const graphContainer: any = document.querySelector(selector);
            // get graph container dimensions
            const graphContainerSVGWidth = graphContainer.width.baseVal.value;
            const graphContainerSVGHeight = graphContainer.height.baseVal.value;
            // get image ratio
            const imageAspectRatio = graphContainerSVGWidth / graphContainerSVGHeight;
            // initialize canvas dimensions with page dimensions on the server
            const render = {
                width: pageSize.width * splitFactor,
                height: pageSize.height * splitFactor
            };
            // if the image is wider than page (proportionally)
            if (imageAspectRatio > pageAspectRatio) {
                // resize its width according to the split factor
                render.width = pageSize.width * splitFactor;
                render.height = pageSize.width * splitFactor * 1 / imageAspectRatio;
            } else {
                // otherwise resize its height according to the split factor
                render.width = pageSize.height * splitFactor * imageAspectRatio;
                render.height = pageSize.height * splitFactor;
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
            const svg = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
            const url = DOMURL.createObjectURL(svg);
            img.onload = function () {
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
