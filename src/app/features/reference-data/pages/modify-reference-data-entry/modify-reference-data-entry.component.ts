import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { NgForm } from '@angular/forms';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { Observable } from 'rxjs';
import { IconModel } from '../../../../core/models/icon.model';
import { IconDataService } from '../../../../core/services/data/icon.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { IGeneralAsyncValidatorResponse } from '../../../../shared/xt-forms/validators/general-async-validator.directive';

@Component({
    selector: 'app-modify-reference-data-entry',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-reference-data-entry.component.html',
    styleUrls: ['./modify-reference-data-entry.component.less']
})
export class ModifyReferenceDataEntryComponent extends ViewModifyComponent implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // constants
    ReferenceDataEntryModel = ReferenceDataEntryModel;

    categoryId: string;
    entryId: string;
    // new Entry model
    entry: ReferenceDataEntryModel = new ReferenceDataEntryModel();

    authUser: UserModel;

    iconsList$: Observable<IconModel[]>;

    changeIcon: boolean = false;

    // duplicate validator
    codeDuplicateValidator$: Observable<boolean | IGeneralAsyncValidatorResponse>;

    /**
     * Constructor
     */
    constructor(
        protected route: ActivatedRoute,
        private referenceDataDataService: ReferenceDataDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private authDataService: AuthDataService,
        private iconDataService: IconDataService,
        private i18nService: I18nService,
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

        // icons data
        this.iconsList$ = this.iconDataService.getIconsList();

        // show loading
        this.showLoadingDialog(false);

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
                .checkCodeUniqueness(this.entry.code, this.entry.id)
                .subscribe((isValid: boolean | IGeneralAsyncValidatorResponse) => {
                    observer.next(isValid);
                    observer.complete();
                });
        });

        // get the route params
        this.route.params
            .subscribe((params: { categoryId, entryId }) => {
                this.categoryId = params.categoryId;
                this.entryId = params.entryId;

                // retrieve Reference Data Entry info
                this.referenceDataDataService
                    .getEntry(params.entryId, true)
                    .subscribe((entry: ReferenceDataEntryModel) => {
                        this.entry = entry;

                        // retrieve Reference Data Category info
                        this.referenceDataDataService
                            .getReferenceDataByCategory(this.categoryId)
                            .subscribe((category: ReferenceDataCategoryModel) => {
                                this.entry.category = category;

                                // update breadcrumbs
                                this.initializeBreadcrumbs();

                                // hide loading
                                this.hideLoadingDialog();
                            });
                    });
            });
    }

    /**
     * Initialize breadcrumbs
     */
    initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // add list breadcrumb only if we have permission
        if (ReferenceDataCategoryModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE', '/reference-data')
            );
        }

        if (this.entry) {
            // add new breadcrumb: Category page
            if (
                this.entry.category &&
                ReferenceDataEntryModel.canList(this.authUser)
            ) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel(
                        this.entry.category.name,
                        `/reference-data/${this.categoryId}`,
                        false,
                        {},
                        this.entry.category
                    )
                );
            }

            // add new breadcrumb: page title
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    this.entry.value,
                    '.',
                    true,
                    {},
                    this.entry
                )
            );
        }
    }

    /**
     * Modify ref data entry
     * @param form
     */
    modifyEntry(form: NgForm) {
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // show loading
        this.showLoadingDialog();

        // get selected outbreak
        this.referenceDataDataService
            .modifyEntry(
                this.entryId,
                dirtyFields,
                true
            )
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    // hide loading
                    this.hideLoadingDialog();
                    return throwError(err);
                }),
                switchMap((modifiedReferenceDataEntry) => {
                    // re-load language tokens
                    return this.i18nService.loadUserLanguage()
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);
                                // hide loading
                                this.hideLoadingDialog();
                                return throwError(err);
                            }),
                            map(() => modifiedReferenceDataEntry)
                        );
                })
            )
            .subscribe((modifiedReferenceDataEntry) => {
                // update model
                const category = this.entry.category;
                this.entry = modifiedReferenceDataEntry;
                this.entry.category = category;

                // mark form as pristine
                form.form.markAsPristine();

                // display message
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_REFERENCE_DATA_ENTRY_ACTION_MODIFY_ENTRY_SUCCESS_MESSAGE');

                // update breadcrumbs
                this.initializeBreadcrumbs();

                // hide loading
                this.hideLoadingDialog();
            });
    }
}
