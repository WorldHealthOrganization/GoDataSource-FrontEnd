import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { NgForm, NgModel } from '@angular/forms';
import { Observable, throwError } from 'rxjs';
import { ContactModel } from '../../../../core/models/contact.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ActivatedRoute, Router } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { EntityDuplicatesModel } from '../../../../core/models/entity-duplicates.model';
import { DialogAnswerButton, DialogConfiguration, DialogField, DialogFieldType } from '../../../../shared/components';
import * as _ from 'lodash';
import { EntityModel, RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { RelationshipPersonModel } from '../../../../core/models/relationship-person.model';
import { catchError } from 'rxjs/operators';
import { moment, Moment } from '../../../../core/helperClasses/x-moment';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { EventModel } from '../../../../core/models/event.model';
import { CaseModel } from '../../../../core/models/case.model';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { EntityDataService } from 'app/core/services/data/entity.data.service';
import { Constants } from '../../../../core/models/constants';
import { TeamModel } from '../../../../core/models/team.model';
import { TeamDataService } from '../../../../core/services/data/team.data.service';

@Component({
    selector: 'app-modify-contact',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-contact.component.html',
    styleUrls: ['./modify-contact.component.less']
})
export class ModifyContactComponent extends ViewModifyComponent implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // authenticated user
    authUser: UserModel;

    // constants
    ContactModel = ContactModel;
    FollowUpModel = FollowUpModel;
    RelationshipModel = RelationshipModel;
    LabResultModel = LabResultModel;
    TeamModel = TeamModel;

    contactId: string;
    selectedOutbreak: OutbreakModel;
    contactExposure: RelationshipPersonModel;

    contactData: ContactModel = new ContactModel();

    genderList$: Observable<any[]>;
    riskLevelsList$: Observable<any[]>;
    occupationsList$: Observable<any[]>;
    finalFollowUpStatus$: Observable<any[]>;
    pregnancyStatusList$: Observable<any[]>;
    teamList$: Observable<TeamModel[]>;

    // provide constants to template
    EntityType = EntityType;
    EntityModel = EntityModel;

    serverToday: Moment = moment();

    visualIDTranslateData: {
        mask: string
    };

    contactIdMaskValidator: Observable<boolean>;

    displayRefresh: boolean = false;
    @ViewChild('visualId') visualId: NgModel;

    /**
     * Constructor
     */
    constructor(
        private referenceDataDataService: ReferenceDataDataService,
        protected route: ActivatedRoute,
        private authDataService: AuthDataService,
        private outbreakDataService: OutbreakDataService,
        private contactDataService: ContactDataService,
        private formHelper: FormHelperService,
        private snackbarService: SnackbarService,
        private router: Router,
        protected dialogService: DialogService,
        private i18nService: I18nService,
        private relationshipDataService: RelationshipDataService,
        private entityDataService: EntityDataService,
        private teamDataService: TeamDataService
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

        // reference data
        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER);
        this.riskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL);
        this.occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION);
        this.finalFollowUpStatus$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTACT_FINAL_FOLLOW_UP_STATUS);
        this.pregnancyStatusList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.PREGNANCY_STATUS);

        // get teams only if we're allowed to
        if (TeamModel.canList(this.authUser)) {
            this.teamList$ = this.teamDataService.getTeamsListReduced();
        }

        // show loading
        this.showLoadingDialog(false);

        this.route.params
            .subscribe((params: {contactId}) => {
                this.contactId = params.contactId;

                // get current outbreak
                this.outbreakDataService
                    .getSelectedOutbreak()
                    .subscribe((selectedOutbreak: OutbreakModel) => {
                        this.selectedOutbreak = selectedOutbreak;
                        if (!_.isEmpty(this.selectedOutbreak.contactIdMask)) {
                            this.displayRefresh = true;
                        }
                        // get contact
                        this.retrieveContactData();

                        // get contact's exposure
                        this.retrieveContactExposure();
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
        if (ContactModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts')
            );
        }

        // view / modify breadcrumb
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                this.viewOnly ?
                    'LNG_PAGE_VIEW_CONTACT_TITLE' :
                    'LNG_PAGE_MODIFY_CONTACT_TITLE',
                '.',
                true,
                {},
                this.contactData
            )
        );
    }

    /**
     * Retrieve contact information
     */
    private retrieveContactData() {
        if (
            this.selectedOutbreak &&
            this.selectedOutbreak.id &&
            this.contactId
        ) {
            // show loading
            this.showLoadingDialog(false);

            this.contactDataService
                .getContact(this.selectedOutbreak.id, this.contactId, true)
                .subscribe(contactDataReturned => {
                    this.contactData = new ContactModel(contactDataReturned);

                    // set visual ID translate data
                    this.visualIDTranslateData = {
                        mask: ContactModel.generateContactIDMask(this.selectedOutbreak.contactIdMask)
                    };

                    // set visual ID validator
                    this.contactIdMaskValidator = new Observable((observer) => {
                        this.contactDataService.checkContactVisualIDValidity(
                            this.selectedOutbreak.id,
                            this.visualIDTranslateData.mask,
                            this.contactData.visualId,
                            this.contactData.id
                        ).subscribe((isValid: boolean) => {
                            observer.next(isValid);
                            observer.complete();
                        });
                    });

                    // update breadcrumb
                    this.initializeBreadcrumbs();

                    // hide loading
                    this.hideLoadingDialog();
                });
        }
    }

    /**
     * Retrieve Contact's exposure: the Case or the Event that the Contact is related to
     * Note: If there are more than one relationships, then we don't know the main Exposure so we do nothing here
     */
    private retrieveContactExposure() {
        if (
            this.selectedOutbreak &&
            this.selectedOutbreak.id &&
            this.contactId
        ) {
            const qb = new RequestQueryBuilder();
            qb.limit(2);
            this.relationshipDataService
                .getEntityRelationships(
                    this.selectedOutbreak.id,
                    EntityType.CONTACT,
                    this.contactId,
                    qb
                )
                .subscribe((relationships) => {
                    if (relationships.length === 1) {
                        // we found the exposure
                        this.contactExposure = new RelationshipPersonModel(
                            _.find(relationships[0].persons, (person) => person.id !== this.contactId)
                        );
                    }
                });
        }
    }

    /**
     * Modify contact
     */
    modifyContact(form: NgForm) {
        // validate form
        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // retrieve dirty fields
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        // add age & dob information
        if (dirtyFields.ageDob) {
            dirtyFields.age = dirtyFields.ageDob.age;
            dirtyFields.dob = dirtyFields.ageDob.dob;
            delete dirtyFields.ageDob;
        }

        // show loading
        this.showLoadingDialog();

        // check for duplicates
        this.contactDataService
            .findDuplicates(this.selectedOutbreak.id, {
                ...this.contactData,
                ...dirtyFields
            })
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);

                    // hide loading
                    this.hideLoadingDialog();

                    return throwError(err);
                })
            )
            .subscribe((contactDuplicates: EntityDuplicatesModel) => {
                // items marked as not duplicates
                let itemsMarkedAsNotDuplicates: string[] = [];

                // modify Contact
                const runModifyContact = (finishCallBack?: () => void) => {
                    // modify the contact
                    this.contactDataService
                        .modifyContact(
                            this.selectedOutbreak.id,
                            this.contactId,
                            dirtyFields,
                            true
                        )
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);
                                // hide loading
                                this.hideLoadingDialog();
                                return throwError(err);
                            })
                        )
                        .subscribe((modifiedContact: ContactModel) => {
                            // called when we finished updating contact data
                            const finishedUpdatingContact = () => {
                                // update model
                                this.contactData = modifiedContact;

                                // mark form as pristine
                                form.form.markAsPristine();

                                // display message
                                if (!finishCallBack) {
                                    this.snackbarService.showSuccess('LNG_PAGE_MODIFY_CONTACT_ACTION_MODIFY_CONTACT_SUCCESS_MESSAGE');

                                    // update breadcrumb
                                    this.initializeBreadcrumbs();

                                    // hide loading
                                    this.hideLoadingDialog();
                                } else {
                                    // finished
                                    finishCallBack();
                                }
                            };

                            // there are no records marked as NOT duplicates ?
                            if (
                                !itemsMarkedAsNotDuplicates ||
                                itemsMarkedAsNotDuplicates.length < 1
                            ) {
                                finishedUpdatingContact();
                            } else {
                                // mark records as not duplicates
                                this.entityDataService
                                    .markPersonAsOrNotADuplicate(
                                        this.selectedOutbreak.id,
                                        EntityType.CONTACT,
                                        this.contactId,
                                        itemsMarkedAsNotDuplicates
                                    )
                                    .pipe(
                                        catchError((err) => {
                                            this.snackbarService.showApiError(err);

                                            // hide loading
                                            this.hideLoadingDialog();

                                            return throwError(err);
                                        })
                                    )
                                    .subscribe(() => {
                                        // finished
                                        finishedUpdatingContact();
                                    });
                            }
                        });
                };

                // do we have duplicates ?
                if (contactDuplicates.duplicates.length > 0) {
                    // construct list of items from which we can choose actions
                    const fieldsList: DialogField[] = [];
                    const fieldsListLayout: number[] = [];
                    contactDuplicates.duplicates.forEach((duplicate: EntityModel, index: number) => {
                        // contact model
                        const contactData: ContactModel = duplicate.model as ContactModel;

                        // add row fields
                        fieldsListLayout.push(60, 40);
                        fieldsList.push(
                            new DialogField({
                                name: `actions[${contactData.id}].label`,
                                placeholder: (index + 1) + '. ' + EntityModel.getNameWithDOBAge(
                                    contactData,
                                    this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
                                    this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
                                ),
                                fieldType: DialogFieldType.LINK,
                                routerLink: ['/contacts', contactData.id, 'view'],
                                linkTarget: '_blank'
                            }),
                            new DialogField({
                                name: `actions[${contactData.id}].action`,
                                placeholder: 'LNG_DUPLICATES_DIALOG_ACTION',
                                description: 'LNG_DUPLICATES_DIALOG_ACTION_DESCRIPTION',
                                inputOptions: [
                                    new LabelValuePair(
                                        Constants.DUPLICATE_ACTION.NO_ACTION,
                                        Constants.DUPLICATE_ACTION.NO_ACTION
                                    ),
                                    new LabelValuePair(
                                        Constants.DUPLICATE_ACTION.NOT_A_DUPLICATE,
                                        Constants.DUPLICATE_ACTION.NOT_A_DUPLICATE
                                    ),
                                    new LabelValuePair(
                                        Constants.DUPLICATE_ACTION.MERGE,
                                        Constants.DUPLICATE_ACTION.MERGE
                                    )
                                ],
                                inputOptionsClearable: false,
                                required: true,
                                value: Constants.DUPLICATE_ACTION.NO_ACTION
                            })
                        );
                    });

                    // display dialog
                    this.dialogService.showConfirm(new DialogConfiguration({
                        message: 'LNG_PAGE_MODIFY_CONTACT_DUPLICATES_DIALOG_CONFIRM_MSG',
                        yesLabel: 'LNG_COMMON_BUTTON_SAVE',
                        customInput: true,
                        fieldsListLayout: fieldsListLayout,
                        fieldsList: fieldsList
                    })).subscribe((answer) => {
                        if (answer.button === DialogAnswerButton.Yes) {
                            // determine number of items to merge / mark as not duplicates
                            const itemsToMerge: string[] = [];
                            itemsMarkedAsNotDuplicates = [];
                            const actions: {
                                [id: string]: {
                                    action: string
                                }
                            } = _.get(answer, 'inputValue.value.actions', {});
                            if (!_.isEmpty(actions)) {
                                _.each(actions, (data, id) => {
                                    switch (data.action) {
                                        case Constants.DUPLICATE_ACTION.NOT_A_DUPLICATE:
                                            itemsMarkedAsNotDuplicates.push(id);
                                            break;
                                        case Constants.DUPLICATE_ACTION.MERGE:
                                            itemsToMerge.push(id);
                                            break;
                                    }
                                });
                            }

                            // save data first, followed by redirecting to merge
                            if (itemsToMerge.length > 0) {
                                runModifyContact(() => {
                                    // construct list of ids
                                    const mergeIds: string[] = [
                                        this.contactId,
                                        ...itemsToMerge
                                    ];

                                    // hide loading
                                    this.hideLoadingDialog();

                                    // redirect to merge
                                    this.router.navigate(
                                        ['/duplicated-records', EntityModel.getLinkForEntityType(EntityType.CONTACT), 'merge'], {
                                            queryParams: {
                                                ids: JSON.stringify(mergeIds)
                                            }
                                        }
                                    );
                                });
                            } else {
                                runModifyContact();
                            }
                        } else {
                            // hide loading
                            this.hideLoadingDialog();
                        }
                    });
                } else {
                    runModifyContact();
                }
            });
    }

    /**
     * Generate visual ID for contact
     */
    generateVisualId() {
        if (!_.isEmpty(this.selectedOutbreak.contactIdMask)) {
            this.contactData.visualId = ContactModel.generateContactIDMask(this.selectedOutbreak.contactIdMask);
            this.visualId.control.markAsDirty();
        }
    }

    /**
     * Get person link
     */
    getPersonLink(contactExposure) {
        return contactExposure ?
            EntityModel.getPersonLink(contactExposure) :
            null;
    }

    /**
     * Check if we have permission to view exposure
     */
    canViewExposure(): boolean {
        // we don't have exposure data ?
        if (!this.contactExposure) {
            return;
        }

        // check if we have access
        switch (this.contactExposure.type) {
            case EntityType.EVENT:
                return EventModel.canView(this.authUser);
            case EntityType.CONTACT:
                return ContactModel.canView(this.authUser);
            case EntityType.CASE:
                return CaseModel.canView(this.authUser);
        }

        // not supported
        return false;
    }
}
