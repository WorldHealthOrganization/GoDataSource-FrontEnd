import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { Observable } from 'rxjs/Observable';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import * as _ from 'lodash';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { OutbreakTemplateModel } from '../../../../core/models/outbreak-template.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { DialogAnswer, DialogAnswerButton } from '../../../../shared/components/dialog/dialog.component';
import { DialogService } from '../../../../core/services/helper/dialog.service';

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
    countriesList$: Observable<any[]>;
    activeOptionsList$: Observable<any[]>;

    selectedOutbreak: OutbreakModel;
    authUser: UserModel;

    ReferenceDataCategory = ReferenceDataCategory;
    UserSettings = UserSettings;

    constructor(
        protected snackbarService: SnackbarService,
        private outbreakDataService: OutbreakDataService,
        private authDataService: AuthDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private genericDataService: GenericDataService,
        private dialogService: DialogService
    ) {
        super(
            snackbarService
        );
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
        this.diseasesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.DISEASE);
        this.activeOptionsList$ = this.genericDataService.getFilterYesNoOptions();
        this.countriesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.COUNTRY).map(
            (countries) => _.map(countries, (country: LabelValuePair) => {
                country.value = {
                    id: country.value
                };
                return country;
            })
        );

        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak) => {
                this.selectedOutbreak = selectedOutbreak;
                if (this.selectedOutbreak) {
                    console.log('true');
                    // retrieve the list of Events
                    this.outbreakTemplatesList$ = this.outbreakDataService.getOutbreakTemplatesList();
                }
            });
        // initialize Side Table Columns
        this.initializeSideTableColumns();
        // refresh
        this.needsRefreshList(true);
    }

    /**
     * Initialize Side Table Columns
     */
    initializeSideTableColumns() {
        // default table columns
        this.tableColumns = [
            // new VisibleColumnModel({
            //     field: 'checkbox',
            //     required: true,
            //     excludeFromSave: true
            // }),
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
        if (this.selectedOutbreak) {
            console.log('true');
            // retrieve the list of Events
            this.outbreakTemplatesList$ = this.outbreakDataService.getOutbreakTemplatesList();
        }
    }

    /**
     * Check if we have write access to outbreaks
     * @returns {boolean}
     */
    hasOutbreakWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_OUTBREAK);
    }

    /**
     * Delete an outbreak template
     * @param {OutbreakTemplateModel} outbreakTemplate
     */
    deleteOutbreakTemplate(outbreakTemplate: OutbreakTemplateModel) {
        this.dialogService.showConfirm('delete the outbreak template?', outbreakTemplate)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.outbreakDataService
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
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_OUTBREAKS_ACTION_DELETE_SUCCESS_MESSAGE');
                            this.needsRefreshList(true);
                        });
                }
            });
    }
}
