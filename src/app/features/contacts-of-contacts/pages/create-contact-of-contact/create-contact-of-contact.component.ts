import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EntityType } from '../../../../core/models/entity-type';
import * as _ from 'lodash';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable, throwError } from 'rxjs/index';
import { EntityModel, RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { moment, Moment } from '../../../../core/helperClasses/x-moment';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { catchError } from 'rxjs/internal/operators';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { RelationshipPersonModel } from '../../../../core/models/relationship-person.model';
import { NgForm } from '@angular/forms';
import { EntityDuplicatesModel } from '../../../../core/models/entity-duplicates.model';
import {
    DialogAnswerButton,
    DialogConfiguration, DialogField,
    DialogFieldType
} from '../../../../shared/components/dialog/dialog.component';
import { ContactsOfContactsDataService } from '../../../../core/services/data/contacts-of-contacts.data.service';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { UserModel } from '../../../../core/models/user.model';
import { CreateConfirmOnChanges } from '../../../../core/helperClasses/create-confirm-on-changes';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { Constants } from '../../../../core/models/constants';
import { ContactModel } from '../../../../core/models/contact.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { TimerCache } from '../../../../core/helperClasses/timer-cache';

@Component({
    selector: 'app-create-contact-of-contact',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-contact-of-contact.component.html',
    styleUrls: ['./create-contact-of-contact.component.less']
})
export class CreateContactOfContactComponent extends CreateConfirmOnChanges implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [];

    // selected outbreak
    selectedOutbreak: OutbreakModel;

    contactOfContactData: ContactOfContactModel = new ContactOfContactModel();

    entityId: string;

    genderList$: Observable<any[]>;
    occupationsList$: Observable<any[]>;
    pregnancyStatusList$: Observable<any[]>;
    riskLevelsList$: Observable<any[]>;

    relatedEntityData: ContactModel;
    relationship: RelationshipModel = new RelationshipModel();

    serverToday: Moment = moment();

    visualIDTranslateData: {
        mask: string
    };

    contactOfContactMaskValidator$: Observable<boolean>;

    // authenticated user details
    authUser: UserModel;

    /**
     * Constructor
     */
    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private contactsOfContactsDataService: ContactsOfContactsDataService,
        private entityDataService: EntityDataService,
        private outbreakDataService: OutbreakDataService,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private relationshipDataService: RelationshipDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private dialogService: DialogService,
        private i18nService: I18nService,
        private redirectService: RedirectService
    ) {
        super();
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // reference data
        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER);
        this.occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION);
        this.pregnancyStatusList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.PREGNANCY_STATUS);
        this.riskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL);

        // by default, enforce Contact having an address
        this.contactOfContactData.addresses.push(new AddressModel());
        // pre-set the initial address as "current address"
        this.contactOfContactData.addresses[0].typeId = AddressType.CURRENT_ADDRESS;

        // retrieve query params
        this.route.queryParams
            .subscribe((params: {entityId}) => {
                this.entityId = _.get(params, 'entityId');

                // check if we have proper value ( case or event ID )
                if (!this.entityId) {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_CONTACT_OF_CONTACT_WARNING_CASE_OR_EVENT_REQUIRED');

                    this.disableDirtyConfirm();
                    // navigate to Contacts page
                    this.router.navigate(['/contacts']);

                    return;
                }

                // get selected outbreak
                this.outbreakDataService
                    .getSelectedOutbreak()
                    .pipe(
                        catchError((err) => {
                            // show error message
                            this.snackbarService.showError(err.message);

                            // redirect to contacts
                            this.disableDirtyConfirm();
                            this.router.navigate(['/contacts']);
                            return throwError(err);
                        })
                    )
                    .subscribe((selectedOutbreak: OutbreakModel) => {
                        this.selectedOutbreak = selectedOutbreak;

                        // set visual ID translate data
                        this.visualIDTranslateData = {
                            mask: ContactOfContactModel.generateContactOfContactIDMask(selectedOutbreak.contactOfContactIdMask)
                        };

                        // set visual id for contact
                        this.contactOfContactData.visualId = this.visualIDTranslateData.mask;

                        // set visual ID validator
                        this.contactOfContactMaskValidator$ = new Observable((observer) => {
                            // construct cache key
                            const cacheKey: string = 'CCC_' + selectedOutbreak.id +
                                this.visualIDTranslateData.mask +
                                this.contactOfContactData.visualId;

                            // get data from cache or execute validator
                            TimerCache.run(
                                cacheKey,
                                this.contactsOfContactsDataService.checkContactOfContactVisualIDValidity(
                                    selectedOutbreak.id,
                                    this.visualIDTranslateData.mask,
                                    this.contactOfContactData.visualId
                                )
                            ).subscribe((isValid: boolean) => {
                                observer.next(isValid);
                                observer.complete();
                            });
                        });

                        // retrieve Contact information
                        this.entityDataService
                            .getEntity(EntityType.CONTACT, selectedOutbreak.id, this.entityId)
                            .pipe(
                                catchError((err) => {
                                    // show error message
                                    this.snackbarService.showError(err.message);

                                    // navigate to contacts listing page
                                    this.disableDirtyConfirm();
                                    this.router.navigate(['/contacts']);
                                    return throwError(err);
                                })
                            )
                            .subscribe((relatedEntityData: ContactModel) => {
                                // initialize Case/Event
                                this.relatedEntityData = relatedEntityData;

                                // initialize page breadcrumbs
                                this.initializeBreadcrumbs();

                                this.relationship.persons.push(
                                    new RelationshipPersonModel({
                                        id: this.entityId
                                    })
                                );
                            });
                    });
            });
    }

    /**
     * Initialize breadcrumbs
     */
    private initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        if (this.relatedEntityData) {
            // Contacts list
            if (ContactModel.canList(this.authUser)) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts')
                );
            }
            // view Contact
            if (ContactModel.canView(this.authUser)) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel(this.relatedEntityData.name, `/contacts/${this.relatedEntityData.id}/view`)
                );
            }
        }
        // current page breadcrumb
        this.breadcrumbs.push(
            new BreadcrumbItemModel('LNG_PAGE_CREATE_CONTACT_OF_CONTACT_TITLE', '.', true)
        );
    }

    /**
     * Create Contact of contact
     * @param {NgForm[]} stepForms
     * @param {boolean} andAnotherOne
     */
    createNewContactOfContact(stepForms: NgForm[], andAnotherOne: boolean = false) {
        if (
            !this.selectedOutbreak ||
            !this.selectedOutbreak.id
        )  {
            return;
        }

        // get forms fields
        const dirtyFields: any = this.formHelper.mergeFields(stepForms);
        const relationship = _.get(dirtyFields, 'relationship');
        delete dirtyFields.relationship;

        // add age & dob information
        if (dirtyFields.ageDob) {
            dirtyFields.age = dirtyFields.ageDob.age;
            dirtyFields.dob = dirtyFields.ageDob.dob;
            delete dirtyFields.ageDob;
        }

        // create relationship & contact of contact
        if (
            this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields) &&
            !_.isEmpty(relationship)
        ) {
            // check for duplicates
            const loadingDialog = this.dialogService.showLoadingDialog();
            this.contactsOfContactsDataService
                .findDuplicates(this.selectedOutbreak.id, dirtyFields)
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

                    // add the new Contact of contact
                    const runCreateContactOfContact = () => {
                        this.contactsOfContactsDataService
                            .createContactOfContact(this.selectedOutbreak.id, dirtyFields)
                            .pipe(
                                catchError((err) => {
                                    this.snackbarService.showApiError(err);

                                    // hide dialog
                                    loadingDialog.close();

                                    return throwError(err);
                                })
                            )
                            .subscribe((contactOfContactData: ContactOfContactModel) => {
                                this.relationshipDataService
                                    .createRelationship(
                                        this.selectedOutbreak.id,
                                        EntityType.CONTACT_OF_CONTACT,
                                        contactOfContactData.id,
                                        relationship
                                    )
                                    .pipe(
                                        catchError((err) => {
                                            // display error message
                                            this.snackbarService.showApiError(err);

                                            // remove contact of contact
                                            this.contactsOfContactsDataService
                                                .deleteContactOfContact(this.selectedOutbreak.id, contactOfContactData.id)
                                                .subscribe();

                                            // hide dialog
                                            loadingDialog.close();

                                            // finished
                                            return throwError(err);
                                        })
                                    )
                                    .subscribe(() => {
                                        // called when we finished creating contact of contact
                                        const finishedCreatingContactOfContact = () => {
                                            this.snackbarService.showSuccess('LNG_PAGE_CREATE_CONTACT_ACTION_CREATE_CONTACT_SUCCESS_MESSAGE');

                                            // hide dialog
                                            loadingDialog.close();
                                            // navigate to listing page
                                            if (andAnotherOne) {
                                                this.disableDirtyConfirm();
                                                this.redirectService.to(
                                                    [`/contacts-of-contacts/create`],
                                                    {
                                                        entityId: this.entityId
                                                    }
                                                );
                                            } else {
                                                // navigate to proper page
                                                // method handles disableDirtyConfirm too...
                                                this.redirectToProperPageAfterCreate(
                                                    this.router,
                                                    this.redirectService,
                                                    this.authUser,
                                                    ContactOfContactModel,
                                                    'contacts-of-contacts',
                                                    contactOfContactData.id, {
                                                        entityId: this.entityId
                                                    }
                                                );
                                            }
                                        };

                                        // there are no records marked as NOT duplicates ?
                                        if (
                                            !itemsMarkedAsNotDuplicates ||
                                            itemsMarkedAsNotDuplicates.length < 1
                                        ) {
                                            finishedCreatingContactOfContact();
                                        } else {
                                            // mark records as not duplicates
                                            this.entityDataService
                                                .markPersonAsOrNotADuplicate(
                                                    this.selectedOutbreak.id,
                                                    EntityType.CONTACT_OF_CONTACT,
                                                    contactOfContactData.id,
                                                    itemsMarkedAsNotDuplicates
                                                )
                                                .pipe(
                                                    catchError((err) => {
                                                        this.snackbarService.showApiError(err);

                                                        // hide dialog
                                                        loadingDialog.close();

                                                        return throwError(err);
                                                    })
                                                )
                                                .subscribe(() => {
                                                    // finished
                                                    finishedCreatingContactOfContact();
                                                });
                                        }
                                    });
                            });
                    };

                    // do we have duplicates ?
                    if (contactOfContactDuplicates.duplicates.length > 0) {
                        // construct list of items from which we can choose actions
                        const fieldsList: DialogField[] = [];
                        const fieldsListLayout: number[] = [];
                        contactOfContactDuplicates.duplicates.forEach((duplicate: EntityModel, index: number) => {
                            // contact of contact model
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
                                        )
                                    ],
                                    inputOptionsClearable: false,
                                    required: true,
                                    value: Constants.DUPLICATE_ACTION.NO_ACTION
                                })
                            );
                        });

                        // display dialog
                        this.dialogService
                            .showConfirm(new DialogConfiguration({
                                message: 'LNG_PAGE_CREATE_CONTACT_OF_CONTACT_DUPLICATES_DIALOG_CONFIRM_MSG',
                                customInput: true,
                                fieldsListLayout: fieldsListLayout,
                                fieldsList: fieldsList
                            }))
                            .subscribe((answer) => {
                                if (answer.button === DialogAnswerButton.Yes) {
                                    // determine number of items to mark as not duplicates
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
                                            }
                                        });
                                    }

                                    // create contact of contact
                                    runCreateContactOfContact();
                                } else {
                                    // hide dialog
                                    loadingDialog.close();
                                }
                            });
                    } else {
                        runCreateContactOfContact();
                    }
                });
        }
    }
}
