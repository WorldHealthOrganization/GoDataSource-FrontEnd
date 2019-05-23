import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';

@Component({
    selector: 'app-redirect',
    template: ''
})
export class RedirectComponent {
    constructor(
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.route.queryParams
            .subscribe((queryParams: { path: any, data?: any }) => {
                // format data
                let path = queryParams.path ? JSON.parse(queryParams.path) : undefined;
                let data;
                if (queryParams.data) {
                    data = JSON.parse(queryParams.data);
                }

                // no proper path provided ?
                if (
                    !path ||
                    !_.isArray(path)
                ) {
                    path = ['/'];
                    data = undefined;
                }

                // redirect
                this.router.navigate(
                    path, {
                        queryParams: data
                    }
                );
            });
    }
}
