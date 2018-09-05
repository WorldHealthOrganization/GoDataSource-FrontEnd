import { Component, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-redirect',
    encapsulation: ViewEncapsulation.None,
    template: ''
})
export class RedirectComponent {
    constructor(
        private route: ActivatedRoute,
        private router: Router
    ) {
        // redirect back ? fix for stupid angular issue with the same URL
        this.route.queryParams
            .subscribe((queryParams: { url: string, params: string }) => {
                // redirect to next step
                this.router.navigate(
                    [queryParams.url],
                    {
                        queryParams: {
                            params: queryParams.params
                        }
                    }
                );
            });
    }
}
