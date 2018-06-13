import { Component, OnInit, ViewEncapsulation } from '@angular/core';

import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-logout',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './logout.component.html'
})
export class LogoutComponent implements OnInit {

    constructor(
        private router: Router,
        private authDataService: AuthDataService
    ) {
    }

    ngOnInit() {
        // Logout from API
        this.authDataService.logout()
            .subscribe(() => {
                // redirect to Login page
                this.router.navigate(['/auth/login']);
            });
    }

}
