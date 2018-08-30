import { Injectable } from '@angular/core';

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
            document.querySelector(selector)
                .scrollIntoView({
                    behavior: 'smooth',
                    block: block
                });
        });
    }
}
