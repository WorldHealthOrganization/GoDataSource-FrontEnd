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
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { DocumentModel } from '../../../../core/models/document.model';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { Constants } from '../../../../core/models/constants';
import { EntityType } from '../../../../core/models/entity-type';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { moment } from '../../../../core/helperClasses/x-moment';
import { VaccineModel } from '../../../../core/models/vaccine.model';
import { TeamDataService } from '../../../../core/services/data/team.data.service';

@Component({
    selector: 'app-contact-merge-duplicate-records',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contact-merge-duplicate-records.component.html',
    styleUrls: ['./contact-merge-duplicate-records.component.less']
})
export class ContactMergeDuplicateRecordsComponent extends ConfirmOnFormChanges implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_DUPLICATE_RECORDS_TITLE', '/duplicated-records'),
        new BreadcrumbItemModel('LNG_PAGE_CONTACT_MERGE_DUPLICATE_RECORDS_TITLE', '.', true)
    ];

    contactData: ContactModel = new ContactModel();

    selectedOutbreak: OutbreakModel;

    // loading flag - display spinner instead of table
    displayLoading: boolean = false;

    address: AddressModel = new AddressModel();
    questionnaireAnswers: any = {};

    mergeRecordIds: string[];
    mergeRecords: EntityModel[];

    teamNameMap: {
        [teamId: string]: string
    };

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
        followUpTeamId: {
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
        private i18nService: I18nService,
        private teamDataService: TeamDataService
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

                                // determine teams
                                this.determineTeams(() => {
                                    // determine unique values
                                    this.determineUniqueValues();

                                    // finished
                                    this.displayLoading = false;
                                });
                            });
                    });
            });
    }

    /**
     * Determine teams
     */
    determineTeams(finishedCallback: () => void) {
        // determine teams for which we need to retrieve names
        const teamIds: string[] = [];
        _.each(this.mergeRecords, (ent: EntityModel) => {
            if ((ent.model as ContactModel).followUpTeamId) {
                teamIds.push((ent.model as ContactModel).followUpTeamId);
            }
        });

        // retrieve teams
        if (teamIds.length < 1) {
            finishedCallback();
        } else {
            // construct query buuilder
            const qb = new RequestQueryBuilder();
            qb.fields(
                'id',
                'name'
            ).filter.bySelect(
                'id',
                teamIds,
                true,
                null
            );

            // retrieve teams
            this.teamDataService
                .getTeamsList(qb)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);
                        return throwError(err);
                    })
                )
                .subscribe((teams) => {
                    // map teams
                    this.teamNameMap = {};
                    teams.forEach((team) => {
                        this.teamNameMap[team.id] = team.name;
                    });

                    // finished
                    finishedCallback();
                });
        }
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
            followUpTeamId: {
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
            this.uniqueOptions.followUpTeamId = EntityModel.uniqueStringOptions(
                this.mergeRecords,
                'followUpTeamId',
                this.teamNameMap
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

            // determine questionnaire answers
            this.determineQuestionnaireAnswers();
        }
    }

    /**
     * Determine vaccines
     */
    private determineVaccines() {
        // merge all vaccines
        this.contactData.vaccinesReceived = [];
        _.each(this.mergeRecords, (ent: EntityModel) => {
            _.each((ent.model as ContactModel).vaccinesReceived, (vac: VaccineModel) => {
                if (vac.vaccine) {
                    this.contactData.vaccinesReceived.push(vac);
                }
            });
        });
    }

    /**
     * Determine documents
     */
    private determineDocuments() {
        // merge all documents
        this.contactData.documents = [];
        _.each(this.mergeRecords, (ent: EntityModel) => {
            _.each((ent.model as ContactModel).documents, (doc: DocumentModel) => {
                if (doc.number || doc.type) {
                    this.contactData.documents.push(doc);
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
        this.contactData.addresses = [];
        _.each(this.mergeRecords, (ent: EntityModel) => {
            _.each((ent.model as ContactModel).addresses, (address: AddressModel) => {
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
                                    this.contactData.addresses.push(currentAddress);
                                    currentAddress = address;
                                } else {
                                    address.typeId = AddressType.PREVIOUS_ADDRESS;
                                    this.contactData.addresses.push(address);
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
                        this.contactData.addresses.push(address);
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
            const model: ContactModel = ent.model as ContactModel;
            if (!_.isEmpty(model.questionnaireAnswers)) {
                this.uniqueOptions.questionnaireAnswers.options.push(new LabelValuePair(
                    model.name,
                    model.questionnaireAnswers
                ));
            }
        });

        // preselect questionnaire answer if we have only one
        if (this.uniqueOptions.questionnaireAnswers.options.length === 1) {
            this.uniqueOptions.questionnaireAnswers.value = this.uniqueOptions.questionnaireAnswers.options[0].value;
            this.questionnaireAnswers = this.uniqueOptions.questionnaireAnswers.value;
        }
    }

    /**
     * Questionnaire answers changed
     * @param data
     */
    changedQuestionnaireAnswers(data: LabelValuePair) {
        this.questionnaireAnswers = data ? data.value : {};
    }

    /**
     * Address changed
     * @param data
     */
    changedAddress(data: LabelValuePair) {
        this.address = data ? data.value : new AddressModel();
    }

    /**
     * Create Contact
     * @param {NgForm[]} stepForms
     */
    createNewContact(stepForms: NgForm[]) {
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
                        EntityType.CONTACT,
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
                        this.snackbarService.showSuccess('LNG_PAGE_CONTACT_MERGE_DUPLICATE_RECORDS_MERGE_CONTACTS_SUCCESS_MESSAGE');

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
