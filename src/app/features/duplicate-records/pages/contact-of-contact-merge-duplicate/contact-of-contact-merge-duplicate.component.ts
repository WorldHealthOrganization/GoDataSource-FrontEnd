import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { ActivatedRoute, Router } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { DocumentModel } from '../../../../core/models/document.model';
import * as _ from 'lodash';
import { moment } from '../../../../core/helperClasses/x-moment';
import { Constants } from '../../../../core/models/constants';
import { NgForm } from '@angular/forms';
import { EntityType } from '../../../../core/models/entity-type';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { VaccineModel } from '../../../../core/models/vaccine.model';

@Component({
    selector: 'app-contact-of-contact-merge-duplicate',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contact-of-contact-merge-duplicate.component.html',
    styleUrls: ['./contact-of-contact-merge-duplicate.component.less']
})
export class ContactOfContactMergeDuplicateComponent extends ConfirmOnFormChanges implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_DUPLICATE_RECORDS_TITLE', '/duplicated-records'),
        new BreadcrumbItemModel('LNG_PAGE_CONTACT_OF_CONTACT_MERGE_DUPLICATE_RECORDS_TITLE', '.', true)
    ];

    contactOfContactData: ContactOfContactModel = new ContactOfContactModel();

    selectedOutbreak: OutbreakModel;

    // loading
    displayLoading: boolean = false;

    address: AddressModel = new AddressModel();

    mergeRecordIds: string[];
    mergeRecords: EntityModel[];

    uniqueOptions: {
        firstName: {
            options: LabelValuePair[],
            value: any
        },
        middleName: {
            options: LabelValuePair[],
            value: any
        },
        lastName: {
            options: LabelValuePair[],
            value: any
        },
        gender: {
            options: LabelValuePair[],
            value: any
        },
        pregnancyStatus: {
            options: LabelValuePair[],
            value: any
        },
        occupation: {
            options: LabelValuePair[],
            value: any
        },
        ageDob: {
            options: LabelValuePair[],
            value: any
        },
        visualId: {
            options: LabelValuePair[],
            value: any
        },
        riskLevel:  {
            options: LabelValuePair[],
            value: any
        },
        riskReason: {
            options: LabelValuePair[],
            value: any
        },
        dateOfReporting: {
            options: LabelValuePair[],
            value: any
        },
        isDateOfReportingApproximate: {
            options: LabelValuePair[],
            value: any
        },
        currentAddresses: {
            options: LabelValuePair[],
            value: any
        }
    };

    /**
     * Constructor
     */
    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private i18nService: I18nService
    ) {
        super();
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get merge ids
        // retrieve query params
        this.displayLoading = true;
        this.route.queryParams
            .subscribe((params: { ids }) => {
                // record ids
                this.mergeRecordIds = JSON.parse(params.ids);

                // get selected outbreak
                this.outbreakDataService
                    .getSelectedOutbreak()
                    .subscribe((selectedOutbreak: OutbreakModel) => {
                        this.selectedOutbreak = selectedOutbreak;

                        // retrieve records
                        const qb = new RequestQueryBuilder();
                        qb.filter.bySelect(
                            'id',
                            this.mergeRecordIds,
                            true,
                            null
                        );

                        this.outbreakDataService
                            .getPeopleList(this.selectedOutbreak.id, qb)
                            .subscribe((recordMerge) => {
                                // merge records
                                this.mergeRecords = recordMerge;
                                // determine unique values
                                this.determineUniqueValues();
                                // hide loading dialog
                                this.displayLoading = false;
                            });
                    });
            });
    }

    /**
     * Determine dropdown values
     */
    determineUniqueValues() {
        // initialize
        this.uniqueOptions = {
            firstName: {
                options: [],
                value: undefined
            },
            middleName: {
                options: [],
                value: undefined
            },
            lastName: {
                options: [],
                value: undefined
            },
            gender: {
                options: [],
                value: undefined
            },
            pregnancyStatus: {
                options: [],
                value: undefined
            },
            occupation: {
                options: [],
                value: undefined
            },
            ageDob: {
                options: [],
                value: undefined
            },
            visualId: {
                options: [],
                value: undefined
            },
            riskLevel: {
                options: [],
                value: undefined
            },
            riskReason: {
                options: [],
                value: undefined
            },
            dateOfReporting: {
                options: [],
                value: undefined
            },
            isDateOfReportingApproximate: {
                options: [],
                value: undefined
            },
            currentAddresses: {
                options: [],
                value: undefined
            }
        };

        // determine uniques values
        if (this.mergeRecords) {
            this.uniqueOptions.firstName = EntityModel.uniqueStringOptions(this.mergeRecords, 'firstName');
            this.uniqueOptions.middleName = EntityModel.uniqueStringOptions(this.mergeRecords, 'middleName');
            this.uniqueOptions.lastName = EntityModel.uniqueStringOptions(this.mergeRecords, 'lastName');
            this.uniqueOptions.gender = EntityModel.uniqueStringOptions(this.mergeRecords, 'gender');
            this.uniqueOptions.pregnancyStatus = EntityModel.uniqueStringOptions(this.mergeRecords, 'pregnancyStatus');
            this.uniqueOptions.occupation = EntityModel.uniqueStringOptions(this.mergeRecords, 'occupation');
            this.uniqueOptions.ageDob = EntityModel.uniqueAgeDobOptions(
                this.mergeRecords,
                this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
                this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
            );
            this.uniqueOptions.visualId = EntityModel.uniqueStringOptions(this.mergeRecords, 'visualId');
            this.uniqueOptions.riskLevel = EntityModel.uniqueStringOptions(this.mergeRecords, 'riskLevel');
            this.uniqueOptions.riskReason = EntityModel.uniqueStringOptions(this.mergeRecords, 'riskReason');
            this.uniqueOptions.dateOfReporting = EntityModel.uniqueDateOptions(this.mergeRecords, 'dateOfReporting');
            this.uniqueOptions.isDateOfReportingApproximate = EntityModel.uniqueBooleanOptions(this.mergeRecords, 'isDateOfReportingApproximate');

            // merge all vaccines
            this.determineVaccines();

            // merge all documents
            this.determineDocuments();

            // merge all addresses, keep just one current address
            this.determineAddresses();
        }
    }

    /**
     * Determine vaccines
     */
    private determineVaccines() {
        // merge all vaccines
        this.contactOfContactData.vaccinesReceived = [];
        _.each(this.mergeRecords, (ent: EntityModel) => {
            _.each((ent.model as ContactOfContactModel).vaccinesReceived, (vac: VaccineModel) => {
                if (vac.vaccine) {
                    this.contactOfContactData.vaccinesReceived.push(vac);
                }
            });
        });
    }

    /**
     * Determine documents
     */
    private determineDocuments() {
        // merge all documents
        this.contactOfContactData.documents = [];
        _.each(this.mergeRecords, (ent: EntityModel) => {
            _.each((ent.model as ContactOfContactModel).documents, (doc: DocumentModel) => {
                if (doc.number || doc.type) {
                    this.contactOfContactData.documents.push(doc);
                }
            });
        });
    }

    /**
     * Determine address
     */
    private determineAddresses() {
        // merge all addresses, keep just one current address
        let currentAddress: AddressModel;
        this.contactOfContactData.addresses = [];
        _.each(this.mergeRecords, (ent: EntityModel) => {
            _.each((ent.model as ContactOfContactModel).addresses, (address: AddressModel) => {
                if (
                    address.locationId ||
                    address.fullAddress
                ) {
                    // current address ?
                    // if we have multiple current addresses then we need to change them to previously addresses
                    if (address.typeId === AddressType.CURRENT_ADDRESS) {
                        if (address.date) {
                            // we have multiple current addresses ?
                            if (currentAddress) {
                                // address is newer?
                                if (moment(currentAddress.date).isBefore(moment(address.date))) {
                                    currentAddress.typeId = AddressType.PREVIOUS_ADDRESS;
                                    this.contactOfContactData.addresses.push(currentAddress);
                                    currentAddress = address;
                                } else {
                                    address.typeId = AddressType.PREVIOUS_ADDRESS;
                                    this.contactOfContactData.addresses.push(address);
                                }
                            } else {
                                currentAddress = address;
                            }
                        } else {
                            this.uniqueOptions.currentAddresses.options.push(new LabelValuePair(
                                address.fullAddress,
                                address
                            ));
                        }
                    } else {
                        this.contactOfContactData.addresses.push(address);
                    }
                }
            });
        });

        // do we have a current address ?
        if (currentAddress) {
            this.uniqueOptions.currentAddresses.options.push(new LabelValuePair(
                `${currentAddress.fullAddress} ( ${moment(currentAddress.date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT)} )`,
                currentAddress
            ));
        }

        // preselect current address?
        if (this.uniqueOptions.currentAddresses.options.length === 1) {
            this.uniqueOptions.currentAddresses.value = this.uniqueOptions.currentAddresses.options[0].value;
            this.address = this.uniqueOptions.currentAddresses.value;
        }
    }

    /**
    /**
     * Address changed
     * @param data
     */
    changedAddress(data: LabelValuePair) {
        this.address = data ? data.value : new AddressModel();
    }

    /**
     * Create Contact of contact
     * @param {NgForm[]} stepForms
     */
    createNewContactOfContact(stepForms: NgForm[]) {
        // get forms fields
        const dirtyFields: any = this.formHelper.mergeFields(stepForms);

        // sanitize current Address
        if (dirtyFields.address) {
            // initialize addresses if there are no other addresses
            if (!dirtyFields.addresses) {
                dirtyFields.addresses = [];
            }

            // add current address
            dirtyFields.addresses.push(dirtyFields.address);

            // remove unnecessary data
            delete dirtyFields.address;
            delete dirtyFields.selectedAddress;
        }

        // sanitize age & dob information
        if (dirtyFields.ageDob) {
            dirtyFields.age = dirtyFields.ageDob.age;
            dirtyFields.dob = dirtyFields.ageDob.dob;

            // remove unnecessary data
            delete dirtyFields.ageDob;
        }

        // merge records
        if (!_.isEmpty(dirtyFields)) {
            if (this.formHelper.isFormsSetValid(stepForms)) {
                // add the new Contact of Contact
                this.displayLoading = true;
                this.outbreakDataService
                    .mergePeople(
                        this.selectedOutbreak.id,
                        EntityType.CONTACT_OF_CONTACT,
                        this.mergeRecordIds,
                        dirtyFields
                    )
                    .pipe(
                        catchError((err) => {
                            this.displayLoading = false;
                            this.snackbarService.showApiError(err);
                            return throwError(err);
                        })
                    )
                    .subscribe(() => {
                        this.snackbarService.showSuccess('LNG_PAGE_CONTACT_OF_CONTACT_MERGE_DUPLICATE_RECORDS_MERGE_CONTACTS_SUCCESS_MESSAGE');

                        // navigate to listing page
                        this.disableDirtyConfirm();
                        this.router.navigate(['/duplicated-records']);
                    });
            } else {
                this.snackbarService.showError('LNG_FORM_ERROR_FORM_INVALID');
            }
        }
    }
}

