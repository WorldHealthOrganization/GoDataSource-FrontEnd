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

    generatePngFromSvg(selector: string, canvasSelector: string ) {

        const svg = document.querySelector(selector);
        console.log(selector);
        console.log(canvasSelector);
        console.log(svg);
        const img = document.createElement('img');
        const canvas: any = document.querySelector(canvasSelector);
        console.log(canvas);

// get svg data
        const xml = new XMLSerializer().serializeToString(svg);

// make it base64
        const svg64 = btoa(xml);
        const b64Start = 'data:image/svg+xml;base64,';

// prepend a "header"
        const image64 = b64Start + svg64;

        console.log(image64);
        console.log(svg64);
// set it as the source of the img element
        img.src = image64;

// draw the image onto the canvas
      canvas.getContext('2d').drawImage(img, 0, 0);


        img.onload = function() {
                  //    ctx.drawImage(img, 0, 0);
                  //    const png = canvas.toDataURL('image/png');
                   //   document.querySelector('#png-container').innerHTML = '<img src="'+png+'"/>';
                   //   DOMURL.revokeObjectURL(png);
            const png = canvas.toDataURL('image/png');
                      console.log(png);
                  };

    //  console.log(png);


  //       const svgString = new XMLSerializer().serializeToString(document.querySelector(selector));
  //
  //       const canvas : any = document.getElementById(canvasSelector);
  //       const ctx = canvas.getContext('2d');
  //   //    const DOMURL = self.URL || self.webkitURL || self;
  //       const img = new Image();
  //       const svg = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
  //       ctx.drawImage(img, 0, 0);
  //       const png = canvas.toDataURL('image/png');
  //       console.log(png);
  // //      const url = DOMURL.createObjectURL(svg);
  //       img.onload = function() {
  //           ctx.drawImage(img, 0, 0);
  //           const png = canvas.toDataURL('image/png');
  //        //   document.querySelector('#png-container').innerHTML = '<img src="'+png+'"/>';
  //        //   DOMURL.revokeObjectURL(png);
  //
  //           console.log(png);
  //       };
    }


    getPNGBase642212112(selector, splitFactor, tempCanvasSelector) {
        console.log(tempCanvasSelector);
        if (!splitFactor) {
            splitFactor = 1;
        }
        return new Promise(function (resolve) {
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
            console.log(canvas);
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
       //         document.querySelector('#png-container').innerHTML = '<img src="' + png + '"/>';
                DOMURL.revokeObjectURL(png);
                // extract PNG base64 encoded content
                resolve(png.replace('data:image/png;base64,', ''));
            };
            img.src = url;
        });
    }

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
                //         document.querySelector('#png-container').innerHTML = '<img src="' + png + '"/>';
                DOMURL.revokeObjectURL(png);
                // extract PNG base64 encoded content
                observer.next(png.replace('data:image/png;base64,', ''));
                observer.complete();

            };
             img.src = url;
        });
    }


}
