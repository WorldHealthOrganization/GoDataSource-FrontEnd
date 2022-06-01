import { Component, OnInit } from '@angular/core';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { Router } from '@angular/router';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs/internal/observable/throwError';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';

@Component({
  selector: 'app-logout',
  template: ''
})
export class LogoutComponent implements OnInit {
  /**
     * Constructor
     */
  constructor(
    private router: Router,
    private authDataService: AuthDataService,
    private toastV2Service: ToastV2Service,
    private i18nService: I18nService,
    private dialogV2Service: DialogV2Service
  ) {}

  /**
     * Component initialized
     */
  ngOnInit() {
    setTimeout(() => {
      // show loading
      const loadingDialog = this.dialogV2Service.showLoadingDialog();

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
            this.toastV2Service.error(err);
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
                this.toastV2Service.error(err);
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
