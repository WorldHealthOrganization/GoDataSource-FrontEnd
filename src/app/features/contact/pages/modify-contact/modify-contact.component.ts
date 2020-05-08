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
import { DialogAnswer, DialogAnswerButton, DialogButton, DialogComponent, DialogConfiguration, DialogField, DialogFieldListItem, DialogFieldType } from '../../../../shared/components';
import * as _ from 'lodash';
import { EntityModel, RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { MatDialogRef } from '@angular/material';
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

    contactId: string;
    selectedOutbreak: OutbreakModel;
    contactExposure: RelationshipPersonModel;

    contactData: ContactModel = new ContactModel();

    genderList$: Observable<any[]>;
    riskLevelsList$: Observable<any[]>;
    occupationsList$: Observable<any[]>;
    finalFollowUpStatus$: Observable<any[]>;
    pregnancyStatusList$: Observable<any[]>;

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
        private entityDataService: EntityDataService
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
                            // called when we finished updating case data
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
                    // display dialog
                    const showDialog = () => {
                        this.dialogService.showConfirm(new DialogConfiguration({
                            message: 'LNG_PAGE_MODIFY_CONTACT_DUPLICATES_DIALOG_CONFIRM_MSG',
                            yesLabel: 'LNG_COMMON_BUTTON_MERGE',
                            customInput: true,
                            fieldsList: [new DialogField({
                                name: 'mergeWith',
                                placeholder: 'LNG_PAGE_MODIFY_CONTACT_DUPLICATES_DIALOG_LABEL_MERGE_WITH',
                                fieldType: DialogFieldType.CHECKBOX_LIST,
                                listItems: _.map(contactDuplicates.duplicates, (duplicate: EntityModel, index: number) => {
                                    // contact model
                                    const contactData: ContactModel = duplicate.model as ContactModel;

                                    // map
                                    return new DialogFieldListItem({
                                        itemData: new LabelValuePair((index + 1) + '. ' +
                                            EntityModel.getNameWithDOBAge(
                                                contactData,
                                                this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
                                                this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
                                            ),
                                            contactData.id
                                        ),
                                        actionButtonLabel: 'LNG_PAGE_MODIFY_CONTACT_DUPLICATES_DIALOG_LABEL_NOT_A_DUPLICATE',
                                        actionButtonActionTooltip: 'LNG_PAGE_MODIFY_CONTACT_DUPLICATES_DIALOG_LABEL_NOT_A_DUPLICATE_DESCRIPTION',
                                        actionButtonDisableActionAlongWithItem: false,
                                        actionButtonAction: (item) => {
                                            // not a duplicate ?
                                            if (item.actionButtonLabel === 'LNG_PAGE_MODIFY_CONTACT_DUPLICATES_DIALOG_LABEL_NOT_A_DUPLICATE') {
                                                // mark as not a duplicate for later change
                                                item.checked = false;
                                                item.disabled = true;
                                                item.actionButtonLabel = 'LNG_PAGE_MODIFY_CONTACT_DUPLICATES_DIALOG_LABEL_POSSIBLE_DUPLICATE';
                                                item.actionButtonActionTooltip = 'LNG_PAGE_MODIFY_CONTACT_DUPLICATES_DIALOG_LABEL_POSSIBLE_DUPLICATE_DESCRIPTION';

                                                // add item to list of marked as not duplicates
                                                itemsMarkedAsNotDuplicates.push(item.itemData.value);
                                                itemsMarkedAsNotDuplicates = _.uniq(itemsMarkedAsNotDuplicates);
                                            } else {
                                                // enable back
                                                item.disabled = false;
                                                item.actionButtonLabel = 'LNG_PAGE_MODIFY_CONTACT_DUPLICATES_DIALOG_LABEL_NOT_A_DUPLICATE';
                                                item.actionButtonActionTooltip = 'LNG_PAGE_MODIFY_CONTACT_DUPLICATES_DIALOG_LABEL_NOT_A_DUPLICATE_DESCRIPTION';

                                                // remove item from the list of marked as not duplicates
                                                itemsMarkedAsNotDuplicates = itemsMarkedAsNotDuplicates.filter((id) => id !== item.itemData.value);
                                            }
                                        }
                                    });
                                })
                            })],
                            addDefaultButtons: true,
                            buttons: [
                                new DialogButton({
                                    label: 'LNG_COMMON_BUTTON_SAVE',
                                    clickCallback: (dialogHandler: MatDialogRef<DialogComponent>) => {
                                        dialogHandler.close(new DialogAnswer(DialogAnswerButton.Extra_1));
                                    }
                                })
                            ]
                        })).subscribe((answer) => {
                            // just update ?
                            if (answer.button === DialogAnswerButton.Yes) {
                                // make sure we have at least two ids selected ( 1 is the current case )
                                if (
                                    !answer.inputValue.value.mergeWith ||
                                    answer.inputValue.value.mergeWith.length < 1
                                ) {
                                    // display need to select at least one record to merge with
                                    this.snackbarService.showError('LNG_PAGE_MODIFY_CONTACT_DUPLICATES_DIALOG_ACTION_MERGE_AT_LEAST_ONE_ERROR_MESSAGE');

                                    // display dialog again
                                    showDialog();

                                    // finished here
                                    return;
                                }

                                // save data first, followed by redirecting to merge
                                runModifyContact(() => {
                                    // construct list of ids
                                    const mergeIds: string[] = [
                                        this.contactId,
                                        ...answer.inputValue.value.mergeWith
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
                            } else if (answer.button === DialogAnswerButton.Extra_1) {
                                runModifyContact();
                            } else {
                                // hide loading
                                this.hideLoadingDialog();
                            }
                        });
                    };

                    // display dialog
                    showDialog();
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
