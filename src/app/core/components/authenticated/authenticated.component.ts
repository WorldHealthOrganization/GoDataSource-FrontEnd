import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

import { AuthDataService } from '../../services/data/auth.data.service';
import { UserModel } from '../../models/user.model';
import { MatSidenav } from '@angular/material';
import { OutbreakDataService } from '../../services/data/outbreak.data.service';
import { OutbreakModel } from "../../models/outbreak.model";
import { SnackbarService } from "../../services/helper/snackbar.service";
import { ReferenceDataDataService } from '../../services/data/reference-data.data.service';

@Component({
    selector: 'app-authenticated',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './authenticated.component.html',
    styleUrls: ['./authenticated.component.less']
})
export class AuthenticatedComponent implements OnInit {

    @ViewChild('snav') sideNav: MatSidenav;

    // authenticated user
    authUser: UserModel;

    constructor(
        private router: Router,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService,
        private outbreakDataService: OutbreakDataService,
        private referenceDataDataService: ReferenceDataDataService
    ) {
        // detect when the route is changed
        this.router.events.subscribe(() => {
            // close the SideNav whenever the route is changed
            if (this.sideNav) {
                this.sideNav.close();
            }
        });

        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
    }

    ngOnInit() {
        // check if user is authenticated
        if (!this.authUser) {
            // user is NOT authenticated; redirect to Login page
            return this.router.navigate(['/auth/login']);
        }

        // determine the Selected Outbreak and display message if different than the active one.
        this.outbreakDataService
            .determineSelectedOutbreak()
            .subscribe(() => {
                this.outbreakDataService.getSelectedOutbreakSubject()
                    .subscribe((selectedOutbreak: OutbreakModel) => {
                        this.outbreakDataService.checkActiveSelectedOutbreak();
                    });
            });

        // cache reference data
        this.referenceDataDataService.getReferenceData().subscribe();

        if (this.router.url === '/') {
            // redirect to default landing page
            return this.router.navigate(['/users']);
        }
    }

}
