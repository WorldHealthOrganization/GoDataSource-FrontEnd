import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { UserModel } from '../../../../core/models/user.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { RelationshipPersonModel } from '../../../../core/models/relationship-person.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { Observable, throwError } from 'rxjs/index';
import { moment, Moment } from '../../../../core/helperClasses/x-moment';
import { NgForm, NgModel } from '@angular/forms';
import { EntityType } from '../../../../core/models/entity-type';
import { EntityModel, RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import * as _ from 'lodash';
import { catchError } from 'rxjs/internal/operators';
import { EntityDuplicatesModel } from '../../../../core/models/entity-duplicates.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import {DialogAnswerButton, DialogConfiguration, DialogField, DialogFieldType } from '../../../../shared/components/dialog/dialog.component';
import { ContactsOfContactsDataService } from '../../../../core/services/data/contacts-of-contacts.data.service';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { Constants } from '../../../../core/models/constants';

@Component({
    selector: 'app-modify-contact-of-contact',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-contact-of-contact.component.html',
    styleUrls: ['./modify-contact-of-contact.component.less']
})
export class ModifyContactOfContactComponent extends ViewModifyComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [];

    // authenticated user
    authUser: UserModel;

    contactOfContactId: string;
    selectedOutbreak: OutbreakModel;
    contactExposure: RelationshipPersonModel;

    contactOfContactData: ContactOfContactModel = new ContactOfContactModel();

    genderList$: Observable<any[]>;
    riskLevelsList$: Observable<any[]>;
    occupationsList$: Observable<any[]>;
    pregnancyStatusList$: Observable<any[]>;

    // provide constants to template
    EntityType = EntityType;
    EntityModel = EntityModel;
    ContactModel = ContactModel;
    RelationshipModel = RelationshipModel;
    ContactOfContactModel = ContactOfContactModel;

    serverToday: Moment = moment();

    visualIDTranslateData: {
        mask: string
    };

    contactOfContactIdMaskValidator: Observable<boolean>;

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
        private contactsOfContactsDataService: ContactsOfContactsDataService,
        private formHelper: FormHelperService,
        private snackbarService: SnackbarService,
        private relationshipDataService: RelationshipDataService,
        private router: Router,
        protected dialogService: DialogService,
        private i18nService: I18nService,
        private entityDataService: EntityDataService
    ) {
        super(route, dialogService);
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
        this.pregnancyStatusList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.PREGNANCY_STATUS);

        this.route.params
            .subscribe((params: {contactOfContactId}) => {
                this.contactOfContactId = params.contactOfContactId;

                // get current outbreak
                this.outbreakDataService
                    .getSelectedOutbreak()
                    .subscribe((selectedOutbreak: OutbreakModel) => {
                        this.selectedOutbreak = selectedOutbreak;
                        if (!_.isEmpty(this.selectedOutbreak.contactOfContactIdMask)) {
                            this.displayRefresh = true;
                        }
                        // get contact
                        this.retrieveContactOfContactData();

                        // get contact's exposure
                        this.retrieveContactExposure();
                    });
            });
    }

    /**
     * Retrieve contact of contact information
     */
    private retrieveContactOfContactData() {
        if (
            this.selectedOutbreak &&
            this.selectedOutbreak.id &&
            this.contactOfContactId
        ) {
            this.contactsOfContactsDataService
                .getContactOfContact(this.selectedOutbreak.id, this.contactOfContactId, true)
                .subscribe(contactDataReturned => {
                    this.contactOfContactData = new ContactModel(contactDataReturned);

                    // set visual ID translate data
                    this.visualIDTranslateData = {
                        mask: ContactOfContactModel.generateContactOfContactIDMask(this.selectedOutbreak.contactOfContactIdMask)
                    };

                    // set visual ID validator
                    this.contactOfContactIdMaskValidator = new Observable((observer) => {
                        this.contactsOfContactsDataService.checkContactOfContactVisualIDValidity(
                            this.selectedOutbreak.id,
                            this.visualIDTranslateData.mask,
                            this.contactOfContactData.visualId,
                            this.contactOfContactData.id
                        ).subscribe((isValid: boolean) => {
                            observer.next(isValid);
                            observer.complete();
                        });
                    });

                    this.createBreadcrumbs();
                });
        }
    }

    /**
     * Retrieve Contact of contact exposure: the Contact who is related to Contact of Contact
     * Note: If there are more than one relationships, then we don't know the main Exposure so we do nothing here
     */
    private retrieveContactExposure() {
        if (
            this.selectedOutbreak &&
            this.selectedOutbreak.id &&
            this.contactOfContactId
        ) {
            const qb = new RequestQueryBuilder();
            qb.limit(2);
            this.relationshipDataService
                .getEntityRelationships(
                    this.selectedOutbreak.id,
                    EntityType.CONTACT_OF_CONTACT,
                    this.contactOfContactId,
                    qb
                )
                .subscribe((relationships) => {
                    if (relationships.length === 1) {
                        // we found the exposure
                        this.contactExposure = new RelationshipPersonModel(
                            _.find(relationships[0].persons, (person) => person.id !== this.contactOfContactId)
                        );
                    }
                });
        }
    }

    /**
     * Modify contact of contact
     * @param form
     */
    modifyContactOfContact(form: NgForm) {
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

        // check for duplicates
        const loadingDialog = this.dialogService.showLoadingDialog();
        this.contactsOfContactsDataService
            .findDuplicates(this.selectedOutbreak.id, {
                ...this.contactOfContactData,
                ...dirtyFields
            })
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);

                    // hide dialog
                    loadingDialog.close();

                    return throwError(err);
                })
            )
            .subscribe((contactOfContactDuplicates: EntityDuplicatesModel) => {
                // items marked as not duplicates
                let itemsMarkedAsNotDuplicates: string[] = [];

                // modify the contact of contact
                const runModifyContactOfContact = (finishCallBack?: () => void) => {
                    // modify the contact of contact
                    this.contactsOfContactsDataService
                        .modifyContactOfContact(
                            this.selectedOutbreak.id,
                            this.contactOfContactId,
                            dirtyFields,
                            true
                        )
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);
                                loadingDialog.close();
                                return throwError(err);
                            })
                        )
                        .subscribe((modifiedContactOfContact: ContactOfContactModel) => {
                            // called when we finish updating contact of contact data
                            const finishedUpdatingContactOfContact = () => {
                                // update model
                                this.contactOfContactData = modifiedContactOfContact;

                                // mark form as pristine
                                form.form.markAsPristine();

                                // display message
                                if (!finishCallBack) {
                                    this.snackbarService.showSuccess('LNG_PAGE_MODIFY_CONTACT_OF_CONTACT_ACTION_MODIFY_CONTACT_OF_CONTACT_SUCCESS_MESSAGE');

                                    // update breadcrumb
                                    this.createBreadcrumbs();

                                    // hide dialog
                                    loadingDialog.close();
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
                                finishedUpdatingContactOfContact();
                            } else {
                                // mark records as not duplicates
                                this.entityDataService
                                    .markPersonAsOrNotADuplicate(
                                        this.selectedOutbreak.id,
                                        EntityType.CONTACT,
                                        this.contactOfContactId,
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
                                        finishedUpdatingContactOfContact();
                                    });
                            }
                        });
                };

                // do we have duplicates ?
                if (contactOfContactDuplicates.duplicates.length > 0) {
                    // construct list of items from which we can choose actions
                    const fieldsList: DialogField[] = [];
                    const fieldsListLayout: number[] = [];
                    contactOfContactDuplicates.duplicates.forEach((duplicate: EntityModel, index: number) => {
                        // contact model
                        const contactOfContactData: ContactOfContactModel = duplicate.model as ContactOfContactModel;

                        // add row fields
                        fieldsListLayout.push(60, 40);
                        fieldsList.push(
                            new DialogField({
                                name: `actions[${contactOfContactData.id}].label`,
                                placeholder: (index + 1) + '. ' + EntityModel.getNameWithDOBAge(
                                    contactOfContactData,
                                    this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
                                    this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
                                ),
                                fieldType: DialogFieldType.LINK,
                                routerLink: ['/contacts-of-contacts', contactOfContactData.id, 'view'],
                                linkTarget: '_blank'
                            }),
                            new DialogField({
                                name: `actions[${contactOfContactData.id}].action`,
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
                        message: 'LNG_PAGE_MODIFY_CONTACT_OF_CONTACT_DUPLICATES_DIALOG_CONFIRM_MSG',
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
                                runModifyContactOfContact(() => {
                                    // construct list of ids
                                    const mergeIds: string[] = [
                                        this.contactOfContactId,
                                        ...itemsToMerge
                                    ];

                                    // hide loading
                                    this.hideLoadingDialog();

                                    // redirect to merge
                                    this.router.navigate(
                                        ['/duplicated-records', EntityModel.getLinkForEntityType(EntityType.CONTACT_OF_CONTACT), 'merge'], {
                                            queryParams: {
                                                ids: JSON.stringify(mergeIds)
                                            }
                                        }
                                    );
                                });
                            } else {
                                runModifyContactOfContact();
                            }
                        } else {
                            // hide loading
                            this.hideLoadingDialog();
                        }
                    });
                } else {
                    runModifyContactOfContact();
                }
            });
    }

    /**
     * Create breadcrumbs
     */
    createBreadcrumbs() {
        this.breadcrumbs = [];
        this.breadcrumbs.push(
            new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE', '/contacts-of-contacts'),
            new BreadcrumbItemModel(
                this.viewOnly ? 'LNG_PAGE_VIEW_CONTACT_OF_CONTACT_TITLE' : 'LNG_PAGE_MODIFY_CONTACT_OF_CONTACT_TITLE',
                '.',
                true,
                {},
                this.contactOfContactData
            )
        );
    }

    /**
     * Generate visual ID for contact
     */
    generateVisualId() {
        if (!_.isEmpty(this.selectedOutbreak.contactOfContactIdMask)) {
            this.contactOfContactData.visualId = ContactOfContactModel.generateContactOfContactIDMask(this.selectedOutbreak.contactOfContactIdMask);
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
}
