import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable()
export class RedirectService {
    constructor(
        private router: Router
    ) {}

    /**
     * Redirect to a specific route
     */
    to(
        path: string[],
        data?: any
    ) {
        this.router.navigate(
            ['/redirect'],
            {
                queryParams: {
                    path: JSON.stringify(path),
                    data: data ? JSON.stringify(data) : data
                }
            }
        );
    }
}

