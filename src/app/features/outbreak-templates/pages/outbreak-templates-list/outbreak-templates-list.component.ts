import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { Observable } from 'rxjs';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { OutbreakTemplateModel } from '../../../../core/models/outbreak-template.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { DialogAnswer, DialogAnswerButton } from '../../../../shared/components/dialog/dialog.component';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { OutbreakTemplateDataService } from '../../../../core/services/data/outbreak-template.data.service';
import { tap } from 'rxjs/operators';

@Component({
    selector: 'app-outbreak-templates-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './outbreak-templates-list.component.html',
    styleUrls: ['./outbreak-templates-list.component.less']
})
export class OutbreakTemplatesListComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_OUTBREAK_TEMPLATES_TITLE', '.', true)
    ];

    outbreakTemplatesList$: Observable<any>;

    diseasesList$: Observable<any[]>;

    authUser: UserModel;

    // constants
    UserSettings = UserSettings;
    ReferenceDataCategory = ReferenceDataCategory;

    constructor(
        protected snackbarService: SnackbarService,
        private authDataService: AuthDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private dialogService: DialogService,
        private outbreakTemplateDataService: OutbreakTemplateDataService
    ) {
        super(
            snackbarService
        );
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // get the lists for forms
        this.diseasesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.DISEASE);

        // initialize Side Table Columns
        this.initializeSideTableColumns();

        // ...and re-load the list when the Selected Outbreak is changed
        this.needsRefreshList(true);
    }

    /**
     * Initialize Side Table Columns
     */
    initializeSideTableColumns() {
        // default table columns
        this.tableColumns = [
            new VisibleColumnModel({
                field: 'name',
                label: 'LNG_OUTBREAK_FIELD_LABEL_NAME'
            }),
            new VisibleColumnModel({
                field: 'disease',
                label: 'LNG_OUTBREAK_FIELD_LABEL_DISEASE'
            }),
            new VisibleColumnModel({
                field: 'actions',
                required: true,
                excludeFromSave: true
            })
        ];
    }


    /**
     * Re(load) the Outbreak Templates list
     */
    refreshList() {
        // retrieve the list of Events
        this.outbreakTemplatesList$ = this.outbreakTemplateDataService.getOutbreakTemplatesList(this.queryBuilder)
            .pipe(tap(this.checkEmptyList.bind(this)));
    }

    /**
     * Check if we have write access to outbreak templates
     * @returns {boolean}
     */
    hasOutbreakTemplateWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_SYS_CONFIG);
    }

    /**
     * Check if we have write access to outbreaks
     */
    hasOutbreakWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_OUTBREAK);
    }

    /**
     * Delete an outbreak template
     * @param {OutbreakTemplateModel} outbreakTemplate
     */
    deleteOutbreakTemplate(outbreakTemplate: OutbreakTemplateModel) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_OUTBREAK_TEMPLATE', outbreakTemplate)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.outbreakTemplateDataService
                        .deleteOutbreakTemplate(outbreakTemplate.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);
                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            // reload user data to get the updated data regarding active outbreak
                            this.authDataService
                                .reloadAndPersistAuthUser()
                                .subscribe((authenticatedUser) => {
                                    this.authUser = authenticatedUser.user;
                                });
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_DELETE_SUCCESS_MESSAGE');
                            this.needsRefreshList(true);
                        });
                }
            });
    }
}
