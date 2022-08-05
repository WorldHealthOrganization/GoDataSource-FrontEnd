import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { CaseModel } from '../../../../core/models/case.model';
import { ActivatedRoute, Router } from '@angular/router';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { Observable, throwError } from 'rxjs';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import {
  CreateViewModifyV2TabInputType,
  ICreateViewModifyV2Buttons,
  ICreateViewModifyV2CreateOrUpdate,
  ICreateViewModifyV2Tab, ICreateViewModifyV2TabTable
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { Constants } from '../../../../core/models/constants';
import { UserModel } from '../../../../core/models/user.model';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { moment } from '../../../../core/helperClasses/x-moment';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { catchError, takeUntil } from 'rxjs/operators';
import { EntityType } from '../../../../core/models/entity-type';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { LocationModel } from '../../../../core/models/location.model';

/**
 * Component
 */
@Component({
  selector: 'app-case-merge-duplicate-records',
  templateUrl: 'case-merge-duplicate-records.component.html'
})
export class CaseMergeDuplicateRecordsComponent extends CreateViewModifyComponent<CaseModel> implements OnDestroy {
  // data
  private _mergeRecordIds: string[];
  private _uniqueOptions: {
    firstName: ILabelValuePairModel[],
    middleName: ILabelValuePairModel[],
    lastName: ILabelValuePairModel[],
    gender: ILabelValuePairModel[],
    pregnancyStatus: ILabelValuePairModel[],
    occupation: ILabelValuePairModel[],
    age: ILabelValuePairModel[],
    dob: ILabelValuePairModel[],
    visualId: ILabelValuePairModel[],
    responsibleUserId: ILabelValuePairModel[],
    classification: ILabelValuePairModel[],
    dateOfOnset: ILabelValuePairModel[],
    isDateOfOnsetApproximate: ILabelValuePairModel[],
    dateBecomeCase: ILabelValuePairModel[],
    dateOfInfection: ILabelValuePairModel[],
    investigationStatus: ILabelValuePairModel[],
    dateInvestigationCompleted: ILabelValuePairModel[],
    outcomeId: ILabelValuePairModel[],
    dateOfOutcome: ILabelValuePairModel[],
    transferRefused: ILabelValuePairModel[],
    safeBurial: ILabelValuePairModel[],
    dateOfBurial: ILabelValuePairModel[],
    burialLocationId: ILabelValuePairModel[],
    burialPlaceName: ILabelValuePairModel[],
    dateOfReporting: ILabelValuePairModel[],
    isDateOfReportingApproximate: ILabelValuePairModel[],
    riskLevel: ILabelValuePairModel[],
    riskReason: ILabelValuePairModel[],
    questionnaireAnswers: ILabelValuePairModel[],
    questionnaireHistoryAnswers: ILabelValuePairModel[]
  };
  private _selectedQuestionnaireAnswers: number;
  private _selectedQuestionnaireHistoryAnswers: number;

  /**
   * Constructor
   */
  constructor(
    protected router: Router,
    protected activatedRoute: ActivatedRoute,
    protected caseDataService: CaseDataService,
    protected translateService: TranslateService,
    protected toastV2Service: ToastV2Service,
    protected dialogV2Service: DialogV2Service,
    protected entityDataService: EntityDataService,
    protected outbreakDataService: OutbreakDataService,
    protected locationDataService: LocationDataService,
    authDataService: AuthDataService,
    renderer2: Renderer2,
    redirectService: RedirectService
  ) {
    super(
      toastV2Service,
      renderer2,
      redirectService,
      activatedRoute,
      authDataService
    );

    // retrieve cases ids
    this._mergeRecordIds = JSON.parse(this.activatedRoute.snapshot.queryParams.ids);
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // parent
    super.onDestroy();
  }

  /**
   * Create new item model if needed
   */
  protected createNewItem(): CaseModel {
    return null;
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(): Observable<CaseModel> {
    return new Observable<CaseModel>((subscriber) => {
      // retrieve records
      const qb = new RequestQueryBuilder();
      qb.filter.bySelect(
        'id',
        this._mergeRecordIds,
        true,
        null
      );

      // records
      this.outbreakDataService
        .getPeopleList(this.selectedOutbreak.id, qb)
        .pipe(
          catchError((err) => {
            subscriber.error(err);
            return throwError(err);
          })
        )
        .subscribe((mergeRecords) => {
          // determine data
          this._uniqueOptions = {
            firstName: this.getFieldOptions(
              mergeRecords,
              'firstName'
            ).options,
            middleName: this.getFieldOptions(
              mergeRecords,
              'middleName'
            ).options,
            lastName: this.getFieldOptions(
              mergeRecords,
              'lastName'
            ).options,
            gender: this.getFieldOptions(
              mergeRecords,
              'gender'
            ).options,
            pregnancyStatus: this.getFieldOptions(
              mergeRecords,
              'pregnancyStatus'
            ).options,
            occupation: this.getFieldOptions(
              mergeRecords,
              'occupation'
            ).options,
            age: this.getFieldOptions(
              mergeRecords,
              'age'
            ).options,
            dob: this.getFieldOptions(
              mergeRecords,
              'dob'
            ).options,
            visualId: this.getFieldOptions(
              mergeRecords,
              'visualId'
            ).options,
            responsibleUserId: this.getFieldOptions(
              mergeRecords,
              'responsibleUserId'
            ).options,
            classification: this.getFieldOptions(
              mergeRecords,
              'classification'
            ).options,
            dateOfOnset: this.getFieldOptions(
              mergeRecords,
              'dateOfOnset'
            ).options,
            isDateOfOnsetApproximate: this.getFieldOptions(
              mergeRecords,
              'isDateOfOnsetApproximate'
            ).options,
            dateBecomeCase: this.getFieldOptions(
              mergeRecords,
              'dateBecomeCase'
            ).options,
            dateOfInfection: this.getFieldOptions(
              mergeRecords,
              'dateOfInfection'
            ).options,
            investigationStatus: this.getFieldOptions(
              mergeRecords,
              'investigationStatus'
            ).options,
            dateInvestigationCompleted: this.getFieldOptions(
              mergeRecords,
              'dateInvestigationCompleted'
            ).options,
            outcomeId: this.getFieldOptions(
              mergeRecords,
              'outcomeId'
            ).options,
            dateOfOutcome: this.getFieldOptions(
              mergeRecords,
              'dateOfOutcome'
            ).options,
            transferRefused: this.getFieldOptions(
              mergeRecords,
              'transferRefused'
            ).options,
            safeBurial: this.getFieldOptions(
              mergeRecords,
              'safeBurial'
            ).options,
            dateOfBurial: this.getFieldOptions(
              mergeRecords,
              'dateOfBurial'
            ).options,
            burialLocationId: this.getFieldOptions(
              mergeRecords,
              'burialLocationId'
            ).options,
            burialPlaceName: this.getFieldOptions(
              mergeRecords,
              'burialPlaceName'
            ).options,
            dateOfReporting: this.getFieldOptions(
              mergeRecords,
              'dateOfReporting'
            ).options,
            isDateOfReportingApproximate: this.getFieldOptions(
              mergeRecords,
              'isDateOfReportingApproximate'
            ).options,
            riskLevel: this.getFieldOptions(
              mergeRecords,
              'riskLevel'
            ).options,
            riskReason: this.getFieldOptions(
              mergeRecords,
              'riskReason'
            ).options,
            questionnaireAnswers: mergeRecords
              .filter((item) => (item.model as CaseModel).questionnaireAnswers && Object.keys((item.model as CaseModel).questionnaireAnswers).length > 0)
              .map((item, index) => ({
                label: `${this.translateService.instant('LNG_PAGE_MODIFY_CASE_TAB_QUESTIONNAIRE_TITLE')} ${index + 1}`,
                value: index,
                data: (item.model as CaseModel).questionnaireAnswers
              })),
            questionnaireHistoryAnswers: mergeRecords
              .filter((item) => (item.model as CaseModel).questionnaireAnswersContact && Object.keys((item.model as CaseModel).questionnaireAnswersContact).length > 0)
              .map((item, index) => ({
                label: `${this.translateService.instant(EntityType.CONTACT)} ${this.translateService.instant('LNG_PAGE_MODIFY_CASE_TAB_CONTACT_QUESTIONNAIRE_TITLE')} ${index + 1}`,
                value: index,
                data: (item.model as CaseModel).questionnaireAnswersContact
              }))
          };

          // auto-select if only one value
          const data: CaseModel = new CaseModel();
          data.firstName = this._uniqueOptions.firstName.length === 1 ?
            this._uniqueOptions.firstName[0].value :
            data.firstName;
          data.middleName = this._uniqueOptions.middleName.length === 1 ?
            this._uniqueOptions.middleName[0].value :
            data.middleName;
          data.lastName = this._uniqueOptions.lastName.length === 1 ?
            this._uniqueOptions.lastName[0].value :
            data.lastName;
          data.gender = this._uniqueOptions.gender.length === 1 ?
            this._uniqueOptions.gender[0].value :
            data.gender;
          data.pregnancyStatus = this._uniqueOptions.pregnancyStatus.length === 1 ?
            this._uniqueOptions.pregnancyStatus[0].value :
            data.pregnancyStatus;
          data.occupation = this._uniqueOptions.occupation.length === 1 ?
            this._uniqueOptions.occupation[0].value :
            data.occupation;
          data.age = this._uniqueOptions.age.length === 1 ?
            this._uniqueOptions.age[0].value :
            data.age;
          data.dob = this._uniqueOptions.dob.length === 1 ?
            this._uniqueOptions.dob[0].value :
            data.dob;
          data.visualId = this._uniqueOptions.visualId.length === 1 ?
            this._uniqueOptions.visualId[0].value :
            data.visualId;
          data.responsibleUserId = this._uniqueOptions.responsibleUserId.length === 1 ?
            this._uniqueOptions.responsibleUserId[0].value :
            data.responsibleUserId;
          data.classification = this._uniqueOptions.classification.length === 1 ?
            this._uniqueOptions.classification[0].value :
            data.classification;
          data.dateOfOnset = this._uniqueOptions.dateOfOnset.length === 1 ?
            this._uniqueOptions.dateOfOnset[0].value :
            data.dateOfOnset;
          data.isDateOfOnsetApproximate = this._uniqueOptions.isDateOfOnsetApproximate.length === 1 ?
            this._uniqueOptions.isDateOfOnsetApproximate[0].value :
            data.isDateOfOnsetApproximate;
          data.dateBecomeCase = this._uniqueOptions.dateBecomeCase.length === 1 ?
            this._uniqueOptions.dateBecomeCase[0].value :
            data.dateBecomeCase;
          data.dateOfInfection = this._uniqueOptions.dateOfInfection.length === 1 ?
            this._uniqueOptions.dateOfInfection[0].value :
            data.dateOfInfection;
          data.investigationStatus = this._uniqueOptions.investigationStatus.length === 1 ?
            this._uniqueOptions.investigationStatus[0].value :
            data.investigationStatus;
          data.dateInvestigationCompleted = this._uniqueOptions.dateInvestigationCompleted.length === 1 ?
            this._uniqueOptions.dateInvestigationCompleted[0].value :
            data.dateInvestigationCompleted;
          data.outcomeId = this._uniqueOptions.outcomeId.length === 1 ?
            this._uniqueOptions.outcomeId[0].value :
            data.outcomeId;
          data.dateOfOutcome = this._uniqueOptions.dateOfOutcome.length === 1 ?
            this._uniqueOptions.dateOfOutcome[0].value :
            data.dateOfOutcome;
          data.transferRefused = this._uniqueOptions.transferRefused.length === 1 ?
            this._uniqueOptions.transferRefused[0].value :
            data.transferRefused;
          data.safeBurial = this._uniqueOptions.safeBurial.length === 1 ?
            this._uniqueOptions.safeBurial[0].value :
            data.safeBurial;
          data.dateOfBurial = this._uniqueOptions.dateOfBurial.length === 1 ?
            this._uniqueOptions.dateOfBurial[0].value :
            data.dateOfBurial;
          data.burialLocationId = this._uniqueOptions.burialLocationId.length === 1 ?
            this._uniqueOptions.burialLocationId[0].value :
            data.burialLocationId;
          data.burialPlaceName = this._uniqueOptions.burialPlaceName.length === 1 ?
            this._uniqueOptions.burialPlaceName[0].value :
            data.burialPlaceName;
          data.dateOfReporting = this._uniqueOptions.dateOfReporting.length === 1 ?
            this._uniqueOptions.dateOfReporting[0].value :
            data.dateOfReporting;
          data.isDateOfReportingApproximate = this._uniqueOptions.isDateOfReportingApproximate.length === 1 ?
            this._uniqueOptions.isDateOfReportingApproximate[0].value :
            data.isDateOfReportingApproximate;
          data.riskLevel = this._uniqueOptions.riskLevel.length === 1 ?
            this._uniqueOptions.riskLevel[0].value :
            data.riskLevel;
          data.riskReason = this._uniqueOptions.riskReason.length === 1 ?
            this._uniqueOptions.riskReason[0].value :
            data.riskReason;

          // reset data if not decease
          if (data.outcomeId !== Constants.OUTCOME_STATUS.DECEASED) {
            data.safeBurial = null;
            data.dateOfBurial = null;
            data.burialLocationId = null;
            data.burialPlaceName = null;
          }

          // select questionnaire answers
          this._selectedQuestionnaireAnswers = this._uniqueOptions.questionnaireAnswers.length === 1 ?
            this._uniqueOptions.questionnaireAnswers[0].value :
            this._selectedQuestionnaireAnswers;
          if (
            this._selectedQuestionnaireAnswers ||
            this._selectedQuestionnaireAnswers === 0
          ) {
            data.questionnaireAnswers = this._uniqueOptions.questionnaireAnswers[this._selectedQuestionnaireAnswers].data;
          }

          // select questionnaire history answers
          this._selectedQuestionnaireHistoryAnswers = this._uniqueOptions.questionnaireHistoryAnswers.length === 1 ?
            this._uniqueOptions.questionnaireHistoryAnswers[0].value :
            this._selectedQuestionnaireHistoryAnswers;
          if (
            this._selectedQuestionnaireHistoryAnswers ||
            this._selectedQuestionnaireHistoryAnswers === 0
          ) {
            data.questionnaireAnswersContact = this._uniqueOptions.questionnaireHistoryAnswers[this._selectedQuestionnaireHistoryAnswers].data;
          }

          // initialize documents, addresses ...
          const addedDocs: {
            [key: string]: true
          } = {};
          data.documents = [];
          let currentAddress: AddressModel;
          data.addresses = [];
          data.vaccinesReceived = [];
          data.dateRanges = [];

          // go through records and determine data
          mergeRecords.forEach((item) => {
            // determine documents
            ((item.model as CaseModel).documents || []).forEach((doc) => {
              // determine doc key
              const key: string = `${doc.type ? doc.type.trim() : ''}${doc.number ? doc.number.trim() : ''}`;

              // add to list ?
              if (
                key &&
                !addedDocs[key]
              ) {
                // add to list
                data.documents.push(doc);

                // make sure we don't add it again
                addedDocs[key] = true;
              }
            });

            // determine addresses
            ((item.model as CaseModel).addresses || []).forEach((address) => {
              // add to list ?
              if (
                address.locationId ||
                address.fullAddress
              ) {
                // current address ?
                // if we have multiple current addresses then we change them to previously addresses and keep the freshest one by address.date
                if (address.typeId === AddressType.CURRENT_ADDRESS) {
                  if (address.date) {
                    // we have multiple current addresses ?
                    if (currentAddress) {
                      // address is newer?
                      if (
                        !currentAddress.date ||
                        moment(currentAddress.date).isBefore(moment(address.date))
                      ) {
                        currentAddress.typeId = AddressType.PREVIOUS_ADDRESS;
                        data.addresses.push(currentAddress);
                        currentAddress = address;
                      } else {
                        address.typeId = AddressType.PREVIOUS_ADDRESS;
                        data.addresses.push(address);
                      }
                    } else {
                      currentAddress = address;
                    }
                  } else {
                    if (currentAddress) {
                      // make it previous address
                      address.typeId = AddressType.PREVIOUS_ADDRESS;
                      data.addresses.push(address);
                    } else {
                      currentAddress = address;
                    }
                  }
                } else {
                  data.addresses.push(address);
                }
              }
            });

            // determine vaccines
            ((item.model as CaseModel).vaccinesReceived || []).forEach((vaccine) => {
              if (vaccine.vaccine) {
                // add to list
                data.vaccinesReceived.push(vaccine);
              }
            });

            // determine date ranges
            ((item.model as CaseModel).dateRanges || []).forEach((dateRange) => {
              if (
                dateRange.typeId ||
                dateRange.startDate ||
                dateRange.endDate
              ) {
                // add to list
                data.dateRanges.push(dateRange);
              }
            });
          });

          // do we have a recent current address ?
          if (currentAddress) {
            // put it first
            data.addresses.unshift(currentAddress);
          }

          // must retrieve locations ?
          if (this._uniqueOptions.burialLocationId.length < 1) {
            // nope, we have everything
            subscriber.next(data);
            subscriber.complete();
          } else {
            // create unique list of locations ids
            const locationIdsMap: {
              [locationId: string]: true
            } = {};
            this._uniqueOptions.burialLocationId.forEach((item) => {
              locationIdsMap[item.value] = true;
            });

            // construct location query builder
            const qbLocations = new RequestQueryBuilder();
            qbLocations.fields(
              'id',
              'name'
            );
            qbLocations.filter.bySelect(
              'id',
              Object.keys(locationIdsMap),
              true,
              null
            );

            // retrieve locations
            this.locationDataService
              .getLocationsList(qbLocations)
              .pipe(
                catchError((err) => {
                  subscriber.error(err);
                  return throwError(err);
                })
              )
              .subscribe((locations) => {
                // map locations
                const locationsMap: {
                  [locationId: string]: LocationModel
                } = {};
                locations.forEach((location) => {
                  locationsMap[location.id] = location;
                });

                // replace burial location labels
                this._uniqueOptions.burialLocationId.forEach((item) => {
                  item.label = locationsMap[item.value] ?
                    locationsMap[item.value].name :
                    item.label;
                });

                // finish
                subscriber.next(data);
                subscriber.complete();
              });
          }
        });
    });
  }

  /**
   * Data initialized
   */
  protected initializedData(): void {}

  /**
   * Initialize page title
   */
  protected initializePageTitle(): void {
    this.pageTitle = 'LNG_PAGE_CASE_MERGE_DUPLICATE_RECORDS_TITLE';
    this.pageTitleData = undefined;
  }

  /**
   * Initialize breadcrumbs
   */
  protected initializeBreadcrumbs() {
    // reset breadcrumbs
    this.breadcrumbs = [
      {
        label: 'LNG_COMMON_LABEL_HOME',
        action: {
          link: DashboardModel.canViewDashboard(this.authUser) ?
            ['/dashboard'] :
            ['/account/my-profile']
        }
      },
      {
        label: 'LNG_PAGE_LIST_DUPLICATE_RECORDS_TITLE',
        action: {
          link: ['/duplicated-records']
        }
      },
      {
        label: 'LNG_PAGE_CASE_MERGE_DUPLICATE_RECORDS_TITLE',
        action: null
      }
    ];
  }

  /**
   * Initialize tabs
   */
  protected initializeTabs(): void {
    this.tabData = {
      // tabs
      tabs: [
        // Personal
        this.initializeTabPersonal(),

        // Epidemiology
        this.initializeTabEpidemiology(),

        // Questionnaires
        this.initializeTabQuestionnaire(),
        this.initializeTabQuestionnaireAsContact()
      ],

      // create details
      create: null,

      // buttons
      buttons: this.initializeButtons(),

      // create or update
      createOrUpdate: this.initializeProcessData(),
      redirectAfterCreateUpdate: () => {
        // redirect to view
        this.redirectService.to(['/duplicated-records']);
      }
    };
  }

  /**
   * Initialize tab - Personal
   */
  private initializeTabPersonal(): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
      label: 'LNG_PAGE_CASE_MERGE_DUPLICATE_RECORDS_TAB_PERSONAL_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CASE_FIELD_LABEL_DETAILS',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'firstName',
              placeholder: () => 'LNG_CASE_FIELD_LABEL_FIRST_NAME',
              description: () => 'LNG_CASE_FIELD_LABEL_FIRST_NAME_DESCRIPTION',
              options: this._uniqueOptions.firstName,
              value: {
                get: () => this.itemData.firstName,
                set: (value) => {
                  // set data
                  this.itemData.firstName = value;
                }
              },
              validators: {
                required: () => true
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'middleName',
              placeholder: () => 'LNG_CASE_FIELD_LABEL_MIDDLE_NAME',
              description: () => 'LNG_CASE_FIELD_LABEL_MIDDLE_NAME_DESCRIPTION',
              options: this._uniqueOptions.middleName,
              value: {
                get: () => this.itemData.middleName,
                set: (value) => {
                  // set data
                  this.itemData.middleName = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'lastName',
              placeholder: () => 'LNG_CASE_FIELD_LABEL_LAST_NAME',
              description: () => 'LNG_CASE_FIELD_LABEL_LAST_NAME_DESCRIPTION',
              options: this._uniqueOptions.lastName,
              value: {
                get: () => this.itemData.lastName,
                set: (value) => {
                  // set data
                  this.itemData.lastName = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'gender',
              placeholder: () => 'LNG_CASE_FIELD_LABEL_GENDER',
              description: () => 'LNG_CASE_FIELD_LABEL_GENDER_DESCRIPTION',
              options: this._uniqueOptions.gender,
              value: {
                get: () => this.itemData.gender,
                set: (value) => {
                  // set gender
                  this.itemData.gender = value;

                  // reset pregnancy ?
                  if (this.itemData.gender === Constants.GENDER_MALE) {
                    this.itemData.pregnancyStatus = undefined;
                  }
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'pregnancyStatus',
              placeholder: () => 'LNG_CASE_FIELD_LABEL_PREGNANCY_STATUS',
              description: () => 'LNG_CASE_FIELD_LABEL_PREGNANCY_STATUS_DESCRIPTION',
              options: this._uniqueOptions.pregnancyStatus,
              value: {
                get: () => this.itemData.pregnancyStatus,
                set: (value) => {
                  this.itemData.pregnancyStatus = value;
                }
              },
              disabled: () => {
                return this.itemData.gender === Constants.GENDER_MALE;
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'occupation',
              placeholder: () => 'LNG_CASE_FIELD_LABEL_OCCUPATION',
              description: () => 'LNG_CASE_FIELD_LABEL_OCCUPATION_DESCRIPTION',
              options: this._uniqueOptions.occupation,
              value: {
                get: () => this.itemData.occupation,
                set: (value) => {
                  this.itemData.occupation = value;
                }
              }
            }, {
              // #TODO: Drop-down doesn't display selection correct.
              // Steps:
              // - select a value
              // - select another value
              // - previous selected value remains displayed
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'age',
              placeholder: () => 'LNG_CASE_FIELD_LABEL_AGE',
              description: () => 'LNG_CASE_FIELD_LABEL_AGE_DESCRIPTION',
              options: this._uniqueOptions.age,
              value: {
                get: () => this.itemData.age as any,
                set: (value: any) => {
                  this.itemData.age = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'dob',
              placeholder: () => 'LNG_CASE_FIELD_LABEL_DOB',
              description: () => 'LNG_CASE_FIELD_LABEL_DOB_DESCRIPTION',
              options: this._uniqueOptions.dob,
              value: {
                get: () => this.itemData.dob as any,
                set: (value) => {
                  this.itemData.dob = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'visualId',
              placeholder: () => 'LNG_CASE_FIELD_LABEL_VISUAL_ID',
              description: () => this.translateService.instant(
                'LNG_CASE_FIELD_LABEL_VISUAL_ID_DESCRIPTION',
                this.selectedOutbreak.caseIdMask
              ),
              options: this._uniqueOptions.visualId,
              value: {
                get: () => this.itemData.visualId,
                set: (value) => {
                  this.itemData.visualId = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'responsibleUserId',
              placeholder: () => 'LNG_CASE_FIELD_LABEL_RESPONSIBLE_USER_ID',
              description: () => 'LNG_CASE_FIELD_LABEL_RESPONSIBLE_USER_ID_DESCRIPTION',
              options: this._uniqueOptions.responsibleUserId,
              value: {
                get: () => this.itemData.responsibleUserId,
                set: (value) => {
                  this.itemData.responsibleUserId = value;
                }
              },
              replace: {
                condition: () => !UserModel.canListForFilters(this.authUser),
                html: this.translateService.instant('LNG_PAGE_CREATE_CASE_CANT_SET_RESPONSIBLE_ID_TITLE')
              }
            }
          ]
        },

        // Documents
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CASE_FIELD_LABEL_DOCUMENTS',
          inputs: [{
            type: CreateViewModifyV2TabInputType.LIST,
            name: 'documents',
            readonly: true,
            items: this.itemData.documents,
            itemsChanged: (list) => {
              this.itemData.documents = list.items;
            },
            definition: {
              add: undefined,
              remove: {
                label: 'LNG_COMMON_BUTTON_DELETE',
                confirmLabel: 'LNG_DIALOG_CONFIRM_DELETE_DOCUMENT'
              },
              input: {
                type: CreateViewModifyV2TabInputType.DOCUMENT,
                typeOptions: (this.activatedRoute.snapshot.data.documentType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
                value: {
                  get: (index: number) => {
                    return this.itemData.documents[index];
                  }
                }
              }
            }
          }]
        },

        // Addresses
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CASE_FIELD_LABEL_ADDRESSES',
          inputs: [
            // show previous addresses
            {
              type: CreateViewModifyV2TabInputType.LIST,
              name: 'addresses',
              readonly: true,
              items: this.itemData.addresses,
              itemsChanged: (list) => {
                this.itemData.addresses = list.items;
              },
              definition: {
                add: undefined,
                remove: {
                  label: 'LNG_COMMON_BUTTON_DELETE',
                  confirmLabel: 'LNG_DIALOG_CONFIRM_DELETE_ADDRESS'
                },
                input: {
                  type: CreateViewModifyV2TabInputType.ADDRESS,
                  typeOptions: (this.activatedRoute.snapshot.data.addressType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
                  value: {
                    get: (index: number) => {
                      return this.itemData.addresses[index];
                    }
                  }
                }
              }
            }
          ]
        }
      ]
    };
  }

  /**
    * Initialize tab - Epidemiology
    */
  private initializeTabEpidemiology(): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
      label: 'LNG_PAGE_CREATE_CASE_TAB_INFECTION_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CASE_FIELD_LABEL_DETAILS',
          inputs: [{
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'classification',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_CLASSIFICATION',
            description: () => 'LNG_CASE_FIELD_LABEL_CLASSIFICATION_DESCRIPTION',
            options: this._uniqueOptions.classification,
            value: {
              get: () => this.itemData.classification,
              set: (value) => {
                this.itemData.classification = value;
              }
            },
            validators: {
              required: () => true
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'dateOfOnset',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET',
            description: () => 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET_DESCRIPTION',
            options: this._uniqueOptions.dateOfOnset,
            value: {
              get: () => this.itemData.dateOfOnset as any,
              set: (value) => {
                this.itemData.dateOfOnset = value;
              }
            },
            validators: {
              required: () => !!this.selectedOutbreak.isDateOfOnsetRequired
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'isDateOfOnsetApproximate',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_IS_DATE_OF_ONSET_APPROXIMATE',
            description: () => 'LNG_CASE_FIELD_LABEL_IS_DATE_OF_ONSET_APPROXIMATE_DESCRIPTION',
            options: this._uniqueOptions.isDateOfOnsetApproximate,
            value: {
              get: () => this.itemData.isDateOfOnsetApproximate as any,
              set: (value) => {
                this.itemData.isDateOfOnsetApproximate = value as any;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'dateBecomeCase',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE',
            description: () => 'LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE_DESCRIPTION',
            options: this._uniqueOptions.dateBecomeCase,
            value: {
              get: () => this.itemData.dateBecomeCase,
              set: (value) => {
                this.itemData.dateBecomeCase = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'dateOfInfection',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION',
            description: () => 'LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION_DESCRIPTION',
            options: this._uniqueOptions.dateOfInfection,
            value: {
              get: () => this.itemData.dateOfInfection,
              set: (value) => {
                this.itemData.dateOfInfection = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'investigationStatus',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_INVESTIGATION_STATUS',
            description: () => 'LNG_CASE_FIELD_LABEL_INVESTIGATION_STATUS_DESCRIPTION',
            options: this._uniqueOptions.investigationStatus,
            value: {
              get: () => this.itemData.investigationStatus,
              set: (value) => {
                this.itemData.investigationStatus = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'dateInvestigationCompleted',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_DATE_INVESTIGATION_COMPLETED',
            description: () => 'LNG_CASE_FIELD_LABEL_DATE_INVESTIGATION_COMPLETED_DESCRIPTION',
            options: this._uniqueOptions.dateInvestigationCompleted,
            value: {
              get: () => this.itemData.dateInvestigationCompleted,
              set: (value) => {
                this.itemData.dateInvestigationCompleted = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'outcomeId',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_OUTCOME',
            description: () => 'LNG_CASE_FIELD_LABEL_OUTCOME_DESCRIPTION',
            options: this._uniqueOptions.outcomeId,
            value: {
              get: () => this.itemData.outcomeId,
              set: (value) => {
                // set data
                this.itemData.outcomeId = value;

                // reset data if not decease
                if (this.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED) {
                  this.itemData.safeBurial = null;
                  this.itemData.dateOfBurial = null;
                  this.itemData.burialLocationId = null;
                  this.itemData.burialPlaceName = null;
                }
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'dateOfOutcome',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_DATE_OF_OUTCOME',
            description: () => 'LNG_CASE_FIELD_LABEL_DATE_OF_OUTCOME_DESCRIPTION',
            options: this._uniqueOptions.dateOfOutcome,
            value: {
              get: () => this.itemData.dateOfOutcome as any,
              set: (value) => {
                this.itemData.dateOfOutcome = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'transferRefused',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_TRANSFER_REFUSED',
            description: () => 'LNG_CASE_FIELD_LABEL_TRANSFER_REFUSED_DESCRIPTION',
            options: this._uniqueOptions.transferRefused,
            value: {
              get: () => this.itemData.transferRefused as any,
              set: (value) => {
                this.itemData.transferRefused = value as any;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'safeBurial',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_SAFETY_BURIAL',
            description: () => 'LNG_CASE_FIELD_LABEL_SAFETY_BURIAL_DESCRIPTION',
            options: this._uniqueOptions.safeBurial,
            value: {
              get: () => this.itemData.safeBurial as any,
              set: (value) => {
                this.itemData.safeBurial = value as any;
              }
            },
            disabled: () => {
              return this.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED;
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'dateOfBurial',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_DATE_OF_BURIAL',
            description: () => 'LNG_CASE_FIELD_LABEL_DATE_OF_BURIAL_DESCRIPTION',
            options: this._uniqueOptions.dateOfBurial,
            value: {
              get: () => this.itemData.dateOfBurial,
              set: (value) => {
                this.itemData.dateOfBurial = value;
              }
            },
            disabled: () => {
              return this.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED;
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'burialLocationId',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_PLACE_OF_BURIAL',
            description: () => 'LNG_CASE_FIELD_LABEL_PLACE_OF_BURIAL_DESCRIPTION',
            options: this._uniqueOptions.burialLocationId,
            value: {
              get: () => this.itemData.burialLocationId,
              set: (value) => {
                this.itemData.burialLocationId = value;
              }
            },
            disabled: () => {
              return this.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED;
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'burialPlaceName',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_BURIAL_PLACE_NAME',
            description: () => 'LNG_CASE_FIELD_LABEL_BURIAL_PLACE_NAME_DESCRIPTION',
            options: this._uniqueOptions.burialPlaceName,
            value: {
              get: () => this.itemData.burialPlaceName,
              set: (value) => {
                this.itemData.burialPlaceName = value;
              }
            },
            disabled: () => {
              return this.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED;
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'dateOfReporting',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING',
            description: () => 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING_DESCRIPTION',
            options: this._uniqueOptions.dateOfReporting,
            value: {
              get: () => this.itemData.dateOfReporting?.toString(),
              set: (value) => {
                this.itemData.dateOfReporting = value;
              }
            },
            validators: {
              required: () => true
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'isDateOfReportingApproximate',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
            description: () => 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE_DESCRIPTION',
            options: this._uniqueOptions.isDateOfReportingApproximate,
            value: {
              get: () => this.itemData.isDateOfReportingApproximate,
              set: (value) => {
                this.itemData.isDateOfReportingApproximate = value as any;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'riskLevel',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_RISK_LEVEL',
            description: () => 'LNG_CASE_FIELD_LABEL_RISK_LEVEL_DESCRIPTION',
            options: this._uniqueOptions.riskLevel,
            value: {
              get: () => this.itemData.riskLevel,
              set: (value) => {
                this.itemData.riskLevel = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'riskReason',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_RISK_REASON',
            description: () => 'LNG_CASE_FIELD_LABEL_RISK_REASON_DESCRIPTION',
            options: this._uniqueOptions.riskReason,
            value: {
              get: () => this.itemData.riskReason,
              set: (value) => {
                this.itemData.riskReason = value;
              }
            }
          }]
        },

        // Questionnaires
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_PAGE_CASE_MERGE_DUPLICATE_RECORDS_TAB_QUESTIONNAIRE_TITLE',
          inputs: [
            // answers
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: '_selectedQuestionnaireAnswers',
              placeholder: () => 'LNG_CASE_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
              options: this._uniqueOptions.questionnaireAnswers,
              value: {
                get: () => this._selectedQuestionnaireAnswers as any,
                set: (value) => {
                  // set data
                  this._selectedQuestionnaireAnswers = value as any;

                  // hack to force re-render without throwing errors because some bindings are missing
                  this.itemData.questionnaireAnswers = {};
                  setTimeout(() => {
                    this.itemData.questionnaireAnswers = this._selectedQuestionnaireAnswers || this._selectedQuestionnaireAnswers === 0 ?
                      this._uniqueOptions.questionnaireAnswers[this._selectedQuestionnaireAnswers].data :
                      null;
                  });
                }
              }
            },

            // history answers
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: '_selectedQuestionnaireHistoryAnswers',
              placeholder: () => `${this.translateService.instant(EntityType.CONTACT)} ${this.translateService.instant('LNG_PAGE_MODIFY_CASE_TAB_CONTACT_QUESTIONNAIRE_TITLE')}`,
              options: this._uniqueOptions.questionnaireHistoryAnswers,
              value: {
                get: () => this._selectedQuestionnaireHistoryAnswers as any,
                set: (value) => {
                  // set data
                  this._selectedQuestionnaireHistoryAnswers = value as any;

                  // hack to force re-render without throwing errors because some bindings are missing
                  this.itemData.questionnaireAnswersContact = {};
                  setTimeout(() => {
                    this.itemData.questionnaireAnswersContact = this._selectedQuestionnaireHistoryAnswers || this._selectedQuestionnaireHistoryAnswers === 0 ?
                      this._uniqueOptions.questionnaireHistoryAnswers[this._selectedQuestionnaireHistoryAnswers].data :
                      null;
                  });
                }
              }
            }
          ]
        },

        // Vaccines
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CASE_FIELD_LABEL_VACCINES_RECEIVED_DETAILS',
          inputs: [{
            type: CreateViewModifyV2TabInputType.LIST,
            name: 'vaccinesReceived',
            readonly: true,
            items: this.itemData.vaccinesReceived,
            itemsChanged: (list) => {
              this.itemData.vaccinesReceived = list.items;
            },
            definition: {
              add: undefined,
              remove: {
                label: 'LNG_COMMON_BUTTON_DELETE',
                confirmLabel: 'LNG_DIALOG_CONFIRM_DELETE_VACCINE'
              },
              input: {
                type: CreateViewModifyV2TabInputType.VACCINE,
                vaccineOptions: (this.activatedRoute.snapshot.data.vaccine as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
                vaccineStatusOptions: (this.activatedRoute.snapshot.data.vaccineStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
                value: {
                  get: (index: number) => {
                    return this.itemData.vaccinesReceived[index];
                  }
                }
              }
            }
          }]
        },

        // Date ranges
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_CASE_FIELD_LABEL_HOSPITALIZATION_ISOLATION_DETAILS',
          inputs: [{
            type: CreateViewModifyV2TabInputType.LIST,
            name: 'dateRanges',
            readonly: true,
            items: this.itemData.dateRanges,
            itemsChanged: (list) => {
              this.itemData.dateRanges = list.items;
            },
            definition: {
              add: undefined,
              remove: {
                label: 'LNG_COMMON_BUTTON_DELETE',
                confirmLabel: 'LNG_DIALOG_CONFIRM_DELETE_DATE_RANGE'
              },
              input: {
                type: CreateViewModifyV2TabInputType.CENTER_DATE_RANGE,
                typeOptions: (this.activatedRoute.snapshot.data.dateRangeType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
                centerOptions: (this.activatedRoute.snapshot.data.dateRangeCenter as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
                value: {
                  get: (index: number) => {
                    return this.itemData.dateRanges[index];
                  }
                }
              }
            }
          }]
        }
      ]
    };
  }

  /**
   * Initialize tab - Questionnaire
   */
  private initializeTabQuestionnaire(): ICreateViewModifyV2TabTable {
    return {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      label: 'LNG_PAGE_MODIFY_CASE_TAB_QUESTIONNAIRE_TITLE',
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_FILL_QUESTIONNAIRE,
        name: 'questionnaireAnswers',
        questionnaire: this.selectedOutbreak.caseInvestigationTemplate,
        disableValidation: true,
        value: {
          get: () => this.itemData.questionnaireAnswers,
          set: undefined
        },
        updateErrors: () => {}
      },
      invalidHTMLSuffix: () => '',
      visible: () => this.selectedOutbreak.caseInvestigationTemplate?.length > 0 &&
        this.itemData.questionnaireAnswers &&
        Object.keys(this.itemData.questionnaireAnswers).length > 0
    };
  }

  /**
   * Initialize tab - Questionnaire
   */
  private initializeTabQuestionnaireAsContact(): ICreateViewModifyV2TabTable {
    return {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      label: `${this.translateService.instant(EntityType.CONTACT)} ${this.translateService.instant('LNG_PAGE_MODIFY_CASE_TAB_CONTACT_QUESTIONNAIRE_TITLE')}`,
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_FILL_QUESTIONNAIRE,
        name: 'questionnaireAnswersContact',
        questionnaire: this.selectedOutbreak.contactInvestigationTemplate,
        disableValidation: true,
        value: {
          get: () => this.itemData.questionnaireAnswersContact,
          set: undefined
        },
        updateErrors: () => {}
      },
      invalidHTMLSuffix: () => '',
      visible: () => this.selectedOutbreak.contactInvestigationTemplate?.length > 0 &&
        this.itemData.questionnaireAnswersContact &&
        Object.keys(this.itemData.questionnaireAnswersContact).length > 0
    };
  }

  /**
   * Initialize buttons
   */
  private initializeButtons(): ICreateViewModifyV2Buttons {
    return {
      view: {
        link: {
          link: () => null
        },
        visible: () => false
      },
      modify: {
        link: {
          link: () => null
        },
        visible: () => false
      },
      createCancel: {
        link: {
          link: () => ['/duplicated-records']
        }
      },
      viewCancel: {
        link: {
          link: () => null
        },
        visible: () => false
      },
      modifyCancel: {
        link: {
          link: () => ['/duplicated-records']
        }
      },
      quickActions: {
        options: []
      }
    };
  }

  /**
   * Initialize process data
   */
  private initializeProcessData(): ICreateViewModifyV2CreateOrUpdate {
    // #TODO: Request returns 500 Internal error, message is empty object
    // Steps:
    // - on Outbreak Ionut
    // - navigate to "Duplicate records" page
    // - check first 3 duplciated "Ionut Test Case 2" cases
    // - fill required fields
    // - hit "Save"
    return (
      _type,
      data,
      finished
    ) => {
      // cleanup
      delete data._selectedQuestionnaireAnswers;
      delete data._selectedQuestionnaireHistoryAnswers;

      // finished
      this.outbreakDataService
        .mergePeople(
          this.selectedOutbreak.id,
          EntityType.CASE,
          this._mergeRecordIds,
          data
        )
        .pipe(
          // handle error
          catchError((err) => {
            // show error
            finished(err, undefined);

            // finished
            return throwError(err);
          }),

          // should be the last pipe
          takeUntil(this.destroyed$)
        )
        .subscribe((item) => {
          // success creating / updating event
          this.toastV2Service.success(
            'LNG_PAGE_CASE_MERGE_DUPLICATE_RECORDS_MERGE_CASES_SUCCESS_MESSAGE'
          );

          // finished with success
          finished(undefined, item);
        });
    };
  }

  /**
   * Initialize expand list column renderer fields
   */
  protected initializeExpandListColumnRenderer(): void {}

  /**
   * Initialize expand list query fields
   */
  protected initializeExpandListQueryFields(): void {}

  /**
   * Initialize expand list advanced filters
   */
  protected initializeExpandListAdvancedFilters(): void {}

  /**
   * Refresh expand list
   */
  refreshExpandList(_data): void {}

  /**
   * Get field unique options
   */
  private getFieldOptions(
    mergeRecords: EntityModel[],
    key: string
  ): { options: ILabelValuePairModel[], value: any } {
    switch (key) {
      case 'age': return EntityModel.uniqueAgeOptions(
        mergeRecords,
        this.translateService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
        this.translateService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
      );
      case 'dob': return EntityModel.uniqueDobOptions(mergeRecords);
      case 'dateOfReporting': return EntityModel.uniqueDateOptions(mergeRecords, key);
      case 'isDateOfReportingApproximate': return EntityModel.uniqueBooleanOptions(mergeRecords, key);
      case 'transferRefused': return EntityModel.uniqueBooleanOptions(mergeRecords, key);
      case 'dateOfOnset': return EntityModel.uniqueDateOptions(mergeRecords, key);
      case 'isDateOfOnsetApproximate': return EntityModel.uniqueBooleanOptions(mergeRecords, key);
      case 'dateBecomeCase': return EntityModel.uniqueDateOptions(mergeRecords, key);
      case 'dateOfInfection': return EntityModel.uniqueDateOptions(mergeRecords, key);
      case 'dateInvestigationCompleted': return EntityModel.uniqueDateOptions(mergeRecords, key);
      case 'dateOfOutcome': return EntityModel.uniqueDateOptions(mergeRecords, key);
      case 'dateOfBurial': return EntityModel.uniqueDateOptions(mergeRecords, key);
      case 'safeBurial': return EntityModel.uniqueBooleanOptions(mergeRecords, key);
      case 'responsibleUserId': {
        const uniqueUserOptions = EntityModel.uniqueStringOptions(mergeRecords, key);
        uniqueUserOptions.options.forEach(
          (labelValuePair) => {
            labelValuePair.label = (this.activatedRoute.snapshot.data.users as IResolverV2ResponseModel<UserModel>).map[labelValuePair.value] ?
              (this.activatedRoute.snapshot.data.users as IResolverV2ResponseModel<UserModel>).map[labelValuePair.value].name :
              labelValuePair.label;
          });
        return uniqueUserOptions;
      }

      default: return EntityModel.uniqueStringOptions(mergeRecords, key);
    }
  }
}
