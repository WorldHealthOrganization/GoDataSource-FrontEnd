import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable, Subscription } from 'rxjs';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { CaseModel } from '../../../../core/models/case.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswer, DialogAnswerButton, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Constants } from '../../../../core/models/constants';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { catchError, share, tap } from 'rxjs/operators';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { throwError } from 'rxjs/internal/observable/throwError';
import * as _ from 'lodash';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';

@Component({
    selector: 'app-cases-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './marked-not-duplicates-list.component.html',
    styleUrls: ['./marked-not-duplicates-list.component.less']
})
export class MarkedNotDuplicatesListComponent
    extends ListComponent
    implements OnInit, OnDestroy {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_MARKED_AS_NOT_DUPLICATES_TITLE', '.', true)
    ];

    // authenticated user
    authUser: UserModel;

    // selected Outbreak
    selectedOutbreak: OutbreakModel;

    // list of not duplicates
    recordId: string;
    recordType: EntityType;
    notDuplicatesList$: Observable<(CaseModel | ContactModel | EventModel)[]>;
    notDuplicatesListCount$: Observable<IBasicCount>;

    // obs
    genderList$: Observable<any[]>;

    // provide constants to template
    Constants = Constants;
    UserSettings = UserSettings;

    // subscribers
    outbreakSubscriber: Subscription;

    // actions
    recordActions: HoverRowAction[] = [
        // View Entity
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_MARKED_AS_NOT_DUPLICATES_ACTION_VIEW_ENTITY',
            click: (item: CaseModel | ContactModel) => {
                this.router.navigate([
                    `/${EntityModel.getLinkForEntityType(item.type)}`,
                    item.id,
                    'view'
                ]);
            },
            visible: (item: CaseModel | ContactModel): boolean => {
                return !item.deleted &&
                    item.canView(this.authUser);
            }
        }),

        // Modify Case
        new HoverRowAction({
            icon: 'settings',
            iconTooltip: 'LNG_PAGE_LIST_MARKED_AS_NOT_DUPLICATES_ACTION_MODIFY_ENTITY',
            click: (item: CaseModel | ContactModel) => {
                this.router.navigate([
                    `/${EntityModel.getLinkForEntityType(item.type)}`,
                    item.id,
                    'modify'
                ]);
            },
            visible: (item: CaseModel | ContactModel): boolean => {
                return !item.deleted &&
                    this.authUser &&
                    this.selectedOutbreak &&
                    this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                    item.canModify(this.authUser);
            }
        }),

        // Other actions
        new HoverRowAction({
            type: HoverRowActionType.MENU,
            icon: 'moreVertical',
            menuOptions: [
                // Delete Case
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_MARKED_AS_NOT_DUPLICATES_ACTION_REMOVE_FROM_LIST_ENTITY',
                    click: (item: CaseModel | ContactModel) => {
                        this.removeFromList(item);
                    },
                    visible: (item: CaseModel | ContactModel): boolean => {
                        return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            item.canModify(this.authUser);
                    },
                    class: 'mat-menu-item-delete'
                })
            ]
        })
    ];

    /**
     * Constructor
     */
    constructor(
        private authDataService: AuthDataService,
        protected snackbarService: SnackbarService,
        private outbreakDataService: OutbreakDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private route: ActivatedRoute,
        private entityDataService: EntityDataService,
        private router: Router,
        private dialogService: DialogService
    ) {
        super(
            snackbarService
        );
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // reference data
        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER).pipe(share());

        // retrieve case / contact id
        this.route.params
            .subscribe((params: {
                contactId?: string,
                caseId?: string
            }) => {
                if (params.caseId) {
                    this.recordId = params.caseId;
                    this.recordType = EntityType.CASE;
                } else if (params.contactId) {
                    this.recordId = params.contactId;
                    this.recordType = EntityType.CONTACT;
                }
            });

        // subscribe to the Selected Outbreak Subject stream
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // initialize pagination
                this.initPaginator();

                // ...and re-load the list when the Selected Outbreak is changed
                this.needsRefreshList(true);
            });

        // initialize Side Table Columns
        this.initializeSideTableColumns();
    }

    /**
     * Component destroyed
     */
    ngOnDestroy() {
        // outbreak subscriber
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }

        // release resources
        super.ngOnDestroy();
    }

    /**
     * Initialize Side Table Columns
     */
    initializeSideTableColumns() {
        // default table columns
        this.tableColumns = [
            new VisibleColumnModel({
                field: 'lastName',
                label: 'LNG_ENTITY_FIELD_LABEL_LAST_NAME'
            }),
            new VisibleColumnModel({
                field: 'firstName',
                label: 'LNG_ENTITY_FIELD_LABEL_FIRST_NAME'
            }),
            new VisibleColumnModel({
                field: 'visualId',
                label: 'LNG_ENTITY_FIELD_LABEL_VISUAL_ID'
            }),
            new VisibleColumnModel({
                field: 'age',
                label: 'LNG_ENTITY_FIELD_LABEL_AGE'
            }),
            new VisibleColumnModel({
                field: 'gender',
                label: 'LNG_ENTITY_FIELD_LABEL_GENDER'
            }),
            new VisibleColumnModel({
                field: 'phoneNumber',
                label: 'LNG_ENTITY_FIELD_LABEL_PHONE_NUMBER'
            })
        ];
    }

    /**
     * Re(load) the Cases list, based on the applied filter, sort criterias
     */
    refreshList(finishCallback: (records: any[]) => void) {
        if (this.selectedOutbreak) {
            // retrieve the list of Cases
            this.notDuplicatesList$ = this.entityDataService
                .getEntitiesMarkedAsNotDuplicates(
                    this.selectedOutbreak.id,
                    this.recordType,
                    this.recordId,
                    this.queryBuilder
                )
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
        } else {
            finishCallback([]);
        }
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {
        if (this.selectedOutbreak) {
            // remove paginator from query builder
            const countQueryBuilder = _.cloneDeep(this.queryBuilder);
            countQueryBuilder.paginator.clear();
            countQueryBuilder.sort.clear();
            this.notDuplicatesListCount$ = this.entityDataService
                .getEntitiesMarkedAsNotDuplicatesCount(
                    this.selectedOutbreak.id,
                    this.recordType,
                    this.recordId,
                    countQueryBuilder
                )
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);
                        return throwError(err);
                    }),
                    share()
                );
        }
    }

    /**
     * Remove from list of not duplicate items
     */
    removeFromList(item: CaseModel | ContactModel) {
        if (this.selectedOutbreak) {
            this.dialogService
                .showConfirm('LNG_PAGE_LIST_MARKED_AS_NOT_DUPLICATES_ACTION_REMOVE_FROM_LIST_ENTITY_CONFIRMATION')
                .subscribe((answer: DialogAnswer) => {
                    if (answer.button === DialogAnswerButton.Yes) {
                        const loadingDialog = this.dialogService.showLoadingDialog();
                        this.entityDataService
                            .markPersonAsOrNotADuplicate(
                                this.selectedOutbreak.id,
                                this.recordType,
                                this.recordId,
                                [],
                                [item.id]
                            )
                            .pipe(
                                catchError((err) => {
                                    this.snackbarService.showApiError(err);
                                    loadingDialog.close();
                                    return throwError(err);
                                })
                            )
                            .subscribe(() => {
                                // refresh list of items
                                this.needsRefreshList(true);

                                // close loading dialog
                                loadingDialog.close();
                            });
                    }
                });
        }
    }
}
