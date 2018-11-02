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
    getPNGBase64(selector, splitFactor, tempCanvasSelector): Observable<string> {
        if (!splitFactor) {
            splitFactor = 1;
        }
        return Observable.create((observer) => {
            // server page size
            const page = {
                width: 1090,
                height: 740
            };
            // compute render size based on server page size and split factor
            const render = {
                width: page.width * splitFactor,
                height: page.height * splitFactor
            };
            // get SVG
            const svgString = new XMLSerializer().serializeToString(document.querySelector(selector));
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
