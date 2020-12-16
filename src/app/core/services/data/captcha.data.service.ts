import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { map } from 'rxjs/operators';

export enum CaptchaDataFor {
    LOGIN = 'login',
    FORGOT_PASSWORD = 'forgot-password',
    RESET_PASSWORD_QUESTIONS = 'reset-password-questions'
}

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
    generateSVG(forComponent: CaptchaDataFor): Observable<SafeHtml> {
        return this.http
            .get(
                `captcha/generate-svg?forComponent=${forComponent}`
            )
            .pipe(map((svgData: string) => this.domSanitizer.bypassSecurityTrustHtml(svgData)));
    }
}

