import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ReferenceDataCategoryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { HoverRowAction, LoadingDialogModel } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { catchError, tap } from 'rxjs/operators';
import { moment } from '../../../../core/helperClasses/x-moment';
import { throwError } from 'rxjs/internal/observable/throwError';

@Component({
    selector: 'app-reference-data-categories-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './reference-data-categories-list.component.html',
    styleUrls: ['./reference-data-categories-list.component.less']
})
export class ReferenceDataCategoriesListComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE', '..', true)
    ];

    // authenticated user
    authUser: UserModel;

    // list of entries grouped by category
    referenceData$: Observable<ReferenceDataCategoryModel[]>;

    referenceDataExporFileName: string = moment().format('YYYY-MM-DD');

    loadingDialog: LoadingDialogModel;

    fixedTableColumns: string[] = [
        'categoryName',
        'entries'
    ];

    recordActions: HoverRowAction[] = [
        // View Items
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_ACTION_VIEW_CATEGORY',
            click: (item: ReferenceDataCategoryModel) => {
                this.router.navigate(['/reference-data', item.id]);
            }
        })
    ];

    constructor(
        private router: Router,
        private referenceDataDataService: ReferenceDataDataService,
        private authDataService: AuthDataService,
        private i18nService: I18nService,
        private dialogService: DialogService,
        protected snackbarService: SnackbarService
    ) {
        super(snackbarService);

        this.needsRefreshList(true);

        // add page title
        this.referenceDataExporFileName = this.i18nService.instant('LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE') +
            ' - ' +
            this.referenceDataExporFileName;
    }

    /**
     * Component Initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
    }

    /**
     * Re(load) the Reference Data Categories list
     */
    refreshList(finishCallback: (records: any[]) => void) {
        // load reference data
        this.referenceData$ = this.referenceDataDataService
            .getReferenceData()
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    finishCallback([]);
                    return throwError(err);
                }),
                tap((data: any[]) => {
                    finishCallback(data);
                })
            );
    }

    /**
     * Check if we have write access to reference data
     * @returns {boolean}
     */
    hasReferenceDataWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_REFERENCE_DATA);
    }

    /**
     * Display loading dialog
     */
    showLoadingDialog() {
        this.loadingDialog = this.dialogService.showLoadingDialog();
    }
    /**
     * Hide loading dialog
     */
    closeLoadingDialog() {
        if (this.loadingDialog) {
            this.loadingDialog.close();
            this.loadingDialog = null;
        }
    }
}
