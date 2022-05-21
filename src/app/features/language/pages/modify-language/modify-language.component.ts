import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { LanguageModel } from '../../../../core/models/language.model';
import { LanguageDataService } from '../../../../core/services/data/language.data.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { catchError, map, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-modify-language',
  templateUrl: './modify-language.component.html'
})
export class ModifyLanguageComponent extends ViewModifyComponent implements OnInit {
  // breadcrumbs
  // breadcrumbs: BreadcrumbItemModel[] = [];

  // constants
  LanguageModel = LanguageModel;

  languageId: string;
  languageData: LanguageModel = new LanguageModel();

  // authenticated user
  authUser: UserModel;

  /**
     * Constructor
     */
  constructor(
    protected route: ActivatedRoute,
    private languageDataService: LanguageDataService,
    private formHelper: FormHelperService,
    private toastV2Service: ToastV2Service,
    private authDataService: AuthDataService,
    protected dialogService: DialogService
  ) {
    super(
      route,
      dialogService
    );
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    // get the authenticated user
    this.authUser = this.authDataService.getAuthenticatedUser();

    // show loading
    this.showLoadingDialog(false);

    this.route.params
      .subscribe((params: { languageId }) => {
        // get language
        this.languageId = params.languageId;
        this.languageDataService
          .getLanguage(this.languageId)
          .subscribe((languageData: LanguageModel) => {
            // since this is cached we need to clone it because otherwise we modify the existing object and if we chose to discard changes...
            this.languageData = new LanguageModel(languageData);

            // update breadcrumbs
            this.initializeBreadcrumbs();

            // hide loading
            this.hideLoadingDialog();
          });
      });
  }

  /**
     * Initialize breadcrumbs
     */
  initializeBreadcrumbs() {
    // // reset
    // this.breadcrumbs = [];
    //
    // // add list breadcrumb only if we have permission
    // if (LanguageModel.canList(this.authUser)) {
    //   this.breadcrumbs.push(
    //     new BreadcrumbItemModel('LNG_PAGE_LIST_LANGUAGES_TITLE', '/languages')
    //   );
    // }
    //
    // // view / modify breadcrumb
    // this.breadcrumbs.push(
    //   new BreadcrumbItemModel(
    //     this.viewOnly ?
    //       'LNG_PAGE_VIEW_LANGUAGE_TITLE' :
    //       'LNG_PAGE_MODIFY_LANGUAGE_TITLE',
    //     null,
    //     true,
    //     {},
    //     this.languageData
    //   )
    // );
  }

  /**
     * Modify Language
     */
  modifyLanguage(form: NgForm) {
    const dirtyFields: any = this.formHelper.getDirtyFields(form);

    if (!this.formHelper.validateForm(form)) {
      return;
    }

    // show loading
    this.showLoadingDialog();

    // modify the event
    this.languageDataService
      .modifyLanguage(this.languageId, dirtyFields)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          // hide loading
          this.hideLoadingDialog();
          return throwError(err);
        }),
        switchMap((modifiedLanguage) => {
          // update language tokens
          return this.languageDataService.getLanguagesList()
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err);
                // hide loading
                this.hideLoadingDialog();
                return throwError(err);
              }),
              map(() => modifiedLanguage)
            );
        })
      )
      .subscribe((modifiedLanguage: LanguageModel) => {
        // update model
        this.languageData = modifiedLanguage;

        // mark form as pristine
        form.form.markAsPristine();

        // display message
        this.toastV2Service.success('LNG_PAGE_MODIFY_LANGUAGE_ACTION_MODIFY_LANGUAGE_SUCCESS_MESSAGE');

        // update breadcrumbs
        this.initializeBreadcrumbs();

        // hide loading
        this.hideLoadingDialog();
      });
  }
}
