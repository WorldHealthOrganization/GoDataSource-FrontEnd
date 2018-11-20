import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';

import { AuthDataService } from '../../services/data/auth.data.service';
import { UserModel } from '../../models/user.model';
import { MatSidenav } from '@angular/material';
import { OutbreakDataService } from '../../services/data/outbreak.data.service';
import { SnackbarService } from '../../services/helper/snackbar.service';
import { ReferenceDataDataService } from '../../services/data/reference-data.data.service';
import { HelpDataService } from '../../services/data/help.data.service';
import * as _ from 'lodash';
import { Constants } from '../../models/constants';

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

    Constants = Constants;
    contextSearchHelpItems: string[];

    constructor(
        private router: Router,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService,
        private outbreakDataService: OutbreakDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private helpDataService: HelpDataService
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
                    .subscribe(() => {
                        this.outbreakDataService.checkActiveSelectedOutbreak();
                    });
            });

        // cache reference data
        this.referenceDataDataService.getReferenceData().subscribe();

        // redirect root to dashboard
        const redirectRootToDashboard = () => {
            // redirect to default landing page
            this.router.navigate(['/dashboard']);
        };

        // subscribe to uri changes
        this.router.events.subscribe((navStart: NavigationStart) => {
            // redirect root to dashboard
            if (navStart.url === '/') {
                redirectRootToDashboard();
            }
            // check for context help
            this.helpDataService.getContextHelpItems(this.router.url).subscribe((items) => {
                if (_.isEmpty(items)) {
                    this.contextSearchHelpItems = null;
                } else {
                    this.contextSearchHelpItems = _.map(items, 'id');
                }
            });
        });

        // redirect root to dashboard
        if (this.router.url === '/') {
            redirectRootToDashboard();
        }

        this.helpDataService.getContextHelpItems(this.router.url).subscribe((items) => {
            if (_.isEmpty(items)) {
                this.contextSearchHelpItems = null;
            } else {
                this.contextSearchHelpItems = _.map(items, 'id');
            }
        });

    }

}
