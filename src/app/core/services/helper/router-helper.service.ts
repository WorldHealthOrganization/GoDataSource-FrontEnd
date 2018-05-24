import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { Router } from '@angular/router';

@Injectable()
export class RouterHelperService {

    constructor(
        private router: Router
    ) {
    }

    /**
     * Navigate to a give URL. If the target URL is the current URL, it will force reloading the page
     * @param {string[]} targetUrl
     * @returns {Promise<void>}
     */
    navigateForce(targetUrl: string[]) {
        return this.router.navigate(['..'], {skipLocationChange: true})
            .then(() => {
                this.router.navigate(targetUrl);
            });
    }
}

