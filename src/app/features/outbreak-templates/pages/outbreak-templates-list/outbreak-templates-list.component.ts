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
import { OutbreakTemplateModel } from '../../../../core/models/outbreak-template.model';
import { DialogAnswer, DialogAnswerButton } from '../../../../shared/components/dialog/dialog.component';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { OutbreakTemplateDataService } from '../../../../core/services/data/outbreak-template.data.service';
import { catchError, share, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { IBasicCount } from '../../../../core/models/basic-count.interface';

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

    // constants
    OutbreakTemplateModel = OutbreakTemplateModel;

    outbreakTemplatesList$: Observable<OutbreakTemplateModel[]>;
    outbreakTemplatesListCount$: Observable<IBasicCount>;

    diseasesList$: Observable<any[]>;

    authUser: UserModel;

    // constants
    UserSettings = UserSettings;
    ReferenceDataCategory = ReferenceDataCategory;

    recordActions: HoverRowAction[] = [
        // View Outbreak template
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_VIEW_OUTBREAK_TEMPLATE',
            click: (item: OutbreakTemplateModel) => {
                this.router.navigate(['/outbreak-templates', item.id, 'view']);
            },
            visible: (): boolean => {
                return OutbreakTemplateModel.canView(this.authUser);
            }
        }),

        // Modify Outbreak template
        new HoverRowAction({
            icon: 'settings',
            iconTooltip: 'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_MODIFY_OUTBREAK_TEMPLATE',
            click: (item: OutbreakTemplateModel) => {
                this.router.navigate(['/outbreak-templates', item.id, 'modify']);
            },
            visible: (): boolean => {
                return OutbreakTemplateModel.canModify(this.authUser);
            }
        }),

        // Create outbreak from outbreak template
        new HoverRowAction({
            icon: 'add',
            iconTooltip: 'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_GENERATE_OUTBREAK',
            click: (item: OutbreakTemplateModel) => {
                this.router.navigate(['/outbreaks', 'create'], {
                    queryParams: {
                        outbreakTemplateId: item.id
                    }
                });
            },
            visible: (): boolean => {
                return OutbreakTemplateModel.canGenerateOutbreak(this.authUser);
            }
        }),

        // Other actions
        new HoverRowAction({
            type: HoverRowActionType.MENU,
            icon: 'moreVertical',
            menuOptions: [
                // Delete Outbreak template
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_DELETE_OUTBREAK_TEMPLATE',
                    click: (item: OutbreakTemplateModel) => {
                        this.deleteOutbreakTemplate(item);
                    },
                    visible: (): boolean => {
                        return OutbreakTemplateModel.canDelete(this.authUser);
                    },
                    class: 'mat-menu-item-delete'
                }),

                // Divider
                new HoverRowAction({
                    type: HoverRowActionType.DIVIDER,
                    visible: (): boolean => {
                        // visible only if at least one of the previous...
                        return OutbreakTemplateModel.canDelete(this.authUser);
                    }
                }),

                // View Outbreak template case form
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_CASE_INVESTIGATION_QUESTIONNAIRE',
                    click: (item: OutbreakTemplateModel) => {
                        this.router.navigate(['/outbreak-templates', item.id, 'case-questionnaire']);
                    },
                    visible: (): boolean => {
                        return OutbreakTemplateModel.canModifyCaseQuestionnaire(this.authUser);
                    }
                }),

                // View Outbreak template contact follow-up form
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_CONTACT_FOLLOW_UP_QUESTIONNAIRE',
                    click: (item: OutbreakTemplateModel) => {
                        this.router.navigate(['/outbreak-templates', item.id, 'contact-follow-up-questionnaire']);
                    },
                    visible: (): boolean => {
                        return OutbreakTemplateModel.canModifyContactFollowUpQuestionnaire(this.authUser);
                    }
                }),

                // View Outbreak template case lab result form
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_CASE_LAB_RESULTS_QUESTIONNAIRE',
                    click: (item: OutbreakTemplateModel) => {
                        this.router.navigate(['/outbreak-templates', item.id, 'case-lab-results-questionnaire']);
                    },
                    visible: (): boolean => {
                        return OutbreakTemplateModel.canModifyCaseLabResultQuestionnaire(this.authUser);
                    }
                })
            ]
        })
    ];

    /**
     * Constructor
     */
    constructor(
        private router: Router,
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

    /**
     * Component initialization
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // get the lists for forms
        this.diseasesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.DISEASE);

        // initialize Side Table Columns
        this.initializeSideTableColumns();

        // initialize pagination
        this.initPaginator();

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
            })
        ];
    }


    /**
     * Re(load) the Outbreak Templates list
     */
    refreshList(finishCallback: (records: any[]) => void) {
        // retrieve the list of Events
        this.outbreakTemplatesList$ = this.outbreakTemplateDataService
            .getOutbreakTemplatesList(this.queryBuilder)
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    finishCallback([]);
                    return throwError(err);
                }),
                tap(this.checkEmptyList.bind(this)),
                tap((data: any[]) => {
                    finishCallback(data);
                })
            );
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {
        // remove paginator from query builder
        const countQueryBuilder = _.cloneDeep(this.queryBuilder);
        countQueryBuilder.paginator.clear();
        countQueryBuilder.sort.clear();
        this.outbreakTemplatesListCount$ = this.outbreakTemplateDataService
            .getOutbreakTemplatesCount(countQueryBuilder)
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    return throwError(err);
                }),
                share()
            );
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
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showError(err.message);
                                return throwError(err);
                            })
                        )
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
