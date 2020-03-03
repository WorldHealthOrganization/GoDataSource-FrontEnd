import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { map } from 'rxjs/operators';

@Injectable()
export class CaptchaDataService {
    /**
     * Constructor
     */
    constructor(
        private http: HttpClient,
        private domSanitizer: DomSanitizer
    ) {}

    /**
     * Generate SVG captcha
     * @returns {Observable<SafeHtml>}
     */
    generateSVG(): Observable<SafeHtml> {
        return this.http
            .get(
                'captcha/generate-svg', {
                    withCredentials: true
                }
            )
            .pipe(map((svgData: string) => this.domSanitizer.bypassSecurityTrustHtml(svgData)));
    }
}

