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
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
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
import { MatDialogRef } from '@angular/material';
import {
    DialogAnswer, DialogAnswerButton, DialogButton,
    DialogComponent, DialogConfiguration, DialogField
} from '../../../../shared/components/dialog/dialog.component';
import { ContactsOfContactsDataService } from '../../../../core/services/data/contacts-of-contacts.data.service';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';

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

    contactOfContactData: ContactModel = new ContactModel();

    genderList$: Observable<any[]>;
    riskLevelsList$: Observable<any[]>;
    occupationsList$: Observable<any[]>;
    pregnancyStatusList$: Observable<any[]>;

    // provide constants to template
    EntityType = EntityType;
    EntityModel = EntityModel;

    serverToday: Moment = moment();

    visualIDTranslateData: {
        mask: string
    };

    contactOfContactIdMaskValidator: Observable<boolean>;

    displayRefresh: boolean = false;
    @ViewChild('visualId') visualId: NgModel;

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
        private i18nService: I18nService
    ) {
        super(route, dialogService);
    }

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
                        .subscribe((modifiedContact: ContactModel) => {
                            // update model
                            this.contactOfContactData = modifiedContact;

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
                        });
                };

                // do we have duplicates ?
                if (contactOfContactDuplicates.duplicates.length > 0) {
                    // display dialog
                    const showDialog = () => {
                        this.dialogService.showConfirm(new DialogConfiguration({
                            message: 'LNG_PAGE_MODIFY_CONTACT_OF_CONTACT_DUPLICATES_DIALOG_CONFIRM_MSG',
                            yesLabel: 'LNG_COMMON_BUTTON_MERGE',
                            customInput: true,
                            fieldsList: [new DialogField({
                                name: 'mergeWith',
                                placeholder: 'LNG_PAGE_MODIFY_CONTACT_OF_CONTACT_DUPLICATES_DIALOG_LABEL_MERGE_WITH',
                                inputOptions: _.map(contactOfContactDuplicates.duplicates, (duplicate: EntityModel, index: number) => {
                                    // contact model
                                    const contactOfContactData: ContactOfContactModel = duplicate.model as ContactOfContactModel;

                                    // map
                                    return new LabelValuePair((index + 1) + '. ' +
                                        EntityModel.getNameWithDOBAge(
                                            contactOfContactData,
                                            this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
                                            this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
                                        ),
                                        contactOfContactData.id
                                    );
                                }),
                                inputOptionsMultiple: true,
                                required: false
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
                                    !answer.inputValue.value.mergeWith
                                ) {
                                    // display need to select at least one record to merge with
                                    this.snackbarService.showError('LNG_PAGE_MODIFY_CONTACT_OF_CONTACT_DUPLICATES_DIALOG_ACTION_MERGE_AT_LEAST_ONE_ERROR_MESSAGE');

                                    // display dialog again
                                    showDialog();

                                    // finished here
                                    return;
                                }

                                // save data first, followed by redirecting to merge
                                runModifyContactOfContact(() => {
                                    // construct list of ids
                                    const mergeIds: string[] = [
                                        this.contactOfContactId,
                                        ...answer.inputValue.value.mergeWith
                                    ];

                                    // hide dialog
                                    loadingDialog.close();

                                    // redirect to merge
                                    this.router.navigate(
                                        ['/duplicated-records', EntityModel.getLinkForEntityType(EntityType.CONTACT_OF_CONTACT), 'merge'], {
                                            queryParams: {
                                                ids: JSON.stringify(mergeIds)
                                            }
                                        }
                                    );
                                });
                            } else if (answer.button === DialogAnswerButton.Extra_1) {
                                runModifyContactOfContact();
                            } else {
                                // hide dialog
                                loadingDialog.close();
                            }
                        });
                    };

                    // display dialog
                    showDialog();
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
        if (!_.isEmpty(this.selectedOutbreak.contactIdMask)) {
            this.contactOfContactData.visualId = ContactOfContactModel.generateContactOfContactIDMask(this.selectedOutbreak.contactIdMask);
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
