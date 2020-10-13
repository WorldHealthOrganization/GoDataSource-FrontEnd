import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import * as _ from 'lodash';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { DocumentModel } from '../../../../core/models/document.model';
import { Constants } from '../../../../core/models/constants';
import { NgForm } from '@angular/forms';
import { EntityType } from '../../../../core/models/entity-type';
import { CaseCenterDateRangeModel } from '../../../../core/models/case-center-date-range.model';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { moment } from '../../../../core/helperClasses/x-moment';
import { VaccineModel } from '../../../../core/models/vaccine.model';

@Component({
    selector: 'app-case-merge-duplicate-records',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './case-merge-duplicate-records.component.html',
    styleUrls: ['./case-merge-duplicate-records.component.less']
})
export class CaseMergeDuplicateRecordsComponent extends ConfirmOnFormChanges implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_DUPLICATE_RECORDS_TITLE', '/duplicated-records'),
        new BreadcrumbItemModel('LNG_PAGE_CASE_MERGE_DUPLICATE_RECORDS_TITLE', '.', true)
    ];

    caseData: CaseModel = new CaseModel();

    // selected outbreak
    selectedOutbreak: OutbreakModel;

    // loading flag - display spinner instead of table
    displayLoading: boolean = false;

    address: AddressModel = new AddressModel();
    questionnaireAnswers: any = {};

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
        visualId:  {
            options: LabelValuePair[],
            value: any
        },
        riskLevel:  {
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
        transferRefused: {
            options: LabelValuePair[],
            value: any
        },
        riskReason: {
            options: LabelValuePair[],
            value: any
        },
        currentAddresses: {
            options: LabelValuePair[],
            value: any
        },
        classification: {
            options: LabelValuePair[],
            value: any
        },
        dateOfOnset: {
            options: LabelValuePair[],
            value: any
        },
        isDateOfOnsetApproximate: {
            options: LabelValuePair[],
            value: any
        },
        dateBecomeCase: {
            options: LabelValuePair[],
            value: any
        },
        dateOfInfection: {
            options: LabelValuePair[],
            value: any
        },
        outcomeId: {
            options: LabelValuePair[],
            value: any
        },
        dateOfOutcome: {
            options: LabelValuePair[],
            value: any
        },
        dateOfBurial: {
            options: LabelValuePair[],
            value: any
        },
        dateRanges: {
            option: LabelValuePair[],
            value: any
        },
        safeBurial: {
            options: LabelValuePair[],
            value: any
        },
        questionnaireAnswers: {
            options: LabelValuePair[],
            value: any
        }
    };

    // constants
    Constants = Constants;

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

                                // finished
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
            dateOfReporting: {
                options: [],
                value: undefined
            },
            isDateOfReportingApproximate: {
                options: [],
                value: undefined
            },
            transferRefused: {
                options: [],
                value: undefined
            },
            riskReason: {
                options: [],
                value: undefined
            },
            currentAddresses: {
                options: [],
                value: undefined
            },
            classification: {
                options: [],
                value: undefined
            },
            dateOfOnset: {
                options: [],
                value: undefined
            },
            isDateOfOnsetApproximate: {
                options: [],
                value: undefined
            },
            dateBecomeCase: {
                options: [],
                value: undefined
            },
            dateOfInfection: {
                options: [],
                value: undefined
            },
            outcomeId: {
                options: [],
                value: undefined
            },
            dateOfOutcome: {
                options: [],
                value: undefined
            },
            dateRanges: {
                option: [],
                value: undefined
            },
            dateOfBurial: {
                options: [],
                value: undefined
            },
            safeBurial: {
                options: [],
                value: undefined
            },
            questionnaireAnswers: {
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
            this.uniqueOptions.pregnancyStatus = EntityModel.uniqueStringOptions(this.mergeRecords, 'pregnancyStatus');
            this.uniqueOptions.occupation = EntityModel.uniqueStringOptions(this.mergeRecords, 'occupation');
            this.uniqueOptions.ageDob = EntityModel.uniqueAgeDobOptions(
                this.mergeRecords,
                this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
                this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
            );
            this.uniqueOptions.visualId = EntityModel.uniqueStringOptions(this.mergeRecords, 'visualId');
            this.uniqueOptions.riskLevel = EntityModel.uniqueStringOptions(this.mergeRecords, 'riskLevel');
            this.uniqueOptions.dateOfReporting = EntityModel.uniqueDateOptions(this.mergeRecords, 'dateOfReporting');
            this.uniqueOptions.isDateOfReportingApproximate = EntityModel.uniqueBooleanOptions(this.mergeRecords, 'isDateOfReportingApproximate');
            this.uniqueOptions.transferRefused = EntityModel.uniqueBooleanOptions(this.mergeRecords, 'transferRefused');
            this.uniqueOptions.riskReason = EntityModel.uniqueStringOptions(this.mergeRecords, 'riskReason');
            this.uniqueOptions.classification = EntityModel.uniqueStringOptions(this.mergeRecords, 'classification');
            this.uniqueOptions.dateOfOnset = EntityModel.uniqueDateOptions(this.mergeRecords, 'dateOfOnset');
            this.uniqueOptions.isDateOfOnsetApproximate = EntityModel.uniqueBooleanOptions(this.mergeRecords, 'isDateOfOnsetApproximate');
            this.uniqueOptions.dateBecomeCase = EntityModel.uniqueDateOptions(this.mergeRecords, 'dateBecomeCase');
            this.uniqueOptions.dateOfInfection = EntityModel.uniqueDateOptions(this.mergeRecords, 'dateOfInfection');
            this.uniqueOptions.outcomeId = EntityModel.uniqueStringOptions(this.mergeRecords, 'outcomeId');
            this.uniqueOptions.dateOfOutcome = EntityModel.uniqueDateOptions(this.mergeRecords, 'dateOfOutcome');
            this.uniqueOptions.dateOfBurial = EntityModel.uniqueDateOptions(this.mergeRecords, 'dateOfBurial');
            this.uniqueOptions.safeBurial = EntityModel.uniqueBooleanOptions(this.mergeRecords, 'safeBurial');

            // merge all vaccines
            this.determineVaccines();

            // merge all documents
            this.determineDocuments();

            // merge all addresses, keep just one current address
            this.determineAddresses();

            // merge all dates
            this.determineDateRanges();

            // determine questionnaire answers
            this.determineQuestionnaireAnswers();
        }
    }

    /**
     * Determine vaccines
     */
    private determineVaccines() {
        // merge all documents
        this.caseData.vaccinesReceived = [];
        _.each(this.mergeRecords, (ent: EntityModel) => {
            _.each((ent.model as CaseModel).vaccinesReceived, (vac: VaccineModel) => {
                if (vac.vaccine) {
                    this.caseData.vaccinesReceived.push(vac);
                }
            });
        });
    }

    /**
     * Determine documents
     */
    private determineDocuments() {
        // merge all vaccines
        this.caseData.documents = [];
        _.each(this.mergeRecords, (ent: EntityModel) => {
            _.each((ent.model as CaseModel).documents, (doc: DocumentModel) => {
                if (doc.number || doc.type) {
                    this.caseData.documents.push(doc);
                }
            });
        });
    }

    /**
     * Determine date ranges
     */
    private determineDateRanges() {
        // merge all hospitalization dates
        this.caseData.dateRanges = [];
        _.each(this.mergeRecords, (ent: EntityModel) => {
            _.each((ent.model as CaseModel).dateRanges, (date: CaseCenterDateRangeModel) => {
                if (date.startDate || date.endDate) {
                    this.caseData.dateRanges.push(date);
                }
            });
        });
    }

    /**
     * Determine addresses
     */
    private determineAddresses() {
        // merge all addresses, keep just one current address
        let currentAddress: AddressModel;
        this.caseData.addresses = [];
        _.each(this.mergeRecords, (ent: EntityModel) => {
            _.each((ent.model as CaseModel).addresses, (address: AddressModel) => {
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
                                    this.caseData.addresses.push(currentAddress);
                                    currentAddress = address;
                                } else {
                                    address.typeId = AddressType.PREVIOUS_ADDRESS;
                                    this.caseData.addresses.push(address);
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
                        this.caseData.addresses.push(address);
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

        // preselect current address ?
        if (this.uniqueOptions.currentAddresses.options.length === 1) {
            this.uniqueOptions.currentAddresses.value = this.uniqueOptions.currentAddresses.options[0].value;
            this.address = this.uniqueOptions.currentAddresses.value;
        }
    }

    /**
     * Determine questionnaire answers
     */
    private determineQuestionnaireAnswers() {
        // add questionnaire answers
        _.each(this.mergeRecords, (ent: EntityModel) => {
            const model: CaseModel = ent.model as CaseModel;
            if (!_.isEmpty(model.questionnaireAnswers)) {
                this.uniqueOptions.questionnaireAnswers.options.push(new LabelValuePair(
                    model.name,
                    model.questionnaireAnswers
                ));
            }
        });

        // preselect questionnaire answer oif we have only one
        if (this.uniqueOptions.questionnaireAnswers.options.length === 1) {
            this.uniqueOptions.questionnaireAnswers.value = this.uniqueOptions.questionnaireAnswers.options[0].value;
            this.questionnaireAnswers = this.uniqueOptions.questionnaireAnswers.value;
        }
    }

    /**
     * Address changed
     * @param data
     */
    changedAddress(data: LabelValuePair) {
        this.address = data ? data.value : new AddressModel();
    }

    /**
     * Questionnaire answers changed
     * @param data
     */
    changedQuestionnaireAnswers(data: LabelValuePair) {
        this.questionnaireAnswers = data ? data.value : {};
    }

    /**
     * Merge all cases into a new case
     * @param stepForms
     */
    createNewCase(stepForms: NgForm[]) {
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

        // sanitize questionnaire answers
        delete dirtyFields.selectedQuestionnaireAnswers;

        // merge records
        if (!_.isEmpty(dirtyFields)) {
            if (this.formHelper.isFormsSetValid(stepForms)) {
                // add the new Contact
                this.displayLoading = true;
                this.outbreakDataService
                    .mergePeople(
                        this.selectedOutbreak.id,
                        EntityType.CASE,
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
                        this.snackbarService.showSuccess('LNG_PAGE_CASE_MERGE_DUPLICATE_RECORDS_MERGE_CASES_SUCCESS_MESSAGE');

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
