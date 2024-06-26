import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'highlight'
})
export class HighlightSearchPipe implements PipeTransform {
  /**
   * Highlight text
   */
  static highlight(
    value: string,
    searchValue
  ): string {
    // nothing to highlight
    if (
      !value ||
      !searchValue
    ) {
      return value;
    }

    // Match in a case insensitive manner
    const re = new RegExp(searchValue, 'gi');
    const match = value.match(re);

    // If there's no match, just return the original value.
    if (!match) {
      return value;
    }

    // format
    return value.replace(
      re,
      `<mark>${match[0]}</mark>`
    );
  }

  /**
   * Constructor - inject used services
   */
  constructor(
    private sanitizer: DomSanitizer
  ) {}

  /**
   * Transform
   */
  transform(
    value: string,
    searchValue: string
  ): SafeHtml {
    // nothing to highlight
    if (
      !value ||
      !searchValue
    ) {
      return value;
    }

    // finished
    return this.sanitizer.bypassSecurityTrustHtml(HighlightSearchPipe.highlight(
      value,
      searchValue
    ));
  }
}
