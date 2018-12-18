import * as _ from 'lodash';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { Observable } from 'rxjs/Observable';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { RelationshipModel, RelationshipPersonModel } from '../../../../core/models/relationship.model';
import { CaseModel } from '../../../../core/models/case.model';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { EventModel } from '../../../../core/models/event.model';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { Moment } from 'moment';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { EntityDuplicatesModel } from '../../../../core/models/entity-duplicates.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { DialogAnswerButton, DialogConfiguration, DialogField, DialogFieldType } from '../../../../shared/components';
import { EntityModel } from '../../../../core/models/entity.model';

@Component({
    selector: 'app-create-contact',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-contact.component.html',
    styleUrls: ['./create-contact.component.less']
})
export class CreateContactComponent extends ConfirmOnFormChanges implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts')
    ];

    // selected outbreak ID
    outbreakId: string;

    contactData: ContactModel = new ContactModel();

    entityType: EntityType;
    entityId: string;

    genderList$: Observable<any[]>;
    occupationsList$: Observable<any[]>;

    relatedEntityData: CaseModel|EventModel;
    relationship: RelationshipModel = new RelationshipModel();

    serverToday: Moment = null;

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
        private genericDataService: GenericDataService,
        private dialogService: DialogService,
        private i18nService: I18nService
    ) {
        super();
    }

    ngOnInit() {
        // reference data
        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER);
        this.occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION);

        // by default, enforce Contact having an address
        this.contactData.addresses.push(new AddressModel());
        // pre-set the initial address as "current address"
        this.contactData.addresses[0].typeId = AddressType.CURRENT_ADDRESS;

        // get today time
        this.genericDataService
            .getServerUTCToday()
            .subscribe((curDate) => {
                this.serverToday = curDate;
            });

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

                // update breadcrumbs
                this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_CREATE_CONTACT_TITLE', '.', true));

                // get selected outbreak
                this.outbreakDataService
                    .getSelectedOutbreak()
                    .catch((err) => {
                        // show error message
                        this.snackbarService.showError(err.message);

                        // redirect to cases
                        this.disableDirtyConfirm();
                        this.router.navigate(['/cases']);
                        return ErrorObservable.create(err);
                    })
                    .subscribe((selectedOutbreak: OutbreakModel) => {
                        this.outbreakId = selectedOutbreak.id;

                        // retrieve Case/Event information
                        this.entityDataService
                            .getEntity(this.entityType, selectedOutbreak.id, this.entityId)
                            .catch((err) => {
                                // show error message
                                this.snackbarService.showError(err.message);

                                // navigate to Cases/Events listing page
                                this.disableDirtyConfirm();
                                if (this.entityType === EntityType.EVENT) {
                                    this.router.navigate(['/events']);
                                } else {
                                    this.router.navigate(['/cases']);
                                }

                                return ErrorObservable.create(err);
                            })
                            .subscribe((relatedEntityData: CaseModel|EventModel) => {
                                // initialize Case/Event
                                this.relatedEntityData = relatedEntityData;
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
     * Create Contact
     * @param {NgForm[]} stepForms
     */
    createNewContact(stepForms: NgForm[]) {
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
                .catch((err) => {
                    this.snackbarService.showApiError(err);

                    // hide dialog
                    loadingDialog.close();

                    return ErrorObservable.create(err);
                })
                .subscribe((contactDuplicates: EntityDuplicatesModel) => {
                    // add the new Contact
                    const runCreateContact = () => {
                        // add the new Contact
                        this.contactDataService
                            .createContact(this.outbreakId, dirtyFields)
                            .catch((err) => {
                                this.snackbarService.showApiError(err);

                                // hide dialog
                                loadingDialog.close();

                                return ErrorObservable.create(err);
                            })
                            .subscribe((contactData: ContactModel) => {
                                this.relationshipDataService
                                    .createRelationship(
                                        this.outbreakId,
                                        EntityType.CONTACT,
                                        contactData.id,
                                        relationship
                                    )
                                    .catch((err) => {
                                        // display error message
                                        this.snackbarService.showApiError(err);

                                        // remove contact
                                        this.contactDataService
                                            .deleteContact(this.outbreakId, contactData.id)
                                            .catch((errDC) => {
                                                return ErrorObservable.create(errDC);
                                            })
                                            .subscribe();

                                        // hide dialog
                                        loadingDialog.close();

                                        // finished
                                        return ErrorObservable.create(err);
                                    })
                                    .subscribe(() => {
                                        this.snackbarService.showSuccess('LNG_PAGE_CREATE_CONTACT_ACTION_CREATE_CONTACT_SUCCESS_MESSAGE');

                                        // hide dialog
                                        loadingDialog.close();

                                        // navigate to listing page
                                        this.disableDirtyConfirm();
                                        this.router.navigate([`/contacts/${contactData.id}/modify`]);
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
