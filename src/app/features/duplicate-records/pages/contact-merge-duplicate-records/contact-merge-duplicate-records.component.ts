import * as _ from 'lodash';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { EntityModel } from '../../../../core/models/entity.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { DocumentModel } from '../../../../core/models/document.model';

@Component({
    selector: 'app-contact-merge-duplicate-records',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contact-merge-duplicate-records.component.html',
    styleUrls: ['./contact-merge-duplicate-records.component.less']
})
export class ContactMergeDuplicateRecordsComponent extends ConfirmOnFormChanges implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_DUPLICATE_RECORDS_TITLE', '/duplicated-records'),
        new BreadcrumbItemModel('LNG_PAGE_CONTACT_MERGE_DUPLICATE_RECORDS_TITLE', '.', true)
    ];

    contactData: ContactModel = new ContactModel();

    // selected outbreak ID
    outbreakId: string;

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
        phoneNumber: {
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
        dateOfReporting: {
            options: LabelValuePair[],
            value: any
        },
        isDateOfReportingApproximate: {
            options: LabelValuePair[],
            value: any
        }
    };

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

    ngOnInit() {
        // get merge ids
        // retrieve query params
        this.route.queryParams
            .subscribe((params: { ids }) => {
                // record ids
                this.mergeRecordIds = JSON.parse(params.ids);

                // get selected outbreak
                this.outbreakDataService
                    .getSelectedOutbreak()
                    .subscribe((selectedOutbreak: OutbreakModel) => {
                        this.outbreakId = selectedOutbreak.id;

                        // retrieve records
                        const qb = new RequestQueryBuilder();
                        qb.filter.bySelect(
                            'id',
                            this.mergeRecordIds,
                            true,
                            null
                        );
                        this.outbreakDataService
                            .getPeopleList(this.outbreakId, qb)
                            .subscribe((recordMerge) => {
                                // merge records
                                this.mergeRecords = recordMerge;

                                // determine unique values
                                this.determineUniqueValues();
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
            phoneNumber: {
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
            dateOfReporting: {
                options: [],
                value: undefined
            },
            isDateOfReportingApproximate: {
                options: [],
                value: undefined
            }
        };

        // determine unique values
        if (this.mergeRecords) {
            this.uniqueOptions.firstName = EntityModel.uniqueStringOptions(this.mergeRecords, 'firstName');
            this.uniqueOptions.middleName = EntityModel.uniqueStringOptions(this.mergeRecords, 'middleName');
            this.uniqueOptions.lastName = EntityModel.uniqueStringOptions(this.mergeRecords, 'lastName');
            this.uniqueOptions.gender = EntityModel.uniqueStringOptions(this.mergeRecords, 'gender');
            this.uniqueOptions.phoneNumber = EntityModel.uniqueStringOptions(this.mergeRecords, 'phoneNumber');
            this.uniqueOptions.occupation = EntityModel.uniqueStringOptions(this.mergeRecords, 'occupation');
            this.uniqueOptions.occupation = EntityModel.uniqueStringOptions(this.mergeRecords, 'occupation');
            this.uniqueOptions.ageDob = EntityModel.uniqueAgeDobOptions(
                this.mergeRecords,
                this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
                this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
            );
            this.uniqueOptions.dateOfReporting = EntityModel.uniqueStringOptions(this.mergeRecords, 'dateOfReporting');
            this.uniqueOptions.isDateOfReportingApproximate = EntityModel.uniqueBooleanOptions(this.mergeRecords, 'isDateOfReportingApproximate');

            // merge all documents
            this.contactData.documents = [];
            _.each(this.mergeRecords, (ent: EntityModel) => {
                _.each((ent.model as ContactModel).documents, (doc: DocumentModel) => {
                    if (doc.number || doc.type) {
                        this.contactData.documents.push(doc);
                    }
                });
            });

            // merge all addresses
            // const currentAddress: AddressModel;
            // this.contactData.addresses = [];
            // _.each(this.mergeRecords, (ent: EntityModel) => {
            //     _.each((ent.model as ContactModel).addresses, (address: AddressModel) => {
            //         if (
            //             address.date ||
            //             address.locationId ||
            //             address.fullAddress
            //         ) {
            //             // current address ?
            //             // if we have multiple current addresses then we need to change them to previously addresses
            //             if (address.typeId === AddressType.CURRENT_ADDRESS) {
            //                 if (currentAddress) {
            //
            //                 } else {
            //                     currentAddress = address;
            //                 }
            //             }
            //         }
            //     });
            // });

        }
    }

    /**
     * Create Contact
     * @param {NgForm[]} stepForms
     */
    createNewContact(stepForms: NgForm[]) {
        // // get forms fields
        // const dirtyFields: any = this.formHelper.mergeFields(stepForms);
        // const relationship = _.get(dirtyFields, 'relationship');
        // delete dirtyFields.relationship;
        //
        // // add age & dob information
        // if (dirtyFields.ageDob) {
        //     dirtyFields.age = dirtyFields.ageDob.age;
        //     dirtyFields.dob = dirtyFields.ageDob.dob;
        //     delete dirtyFields.ageDob;
        // }
        //
        // // create relationship & contact
        // if (
        //     this.formHelper.isFormsSetValid(stepForms) &&
        //     !_.isEmpty(dirtyFields) &&
        //     !_.isEmpty(relationship)
        // ) {
        //     // add the new Contact
        //     this.contactDataService
        //         .createContact(this.outbreakId, dirtyFields)
        //         .catch((err) => {
        //             this.snackbarService.showApiError(err);
        //
        //             return ErrorObservable.create(err);
        //         })
        //         .subscribe((contactData: ContactModel) => {
        //             this.relationshipDataService
        //                 .createRelationship(
        //                     this.outbreakId,
        //                     EntityType.CONTACT,
        //                     contactData.id,
        //                     relationship
        //                 )
        //                 .catch((err) => {
        //                     // display error message
        //                     this.snackbarService.showApiError(err);
        //
        //                     // remove contact
        //                     this.contactDataService
        //                         .deleteContact(this.outbreakId, contactData.id)
        //                         .catch((errDC) => {
        //                             return ErrorObservable.create(errDC);
        //                         })
        //                         .subscribe();
        //
        //                     // finished
        //                     return ErrorObservable.create(err);
        //                 })
        //                 .subscribe(() => {
        //                     this.snackbarService.showSuccess('LNG_PAGE_CREATE_CONTACT_ACTION_CREATE_CONTACT_SUCCESS_MESSAGE');
        //
        //                     // navigate to listing page
        //                     this.disableDirtyConfirm();
        //                     this.router.navigate([`/relationships/${this.entityType}/${this.entityId}`]);
        //                 });
        //         });
        // }
    }
}
