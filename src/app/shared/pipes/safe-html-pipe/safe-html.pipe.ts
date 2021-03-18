import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'safeHtml'
})
export class SafeHtmlPipe implements SafeHtml, PipeTransform {
    /**
     * Constructor
     */
    constructor(
        private sanitized: DomSanitizer
    ) {}

    /**
     * Sanitize
     */
    transform(value: string) {
        return this.sanitized.bypassSecurityTrustHtml(value);
    }
}
