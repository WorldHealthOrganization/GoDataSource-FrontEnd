import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { Router } from '@angular/router';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs/internal/observable/throwError';

@Component({
    selector: 'app-logout',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './logout.component.html'
})
export class LogoutComponent implements OnInit {
    /**
     * Constructor
     */
    constructor(
        private router: Router,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService,
        private i18nService: I18nService,
        protected dialogService: DialogService
    ) {}

    /**
     * Component initialized
     */
    ngOnInit() {
        setTimeout(() => {
            // show loading
            const loadingDialog = this.dialogService.showLoadingDialog();

            // Logout from API
            this.authDataService
                .logout()
                .pipe(
                    catchError((err) => {
                        // hide loading
                        loadingDialog.close();

                        // clear token info
                        this.authDataService.clearStorage();

                        // redirect to Login page
                        this.router.navigate(['/auth/login']);

                        // show error
                        this.snackbarService.showApiError(err);
                        return throwError(err);
                    })
                )
                .subscribe(() => {
                    // invalidate language
                    this.i18nService.clearStorage();
                    this.i18nService
                        .loadUserLanguage()
                        .pipe(
                            catchError((err) => {
                                // hide loading
                                loadingDialog.close();

                                // show api error
                                this.snackbarService.showApiError(err);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            // hide loading
                            loadingDialog.close();

                            // redirect to Login page
                            this.router.navigate(['/auth/login']);
                        });
                });
        });
    }

}
