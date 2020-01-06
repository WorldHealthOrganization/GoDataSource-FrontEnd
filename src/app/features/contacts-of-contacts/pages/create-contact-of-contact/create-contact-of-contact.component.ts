import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EntityType } from '../../../../core/models/entity-type';
import * as _ from 'lodash';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
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
import { ContactModel } from '../../../../core/models/contact.model';
import { Observable, throwError } from 'rxjs/index';
import { CaseModel } from '../../../../core/models/case.model';
import { EventModel } from '../../../../core/models/event.model';
import { EntityModel, RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { moment, Moment } from '../../../../core/helperClasses/x-moment';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
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

@Component({
    selector: 'app-create-contact-of-contact',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-contact-of-contact.component.html',
    styleUrls: ['./create-contact-of-contact.component.less']
})
export class CreateContactOfContactComponent extends ConfirmOnFormChanges implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [];

    // selected outbreak ID
    outbreakId: string;

    contactData: ContactModel = new ContactModel();

    entityType: EntityType;
    entityId: string;

    genderList$: Observable<any[]>;
    occupationsList$: Observable<any[]>;
    pregnancyStatusList$: Observable<any[]>;
    riskLevelsList$: Observable<any[]>;

    relatedEntityData: CaseModel | EventModel;
    relationship: RelationshipModel = new RelationshipModel();

    serverToday: Moment = moment();

    visualIDTranslateData: {
        mask: string
    };

    contactIdMaskValidator: Observable<boolean>;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private contactDataService: ContactDataService,
        private entityDataService: EntityDataService,
        private outbreakDataService: OutbreakDataService,
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

    ngOnInit() {
        // reference data
        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER);
        this.occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION);
        this.pregnancyStatusList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.PREGNANCY_STATUS);
        this.riskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL);

        // by default, enforce Contact having an address
        this.contactData.addresses.push(new AddressModel());
        // pre-set the initial address as "current address"
        this.contactData.addresses[0].typeId = AddressType.CURRENT_ADDRESS;

        // retrieve query params
        this.route.queryParams
            .subscribe((params: {entityType, entityId}) => {
                this.entityType = _.get(params, 'entityType');
                this.entityId = _.get(params, 'entityId');

                // check if we have proper values ( case or event ID )
                if (
                    !this.entityType ||
                    !this.entityId
                ) {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_CONTACT_WARNING_CASE_OR_EVENT_REQUIRED');

                    // navigate to Cases/Events listing page
                    this.disableDirtyConfirm();
                    if (this.entityType === EntityType.EVENT) {
                        this.router.navigate(['/events']);
                    } else {
                        this.router.navigate(['/cases']);
                    }

                    return;
                }

                // get selected outbreak
                this.outbreakDataService
                    .getSelectedOutbreak()
                    .pipe(
                        catchError((err) => {
                            // show error message
                            this.snackbarService.showError(err.message);

                            // redirect to cases
                            this.disableDirtyConfirm();
                            this.router.navigate(['/cases']);
                            return throwError(err);
                        })
                    )
                    .subscribe((selectedOutbreak: OutbreakModel) => {
                        this.outbreakId = selectedOutbreak.id;

                        // set visual ID translate data
                        this.visualIDTranslateData = {
                            mask: ContactModel.generateContactIDMask(selectedOutbreak.contactIdMask)
                        };

                        // set visual id for contact
                        this.contactData.visualId = this.visualIDTranslateData.mask;

                        // set visual ID validator
                        this.contactIdMaskValidator = new Observable((observer) => {
                            this.contactDataService.checkContactVisualIDValidity(
                                selectedOutbreak.id,
                                this.visualIDTranslateData.mask,
                                this.contactData.visualId
                            ).subscribe((isValid: boolean) => {
                                observer.next(isValid);
                                observer.complete();
                            });
                        });

                        // retrieve Case/Event information
                        this.entityDataService
                            .getEntity(this.entityType, selectedOutbreak.id, this.entityId)
                            .pipe(
                                catchError((err) => {
                                    // show error message
                                    this.snackbarService.showError(err.message);

                                    // navigate to Cases/Events listing page
                                    this.disableDirtyConfirm();
                                    if (this.entityType === EntityType.EVENT) {
                                        this.router.navigate(['/events']);
                                    } else {
                                        this.router.navigate(['/cases']);
                                    }

                                    return throwError(err);
                                })
                            )
                            .subscribe((relatedEntityData: CaseModel|EventModel) => {
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
        if (this.relatedEntityData) {
            // case or event?
            if (this.relatedEntityData.type === EntityType.CASE) {
                // creating contact for a case
                this.breadcrumbs = [
                    new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases'),
                    new BreadcrumbItemModel(this.relatedEntityData.name, `/cases/${this.relatedEntityData.id}/view`),
                    new BreadcrumbItemModel('LNG_PAGE_CREATE_CONTACT_TITLE', '.', true)
                ];
            } else {
                // creating contact for an event
                this.breadcrumbs = [
                    new BreadcrumbItemModel('LNG_PAGE_LIST_EVENTS_TITLE', '/events'),
                    new BreadcrumbItemModel(this.relatedEntityData.name, `/events/${this.relatedEntityData.id}/view`),
                    new BreadcrumbItemModel('LNG_PAGE_CREATE_CONTACT_TITLE', '.', true)
                ];
            }
        }
    }

    /**
     * Create Contact
     * @param {NgForm[]} stepForms
     * @param {boolean} andAnotherOne
     */
    createNewContact(stepForms: NgForm[], andAnotherOne: boolean = false) {
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

        // create relationship & contact
        if (
            this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields) &&
            !_.isEmpty(relationship)
        ) {
            // check for duplicates
            const loadingDialog = this.dialogService.showLoadingDialog();
            this.contactDataService
                .findDuplicates(this.outbreakId, dirtyFields)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);

                        // hide dialog
                        loadingDialog.close();

                        return throwError(err);
                    })
                )
                .subscribe((contactDuplicates: EntityDuplicatesModel) => {
                    // add the new Contact
                    const runCreateContact = () => {
                        // add the new Contact
                        this.contactDataService
                            .createContact(this.outbreakId, dirtyFields)
                            .pipe(
                                catchError((err) => {
                                    this.snackbarService.showApiError(err);

                                    // hide dialog
                                    loadingDialog.close();

                                    return throwError(err);
                                })
                            )
                            .subscribe((contactData: ContactModel) => {
                                this.relationshipDataService
                                    .createRelationship(
                                        this.outbreakId,
                                        EntityType.CONTACT,
                                        contactData.id,
                                        relationship
                                    )
                                    .pipe(
                                        catchError((err) => {
                                            // display error message
                                            this.snackbarService.showApiError(err);

                                            // remove contact
                                            this.contactDataService
                                                .deleteContact(this.outbreakId, contactData.id)
                                                .subscribe();

                                            // hide dialog
                                            loadingDialog.close();

                                            // finished
                                            return throwError(err);
                                        })
                                    )
                                    .subscribe(() => {
                                        this.snackbarService.showSuccess('LNG_PAGE_CREATE_CONTACT_ACTION_CREATE_CONTACT_SUCCESS_MESSAGE');

                                        // hide dialog
                                        loadingDialog.close();

                                        // navigate to listing page
                                        this.disableDirtyConfirm();
                                        if (andAnotherOne) {
                                            this.redirectService.to(
                                                [`/contacts/create`],
                                                {
                                                    entityType: this.entityType,
                                                    entityId: this.entityId
                                                }
                                            );
                                        } else {
                                            this.router.navigate([`/contacts/${contactData.id}/modify`]);
                                        }
                                    });
                            });
                    };

                    // do we have duplicates ?
                    if (contactDuplicates.duplicates.length > 0) {
                        // construct list of possible duplicates
                        const possibleDuplicates: DialogField[] = [];
                        _.each(contactDuplicates.duplicates, (duplicate: EntityModel, index: number) => {
                            // contact model
                            const contactData: ContactModel = duplicate.model as ContactModel;

                            // add link
                            possibleDuplicates.push(new DialogField({
                                name: 'link',
                                placeholder: (index + 1 ) + '. ' + EntityModel.getNameWithDOBAge(
                                    contactData,
                                    this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
                                    this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
                                ),
                                fieldType: DialogFieldType.LINK,
                                routerLink: ['/contacts', contactData.id, 'view'],
                                linkTarget: '_blank'
                            }));
                        });

                        // display dialog
                        this.dialogService.showConfirm(new DialogConfiguration({
                            message: 'LNG_PAGE_CREATE_CONTACT_DUPLICATES_DIALOG_CONFIRM_MSG',
                            customInput: true,
                            fieldsList: possibleDuplicates,
                        }))
                            .subscribe((answer) => {
                                if (answer.button === DialogAnswerButton.Yes) {
                                    runCreateContact();
                                } else {
                                    // hide dialog
                                    loadingDialog.close();
                                }
                            });
                    } else {
                        runCreateContact();
                    }
                });
        }
    }
}
