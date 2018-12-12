import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { NgForm } from '@angular/forms';
import * as _ from 'lodash';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { Observable } from 'rxjs/Observable';
import { IconModel } from '../../../../core/models/icon.model';
import { IconDataService } from '../../../../core/services/data/icon.data.service';
import 'rxjs/add/operator/switchMap';
import { I18nService } from '../../../../core/services/helper/i18n.service';

@Component({
    selector: 'app-modify-reference-data-entry',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-reference-data-entry.component.html',
    styleUrls: ['./modify-reference-data-entry.component.less']
})
export class ModifyReferenceDataEntryComponent extends ViewModifyComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [];

    categoryId: string;
    entryId: string;
    // new Entry model
    entry: ReferenceDataEntryModel = new ReferenceDataEntryModel();
    categoryName: string;

    authUser: UserModel;

    iconsList$: Observable<IconModel[]>;

    changeIcon: boolean = false;

    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        private referenceDataDataService: ReferenceDataDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private authDataService: AuthDataService,
        private iconDataService: IconDataService,
        private i18nService: I18nService
    ) {
        super(route);
    }

    ngOnInit() {
        // icons data
        this.iconsList$ = this.iconDataService.getIconsList();

        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // get the route params
        this.route.params
            .subscribe((params: { categoryId, entryId }) => {
                this.categoryId = params.categoryId;
                this.entryId = params.entryId;

                // retrieve Reference Data Entry info
                this.referenceDataDataService
                    .getEntry(params.entryId)
                    .subscribe((entry: ReferenceDataEntryModel) => {
                        this.entry = entry;
                        this.categoryName = _.get(this.entry, 'category.name');
                        this.createBreadcrumbs();
                    });
            });
    }

    modifyEntry(form: NgForm) {

        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // get selected outbreak
        this.referenceDataDataService
            .modifyEntry(this.entryId, dirtyFields)
            .catch((err) => {
                this.snackbarService.showError(err.message);
                return ErrorObservable.create(err);
            })
            .switchMap((modifiedReferenceDataEntry) => {
                // re-load language tokens
                return this.i18nService.loadUserLanguage()
                    .map(() => modifiedReferenceDataEntry);
            })
            .subscribe((modifiedReferenceDataEntry) => {
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_REFERENCE_DATA_ENTRY_ACTION_MODIFY_ENTRY_SUCCESS_MESSAGE');

                this.entry = new ReferenceDataEntryModel(modifiedReferenceDataEntry);

                // update breadcrumbs
                this.createBreadcrumbs();
            });
    }

    /**
     * Check if we have access to modify reference data
     * @returns {boolean}
     */
    hasReferenceDataWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_FOLLOWUP);
    }

    /**
     * Create breadcrumbs
     */
    createBreadcrumbs() {
        this.breadcrumbs = [];
        this.route.params
            .subscribe((params: { categoryId, entryId }) => {
                this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE', '/reference-data'));

                if (this.categoryName) {
                    this.breadcrumbs.push(new BreadcrumbItemModel(this.categoryName, `/reference-data/${params.categoryId}`));
                }

                this.breadcrumbs.push(new BreadcrumbItemModel(this.entry.value, '.', true));
            });
    }

}
