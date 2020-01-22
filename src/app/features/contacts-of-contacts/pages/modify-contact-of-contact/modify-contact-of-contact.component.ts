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

    constructor(
        private referenceDataDataService: ReferenceDataDataService,
        protected route: ActivatedRoute,
        private authDataService: AuthDataService,
        private outbreakDataService: OutbreakDataService,
        private contactsOfContactsDataService: ContactsOfContactsDataService,
        private formHelper: FormHelperService,
        private snackbarService: SnackbarService,
        private router: Router,
        private dialogService: DialogService,
        private i18nService: I18nService
    ) {
        super(route);
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // reference data
        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER);
        this.riskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL);
        this.occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION);
        this.finalFollowUpStatus$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTACT_FINAL_FOLLOW_UP_STATUS);
        this.pregnancyStatusList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.PREGNANCY_STATUS);

        this.route.params
            .subscribe((params: {contactOfContactId}) => {
                this.contactOfContactId = params.contactOfContactId;

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
                        // this.retrieveContactExposure();
                    });
            });
    }

    /**
     * Retrieve contact information
     */
    private retrieveContactData() {
        if (
            this.selectedOutbreak &&
            this.selectedOutbreak.id &&
            this.contactOfContactId
        ) {
            this.contactsOfContactsDataService
                .getContact(this.selectedOutbreak.id, this.contactOfContactId, true)
                .subscribe(contactDataReturned => {
                    this.contactData = new ContactModel(contactDataReturned);

                    // set visual ID translate data
                    this.visualIDTranslateData = {
                        mask: ContactModel.generateContactIDMask(this.selectedOutbreak.contactIdMask)
                    };

                    // set visual ID validator
                    this.contactIdMaskValidator = new Observable((observer) => {
                        this.contactsOfContactsDataService.checkContactVisualIDValidity(
                            this.selectedOutbreak.id,
                            this.visualIDTranslateData.mask,
                            this.contactData.visualId,
                            this.contactData.id
                        ).subscribe((isValid: boolean) => {
                            observer.next(isValid);
                            observer.complete();
                        });
                    });

                    this.createBreadcrumbs();
                });
        }
    }

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

        // check for duplicates
        const loadingDialog = this.dialogService.showLoadingDialog();
        this.contactsOfContactsDataService
            .findDuplicates(this.selectedOutbreak.id, {
                ...this.contactData,
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
            .subscribe((contactDuplicates: EntityDuplicatesModel) => {
                // modify Contact
                const runModifyContact = (finishCallBack?: () => void) => {
                    // modify the contact
                    this.contactsOfContactsDataService
                        .modifyContact(
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
                            this.contactData = modifiedContact;

                            // mark form as pristine
                            form.form.markAsPristine();

                            // display message
                            if (!finishCallBack) {
                                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_CONTACT_ACTION_MODIFY_CONTACT_SUCCESS_MESSAGE');

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
                                inputOptions: _.map(contactDuplicates.duplicates, (duplicate: EntityModel, index: number) => {
                                    // contact model
                                    const contactData: ContactModel = duplicate.model as ContactModel;

                                    // map
                                    return new LabelValuePair((index + 1) + '. ' +
                                        EntityModel.getNameWithDOBAge(
                                            contactData,
                                            this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
                                            this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
                                        ),
                                        contactData.id
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
                                        this.contactOfContactId,
                                        ...answer.inputValue.value.mergeWith
                                    ];

                                    // hide dialog
                                    loadingDialog.close();

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
                                // hide dialog
                                loadingDialog.close();
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
     * Create breadcrumbs
     */
    createBreadcrumbs() {
        this.breadcrumbs = [];
        this.breadcrumbs.push(
            new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts'),
            new BreadcrumbItemModel(
                this.viewOnly ? 'LNG_PAGE_VIEW_CONTACT_TITLE' : 'LNG_PAGE_MODIFY_CONTACT_TITLE',
                '.',
                true,
                {},
                this.contactData
            )
        );
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

}
