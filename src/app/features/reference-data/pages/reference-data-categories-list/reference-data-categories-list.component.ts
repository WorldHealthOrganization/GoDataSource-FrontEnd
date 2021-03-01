import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Observable } from 'rxjs';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { HoverRowAction, LoadingDialogModel } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { catchError, tap } from 'rxjs/operators';
import { moment } from '../../../../core/helperClasses/x-moment';
import { throwError } from 'rxjs/internal/observable/throwError';
import { IconModel } from '../../../../core/models/icon.model';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';

@Component({
    selector: 'app-reference-data-categories-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './reference-data-categories-list.component.html',
    styleUrls: ['./reference-data-categories-list.component.less']
})
export class ReferenceDataCategoriesListComponent extends ListComponent implements OnInit, OnDestroy {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE', '..', true)
    ];

    // authenticated user
    authUser: UserModel;

    // constants
    ReferenceDataCategoryModel = ReferenceDataCategoryModel;
    IconModel = IconModel;

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
            linkGenerator: (item: ReferenceDataCategoryModel): string[] => {
                return ['/reference-data', item.id];
            },
            visible: (item: ReferenceDataCategoryModel): boolean => {
                return ReferenceDataEntryModel.canList(this.authUser);
            }
        })
    ];

    /**
     * Constructor
     */
    constructor(
        protected listHelperService: ListHelperService,
        private referenceDataDataService: ReferenceDataDataService,
        private authDataService: AuthDataService,
        private i18nService: I18nService,
        private dialogService: DialogService,
        private snackbarService: SnackbarService
    ) {
        super(listHelperService);
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.needsRefreshList(true);

        // add page title
        this.referenceDataExporFileName = this.i18nService.instant('LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE') +
            ' - ' +
            this.referenceDataExporFileName;
    }

    /**
     * Release resources
     */
    ngOnDestroy() {
        // release parent resources
        super.ngOnDestroy();
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
