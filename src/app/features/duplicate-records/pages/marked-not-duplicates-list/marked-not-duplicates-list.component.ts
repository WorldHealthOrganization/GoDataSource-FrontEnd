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
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { throwError } from 'rxjs/internal/observable/throwError';
import * as _ from 'lodash';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { ContactsOfContactsDataService } from '../../../../core/services/data/contacts-of-contacts.data.service';

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
    breadcrumbs: BreadcrumbItemModel[] = [];

    // authenticated user
    authUser: UserModel;

    // selected Outbreak
    selectedOutbreak: OutbreakModel;

    // list of not duplicates
    recordId: string;
    recordType: EntityType;
    recordData: CaseModel | ContactModel | ContactOfContactModel;
    notDuplicatesList$: Observable<(CaseModel | ContactModel | ContactOfContactModel)[]>;
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
            click: (item: CaseModel | ContactModel | ContactOfContactModel) => {
                this.router.navigate([
                    `/${EntityModel.getLinkForEntityType(item.type)}`,
                    item.id,
                    'view'
                ]);
            },
            visible: (item: CaseModel | ContactModel | ContactOfContactModel): boolean => {
                return !item.deleted &&
                    item.canView(this.authUser);
            }
        }),

        // Modify Case
        new HoverRowAction({
            icon: 'settings',
            iconTooltip: 'LNG_PAGE_LIST_MARKED_AS_NOT_DUPLICATES_ACTION_MODIFY_ENTITY',
            click: (item: CaseModel | ContactModel | ContactOfContactModel) => {
                this.router.navigate([
                    `/${EntityModel.getLinkForEntityType(item.type)}`,
                    item.id,
                    'modify'
                ]);
            },
            visible: (item: CaseModel | ContactModel | ContactOfContactModel): boolean => {
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
                    click: (item: CaseModel | ContactModel | ContactOfContactModel) => {
                        this.removeFromList(item);
                    },
                    visible: (item: CaseModel | ContactModel | ContactOfContactModel): boolean => {
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
        protected listHelperService: ListHelperService,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService,
        private outbreakDataService: OutbreakDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private route: ActivatedRoute,
        private entityDataService: EntityDataService,
        private router: Router,
        private dialogService: DialogService,
        private caseDataService: CaseDataService,
        private contactDataService: ContactDataService,
        private contactOfContactDataService: ContactsOfContactsDataService
    ) {
        super(listHelperService);
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
                caseId?: string,
                contactOfContactId?: string
            }) => {
                // params set
                if (params.caseId) {
                    this.recordId = params.caseId;
                    this.recordType = EntityType.CASE;
                } else if (params.contactId) {
                    this.recordId = params.contactId;
                    this.recordType = EntityType.CONTACT;
                } else if (params.contactOfContactId) {
                    this.recordId = params.contactOfContactId;
                    this.recordType = EntityType.CONTACT_OF_CONTACT;
                }

                // retrieve case / contact data
                this.getCaseContactData();
            });

        // subscribe to the Selected Outbreak Subject stream
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // retrieve case / contact data
                this.getCaseContactData();

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
        // release parent resources
        super.ngOnDestroy();

        // outbreak subscriber
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }
    }

    /**
     * Initialize breadcrumbs
     */
    initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // add list / view / modify record breadcrumbs
        if (this.recordType === EntityType.CASE) {
            // list
            if (CaseModel.canList(this.authUser)) {
                this.breadcrumbs.push(new BreadcrumbItemModel(
                    'LNG_PAGE_LIST_CASES_TITLE',
                    '/cases'
                ));
            }

            // view / modify
            if (this.recordData) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel(
                        CaseModel.canModify(this.authUser) ? 'LNG_PAGE_MODIFY_CASE_TITLE' : 'LNG_PAGE_VIEW_CASE_TITLE',
                        `/cases/${this.recordId}/${CaseModel.canModify(this.authUser) ? 'modify' : 'view'}`,
                        false,
                        {},
                        this.recordData
                    )
                );
            }
        } else if (this.recordType === EntityType.CONTACT) {
            // list
            if (ContactModel.canList(this.authUser)) {
                this.breadcrumbs.push(new BreadcrumbItemModel(
                    'LNG_PAGE_LIST_CONTACTS_TITLE',
                    '/contacts'
                ));
            }

            // view / modify
            if (this.recordData) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel(
                        ContactModel.canModify(this.authUser) ? 'LNG_PAGE_MODIFY_CONTACT_TITLE' : 'LNG_PAGE_VIEW_CONTACT_TITLE',
                        `/contacts/${this.recordId}/${ContactModel.canModify(this.authUser) ? 'modify' : 'view'}`,
                        false,
                        {},
                        this.recordData
                    )
                );
            }
        } else if (this.recordType === EntityType.CONTACT_OF_CONTACT) {
            // list
            if (ContactOfContactModel.canList(this.authUser)) {
                this.breadcrumbs.push(new BreadcrumbItemModel(
                    'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE',
                    '/contacts-of-contacts'
                ));
            }

            // view / modify
            if (this.recordData) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel(
                        ContactOfContactModel.canModify(this.authUser) ? 'LNG_PAGE_MODIFY_CONTACT_OF_CONTACT_TITLE' : 'LNG_PAGE_VIEW_CONTACT_OF_CONTACT_TITLE',
                        `/contacts-of-contacts/${this.recordId}/${ContactOfContactModel.canModify(this.authUser) ? 'modify' : 'view'}`,
                        false,
                        {},
                        this.recordData
                    )
                );
            }
        }

        // add main breadcrumb
        this.breadcrumbs.push(new BreadcrumbItemModel(
            'LNG_PAGE_LIST_MARKED_AS_NOT_DUPLICATES_TITLE',
            '.',
            true
        ));
    }

    /**
     * Retrieve case / contact data
     */
    getCaseContactData() {
        // do we have contact type and outbreak data ?
        if (
            !this.recordType ||
            !this.selectedOutbreak ||
            !this.selectedOutbreak.id
        ) {
            return;
        }

        // construct case / contact observer to retrieve data
        let observer$: Observable<CaseModel | ContactModel | ContactOfContactModel>;
        switch (this.recordType) {
            case EntityType.CASE:
                observer$ = this.caseDataService.getCase(
                    this.selectedOutbreak.id,
                    this.recordId
                );
                break;
            case EntityType.CONTACT:
                observer$ = this.contactDataService.getContact(
                    this.selectedOutbreak.id,
                    this.recordId
                );
                break;
            case EntityType.CONTACT_OF_CONTACT:
                observer$ = this.contactOfContactDataService.getContactOfContact(
                    this.selectedOutbreak.id,
                    this.recordId
                );
                break;
        }

        // get case / contact data
        observer$.subscribe((recordData) => {
            // set data
            this.recordData = recordData;

            // update breadcrumbs
            this.initializeBreadcrumbs();
        });
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
    removeFromList(item: CaseModel | ContactModel | ContactOfContactModel) {
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
