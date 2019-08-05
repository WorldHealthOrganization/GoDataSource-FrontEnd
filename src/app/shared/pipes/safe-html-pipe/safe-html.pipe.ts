import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'safeHtml'
})
export class SafeHtmlPipe implements SafeHtml, PipeTransform {
    constructor(
        private sanitized: DomSanitizer
    ) {}

    transform(value: string) {
        return this.sanitized.bypassSecurityTrustHtml(value);
    }
}
