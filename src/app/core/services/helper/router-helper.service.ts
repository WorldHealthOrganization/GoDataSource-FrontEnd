import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable()
export class RouterHelperService {

    constructor(
        private router: Router
    ) {
    }

    /**
     * Navigate to a given URL. If the target URL is the current URL, it will force reloading the page
     * @param {string[]} targetUrl
     * @returns {Promise<void>}
     */
    navigateForce(targetUrl: string[]) {
        // we are using the Dashboard page as an intermediate route so we can be able to reload current route
        return this.router.navigate(['/dashboard'], {skipLocationChange: true})
            .then(() => {
                this.router.navigate(targetUrl);
            });
    }
}

