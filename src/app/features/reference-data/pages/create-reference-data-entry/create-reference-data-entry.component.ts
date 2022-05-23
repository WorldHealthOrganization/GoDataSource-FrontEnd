import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { Observable, throwError } from 'rxjs';
import { IconModel } from '../../../../core/models/icon.model';
import { IconDataService } from '../../../../core/services/data/icon.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { catchError, map, switchMap } from 'rxjs/operators';
import { CreateConfirmOnChanges } from '../../../../core/helperClasses/create-confirm-on-changes';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { IGeneralAsyncValidatorResponse } from '../../../../shared/xt-forms/validators/general-async-validator.directive';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-create-reference-data-entry',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './create-reference-data-entry.component.html',
  styleUrls: ['./create-reference-data-entry.component.less']
})
export class CreateReferenceDataEntryComponent
  extends CreateConfirmOnChanges
  implements OnInit {
  // breadcrumbs
  // breadcrumbs: BreadcrumbItemModel[] = [];

  categoryId: string;
  // new Entry model
  entry: ReferenceDataEntryModel = new ReferenceDataEntryModel();

  iconsList$: Observable<IconModel[]>;

  changeIcon: boolean = false;

  category: ReferenceDataCategoryModel;

  // authenticated user details
  authUser: UserModel;

  // duplicate validator
  codeDuplicateValidator$: Observable<boolean | IGeneralAsyncValidatorResponse>;

  /**
     * Constructor
     */
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private referenceDataDataService: ReferenceDataDataService,
    private toastV2Service: ToastV2Service,
    private formHelper: FormHelperService,
    private iconDataService: IconDataService,
    private i18nService: I18nService,
    private authDataService: AuthDataService,
    private redirectService: RedirectService
  ) {
    super();
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    // get the authenticated user
    this.authUser = this.authDataService.getAuthenticatedUser();

    // icons data
    this.iconsList$ = this.iconDataService.getIconsList();

    // check for duplicate codes
    this.codeDuplicateValidator$ = new Observable((observer) => {
      // is there any point to validate ?
      if (!this.entry.code) {
        observer.next(true);
        observer.complete();
        return;
      }

      // validate
      this.referenceDataDataService
        .checkCodeUniqueness(this.entry.code)
        .subscribe((isValid: boolean | IGeneralAsyncValidatorResponse) => {
          observer.next(isValid);
          observer.complete();
        });
    });

    // get the route params
    this.route.params
      .subscribe((params: { categoryId }) => {
        this.categoryId = params.categoryId;

        // retrieve Reference Data Category info
        this.referenceDataDataService
          .getReferenceDataByCategory(params.categoryId)
          .subscribe((category: ReferenceDataCategoryModel) => {
            // set data
            this.category = category;

            // update breadcrumbs
            this.initializeBreadcrumbs();
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
    // if (ReferenceDataCategoryModel.canList(this.authUser)) {
    //   this.breadcrumbs.push(
    //     new BreadcrumbItemModel('LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE', '/reference-data')
    //   );
    // }
    //
    // // add new breadcrumb: Category page
    // if (
    //   this.category &&
    //         ReferenceDataEntryModel.canList(this.authUser)
    // ) {
    //   this.breadcrumbs.push(
    //     new BreadcrumbItemModel(
    //       this.category.name,
    //       `/reference-data/${this.categoryId}`,
    //       false,
    //       {},
    //       this.category
    //     )
    //   );
    // }
    //
    // // add new breadcrumb: page title
    // this.breadcrumbs.push(
    //   new BreadcrumbItemModel(
    //     'LNG_PAGE_CREATE_REFERENCE_DATA_ENTRY_TITLE',
    //     '.',
    //     true
    //   )
    // );
  }

  /**
     * Create new ref data entry
     */
  createNewEntry(form: NgForm) {

    // get forms fields
    const dirtyFields: any = this.formHelper.getFields(form);

    if (!this.formHelper.validateForm(form)) {
      return;
    }

    // set category ID for the new entry
    dirtyFields.categoryId = this.categoryId;

    // create new entry
    this.referenceDataDataService
      .createEntry(dirtyFields)
      .pipe(
        catchError((err) => {
          // replace error if unique id rule id is breach ?
          if (
            err &&
                        err.details &&
                        err.details.codes &&
                        err.details.codes.id &&
                        Array.isArray(err.details.codes.id) &&
                        err.details.codes.id.indexOf('uniqueness') > -1
          ) {
            err = {
              code: 'REFERENCE_ENTRY_NAME_NOT_UNIQUE'
            };
          }

          // display error
          this.toastV2Service.error(
            err, {
              name: this.entry.value
            }
          );
          return throwError(err);
        }),
        switchMap((newReferenceDataEntry) => {
          // re-load language tokens
          return this.i18nService.loadUserLanguage()
            .pipe(
              map(() => newReferenceDataEntry)
            );
        })
      )
      .subscribe((newReferenceDataEntry) => {
        this.toastV2Service.success('LNG_PAGE_CREATE_REFERENCE_DATA_ENTRY_ACTION_CREATE_ENTRY_SUCCESS_MESSAGE');

        // navigate to proper page
        // method handles disableDirtyConfirm too...
        this.redirectToProperPageAfterCreate(
          this.router,
          this.redirectService,
          this.authUser,
          ReferenceDataEntryModel,
          `reference-data/${this.categoryId}`,
          newReferenceDataEntry.id
        );
      });
  }
}
