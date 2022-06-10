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
import { AppMessages } from '../../../../core/enums/app-messages.enum';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { Observable, throwError } from 'rxjs';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import {
  CreateViewModifyV2TabInputType,
  ICreateViewModifyV2Buttons,
  ICreateViewModifyV2CreateOrUpdate,
  ICreateViewModifyV2Tab
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { Constants } from '../../../../core/models/constants';
import { UserModel } from '../../../../core/models/user.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import { EntityType } from '../../../../core/models/entity-type';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { catchError, takeUntil } from 'rxjs/operators';
import { AgeModel } from '../../../../core/models/age.model';

/**
 * Component
 */
@Component({
  selector: 'app-case-merge-duplicate-records-create-view-modify',
  templateUrl: 'case-merge-duplicate-records-create-view-modify.component.html'
})
export class CaseMergeDuplicateRecordsCreateViewModifyComponent extends CreateViewModifyComponent<CaseModel> implements OnDestroy {
  mergeRecordIds: string[];
  mergeRecords: EntityModel[];

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
    protected i18nService: I18nService,
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
    this.activatedRoute.queryParams
      .subscribe((params: { ids }) => {
        // record ids
        this.mergeRecordIds = JSON.parse(params.ids);

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
          .pipe(

            takeUntil(this.destroyed$)
          )
          .subscribe((recordMerge) => {
            // merge records
            this.mergeRecords = recordMerge;
          });
      });
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // parent
    super.onDestroy();

    // remove global notifications
    this.toastV2Service.hide(AppMessages.APP_MESSAGE_DUPLICATE_CASE_CONTACT);
  }

  /**
   * Create new item model if needed
   */
  protected createNewItem(): CaseModel {
    return new CaseModel({
      addresses: [new AddressModel({
        typeId: AddressType.CURRENT_ADDRESS
      })]
    });
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(): Observable<CaseModel> {
    return this.caseDataService
      .getCase(
        this.selectedOutbreak.id,
        this.mergeRecordIds[0]
      );
  }

  /**
   * Data initialized
   */
  protected initializedData(): void {
    this.itemData = new CaseModel();
    this.itemData.id = this.mergeRecordIds[0];
  }

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
      }
    ];

    this.breadcrumbs.push({
      label: 'LNG_PAGE_LIST_DUPLICATE_RECORDS_TITLE',
      action: {
        link: ['/duplicated-records']
      }
    },
    {
      label: 'LNG_PAGE_CASE_MERGE_DUPLICATE_RECORDS_TITLE',
      action: null
    });
  }

  /**
   * Initialize tabs
   */
  protected initializeTabs(): void {

    this.tabData = {
      // tabs
      tabs: [
        // Personal
        this.initializeTabsPersonal(),

        // Epidemiology
        this.initializeTabsEpidemiology()

        // Questionnaires
        // this.initializeTabsQuestionnaire()
      ],

      // create details
      create: {
        finalStep: {
          buttonLabel: this.translateService.instant('LNG_STEPPER_FINAL_STEP_LABEL'),
          message: () => this.translateService.instant(
            'LNG_STEPPER_FINAL_STEP_TEXT_GENERAL',
            this.itemData
          )
        }
      },

      // buttons
      buttons: this.initializeButtons(),

      // create or update
      createOrUpdate: this.initializeProcessData(),
      redirectAfterCreateUpdate: (data: CaseModel) => {
        // redirect to view
        this.redirectService.to([`/cases/${data.id}/view`]);
      }
    };
  }

  /**
   * Initialize tabs - Personal
   */
  private initializeTabsPersonal(): ICreateViewModifyV2Tab {
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
              options: this.getFieldOptions('firstName').options,
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
              options: this.getFieldOptions('middleName').options,
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
              options: this.getFieldOptions('lastName').options,
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
              options: this.getFieldOptions('gender').options,
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
              options: this.getFieldOptions('pregnancyStatus').options,
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
              options: this.getFieldOptions('occupation').options,
              value: {
                get: () => this.itemData.occupation,
                set: (value) => {
                  this.itemData.occupation = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'age',
              placeholder: () => 'LNG_CASE_FIELD_LABEL_AGE',
              description: () => 'LNG_CASE_FIELD_LABEL_AGE_DESCRIPTION',
              options: this.getFieldOptions('age').options,
              value: {
                // TODO: value is displayed in dropdown only after it's selected twice in a row
                get: () => EntityModel.getAgeString(
                  this.itemData.age,
                  this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
                  this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
                ),
                set: (value: any) => {
                  // TODO: for some reason, value is of type AgeModel instead of string. please investigate
                  console.log(value);
                  // set value

                  // @ts-ignore
                  this.itemData.age = value || new AgeModel();
                  console.log(this.itemData);

                  // if (value !== undefined){
                  //
                  //   const ageStringNoWords = value.replace(this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS'), '');
                  //   ageStringNoWords.replace(this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS'), '');
                  //
                  //   const yearsString = ageStringNoWords.split(' ')?.[0];
                  //   const monthsString = ageStringNoWords.split(' ')?.[1];
                  //
                  //   this.itemData.age = this.itemData.age || new AgeModel();
                  //   this.itemData.age.years = toInteger(yearsString);
                  //   this.itemData.age.months = toInteger(monthsString);
                  // } else {this.itemData.age = { years: 0, months: 0 }; }
                }
              },
              disabled: () => !!this.itemData.dob
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'dob',
              placeholder: () => 'LNG_CASE_FIELD_LABEL_DOB',
              description: () => 'LNG_CASE_FIELD_LABEL_DOB_DESCRIPTION',
              options: this.getFieldOptions('dob').options,
              value: {
                get: () => this.itemData.dob?.toString(),
                set: (value) => {
                  // set value
                  this.itemData.dob = value;
                }
              },
              disabled: () => this.itemData.age.years !== 0 || this.itemData.age.months !== 0
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'visualId',
              placeholder: () => 'LNG_CASE_FIELD_LABEL_VISUAL_ID',
              description: () => this.translateService.instant(
                'LNG_CASE_FIELD_LABEL_VISUAL_ID_DESCRIPTION',
                this.selectedOutbreak.caseIdMask
              ),
              options: this.getFieldOptions('visualId').options,
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
              options: this.getFieldOptions('responsibleUserId').options,
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
        }

        // TODO: merge documents; code from create-view-modify cases below
        // Documents
        // {
        //   type: CreateViewModifyV2TabInputType.SECTION,
        //   label: 'LNG_CASE_FIELD_LABEL_DOCUMENTS',
        //   inputs: [{
        //     type: CreateViewModifyV2TabInputType.LIST,
        //     name: 'documents',
        //     items: this.itemData.documents,
        //     itemsChanged: (list) => {
        //       // update documents
        //       this.itemData.documents = list.items;
        //     },
        //     definition: {
        //       add: {
        //         label: 'LNG_DOCUMENT_LABEL_ADD_NEW_DOCUMENT',
        //         newItem: () => new DocumentModel()
        //       },
        //       remove: {
        //         label: 'LNG_COMMON_BUTTON_DELETE',
        //         confirmLabel: 'LNG_DIALOG_CONFIRM_DELETE_DOCUMENT'
        //       },
        //       input: {
        //         type: CreateViewModifyV2TabInputType.DOCUMENT,
        //         typeOptions: (this.activatedRoute.snapshot.data.documentType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        //         value: {
        //           get: (index: number) => {
        //             return this.itemData.documents[index];
        //           }
        //         }
        //       }
        //     }
        //   }]
        // },
        // TODO: merge documents; html from old design below

        // <!-- Documents section -->
        // <div class="section-title">{{ 'LNG_CASE_FIELD_LABEL_DOCUMENTS' | translate }}</div>
        // <app-form-document-list
        // name="documents"
        //   [ngModel]="caseData.documents"
        //   [disabled]="true">
        //   </app-form-document-list>

        // TODO: merge addresses; code from create-view-modify cases below
        // Addresses
        // {
        //   type: CreateViewModifyV2TabInputType.SECTION,
        //   label: 'LNG_CASE_FIELD_LABEL_ADDRESSES',
        //   inputs: [{
        //     type: CreateViewModifyV2TabInputType.LIST,
        //     name: 'addresses',
        //     items: this.itemData.addresses,
        //     itemsChanged: (list) => {
        //       // update addresses
        //       this.itemData.addresses = list.items;
        //     },
        //     definition: {
        //       add: {
        //         label: 'LNG_ADDRESS_LABEL_ADD_NEW_ADDRESS',
        //         newItem: () => new AddressModel()
        //       },
        //       remove: {
        //         label: 'LNG_COMMON_BUTTON_DELETE',
        //         confirmLabel: 'LNG_DIALOG_CONFIRM_DELETE_ADDRESS'
        //       },
        //       input: {
        //         type: CreateViewModifyV2TabInputType.ADDRESS,
        //         typeOptions: (this.activatedRoute.snapshot.data.addressType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        //         value: {
        //           get: (index: number) => {
        //             return this.itemData.addresses[index];
        //           }
        //         },
        //         validators: {
        //           required: () => true
        //         }
        //       }
        //     }
        //   }]
        // }
        // TODO: merge addresses; html from old design below

        // <!-- Address step -->
        // <mat-step [stepControl]="addressForm">
        //     <form #addressForm="ngForm">
        //       <ng-template matStepLabel>{{ 'LNG_PAGE_CASE_MERGE_DUPLICATE_RECORDS_TAB_ADDRESS_TITLE' | translate }}</ng-template>
        //
        // <mat-card
        // *ngIf="uniqueOptions?.currentAddresses.options.length > 0"
        // class="page-section">
        //   <app-form-select
        // name="selectedAddress"
        //   [(ngModel)]="uniqueOptions?.currentAddresses.value"
        //   [placeholder]="'LNG_CASE_FIELD_LABEL_ADDRESS' | translate"
        //   [options]="uniqueOptions?.currentAddresses.options"
        // (optionChanged)="changedAddress($event)"
        //   [clearable]="false">
        //   </app-form-select>
        //
        //   <app-form-address
        // name="address"
        //   [ngModel]="address"
        //   [disabled]="true">
        // </app-form-address>
        // </mat-card>
        //
        // <app-form-address-list
        // *ngIf="caseData.addresses?.length > 0"
        // name="addresses"
        //   [ngModel]="caseData.addresses"
        //   [disabled]="true"
        //   [required]="false"
        //   [minItems]="0">
        //   </app-form-address-list>
      ]
    };
  }

  /**
   * Initialize tabs - Epidemiology
   */
  private initializeTabsEpidemiology(): ICreateViewModifyV2Tab {
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
            options: this.getFieldOptions('classification').options,
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
            options: this.getFieldOptions('dateOfOnset').options,
            value: {
              get: () => this.itemData.dateOfOnset?.toString(),
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
            options: this.getFieldOptions('isDateOfOnsetApproximate').options,
            value: {
              get: () => this.itemData.isDateOfOnsetApproximate === undefined ? 'LNG_COMMON_LABEL_NONE'
                : this.itemData.isDateOfOnsetApproximate === true ? 'LNG_COMMON_LABEL_YES' : 'LNG_COMMON_LABEL_NO',
              set: (value) => {
                this.itemData.isDateOfOnsetApproximate = (value === 'LNG_COMMON_LABEL_YES' ? true : value === 'LNG_COMMON_LABEL_NO' ? false : undefined);
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'dateBecomeCase',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE',
            description: () => 'LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE_DESCRIPTION',
            options: this.getFieldOptions('dateBecomeCase').options,
            value: {
              get: () => this.itemData.dateBecomeCase?.toString(),
              set: (value) => {
                this.itemData.dateBecomeCase = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'dateOfInfection',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION',
            description: () => 'LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION_DESCRIPTION',
            options: this.getFieldOptions('dateOfInfection').options,
            value: {
              get: () => this.itemData.dateOfInfection?.toString(),
              set: (value) => {
                this.itemData.dateOfInfection = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'investigationStatus',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_INVESTIGATION_STATUS',
            description: () => 'LNG_CASE_FIELD_LABEL_INVESTIGATION_STATUS_DESCRIPTION',
            options: this.getFieldOptions('investigationStatus').options,
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
            options: this.getFieldOptions('dateInvestigationCompleted').options,
            value: {
              get: () => this.itemData.dateInvestigationCompleted?.toString(),
              set: (value) => {
                this.itemData.dateInvestigationCompleted = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'outcomeId',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_OUTCOME',
            description: () => 'LNG_CASE_FIELD_LABEL_OUTCOME_DESCRIPTION',
            options: this.getFieldOptions('outcomeId').options,
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
            options: this.getFieldOptions('dateOfOutcome').options,
            value: {
              get: () => this.itemData.dateOfOutcome?.toString(),
              set: (value) => {
                this.itemData.dateOfOutcome = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'transferRefused',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_TRANSFER_REFUSED',
            description: () => 'LNG_CASE_FIELD_LABEL_TRANSFER_REFUSED_DESCRIPTION',
            options: this.getFieldOptions('transferRefused').options,
            value: {
              get: () => this.itemData.transferRefused === undefined ? 'LNG_COMMON_LABEL_NONE'
                : this.itemData.isDateOfOnsetApproximate === true ? 'LNG_COMMON_LABEL_YES' : 'LNG_COMMON_LABEL_NO',
              set: (value) => {
                this.itemData.transferRefused = (value === 'LNG_COMMON_LABEL_YES' ? true : value === 'LNG_COMMON_LABEL_NO' ? false : undefined);
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'safeBurial',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_SAFETY_BURIAL',
            description: () => 'LNG_CASE_FIELD_LABEL_SAFETY_BURIAL_DESCRIPTION',
            options: this.getFieldOptions('safeBurial').options,
            value: {
              get: () => this.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED ?
                'LNG_COMMON_LABEL_NO' :
                this.itemData.safeBurial === undefined ? 'LNG_COMMON_LABEL_NONE'
                  : this.itemData.isDateOfOnsetApproximate === true ? 'LNG_COMMON_LABEL_YES' : 'LNG_COMMON_LABEL_NO',
              set: (value) => {
                this.itemData.safeBurial = (value === 'LNG_COMMON_LABEL_YES' ? true : value === 'LNG_COMMON_LABEL_NO' ? false : undefined);
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
            options: this.getFieldOptions('dateOfBurial').options,
            value: {
              get: () => this.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED ?
                undefined :
                this.itemData.dateOfBurial?.toString(),
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
            options: this.getFieldOptions('burialLocationId').options,
            value: {
              get: () => this.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED ?
                undefined :
                this.itemData.burialLocationId,
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
            options: this.getFieldOptions('burialPlaceName').options,
            value: {
              get: () => this.itemData.outcomeId !== Constants.OUTCOME_STATUS.DECEASED ?
                undefined :
                this.itemData.burialPlaceName,
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
            options: this.getFieldOptions('dateOfReporting').options,
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
            options: this.getFieldOptions('isDateOfReportingApproximate').options,
            value: {
              get: () => this.itemData.isDateOfReportingApproximate === undefined ? 'LNG_COMMON_LABEL_NONE'
                : this.itemData.isDateOfOnsetApproximate === true ? 'LNG_COMMON_LABEL_YES' : 'LNG_COMMON_LABEL_NO',
              set: (value) => {
                this.itemData.isDateOfReportingApproximate = (value === 'LNG_COMMON_LABEL_YES' ? true : value === 'LNG_COMMON_LABEL_NO' ? false : undefined);
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'riskLevel',
            placeholder: () => 'LNG_CASE_FIELD_LABEL_RISK_LEVEL',
            description: () => 'LNG_CASE_FIELD_LABEL_RISK_LEVEL_DESCRIPTION',
            options: this.getFieldOptions('riskLevel').options,
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
            options: this.getFieldOptions('riskReason').options,
            value: {
              get: () => this.itemData.riskReason,
              set: (value) => {
                this.itemData.riskReason = value;
              }
            }
          }]
        }

        // TODO: merge vaccines; code from create-view-modify cases below
        // Vaccines
        // {
        //   type: CreateViewModifyV2TabInputType.SECTION,
        //   label: 'LNG_CASE_FIELD_LABEL_VACCINES_RECEIVED_DETAILS',
        //   inputs: [{
        //     type: CreateViewModifyV2TabInputType.LIST,
        //     name: 'vaccinesReceived',
        //     items: this.itemData.vaccinesReceived,
        //     itemsChanged: (list) => {
        //       // update documents
        //       this.itemData.vaccinesReceived = list.items;
        //     },
        //     definition: {
        //       add: {
        //         label: 'LNG_COMMON_BUTTON_ADD_VACCINE',
        //         newItem: () => new VaccineModel()
        //       },
        //       remove: {
        //         label: 'LNG_COMMON_BUTTON_DELETE',
        //         confirmLabel: 'LNG_DIALOG_CONFIRM_DELETE_VACCINE'
        //       },
        //       input: {
        //         type: CreateViewModifyV2TabInputType.VACCINE,
        //         vaccineOptions: (this.activatedRoute.snapshot.data.vaccine as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        //         vaccineStatusOptions: (this.activatedRoute.snapshot.data.vaccineStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        //         value: {
        //           get: (index: number) => {
        //             return this.itemData.vaccinesReceived[index];
        //           }
        //         }
        //       }
        //     }
        //   }]
        // },
        // TODO: merge vaccines; html from old design below

        //     <!--Vaccines received section-->
        //     <div class="section-title">{{'LNG_CASE_FIELD_LABEL_VACCINES_RECEIVED_DETAILS' | translate}}</div>
        // <app-form-vaccines-list
        // name="vaccinesReceived"
        //   [(ngModel)]="caseData.vaccinesReceived"
        //   [disabled]="true">
        //   </app-form-vaccines-list>

        // TODO: merge hospitalizations; code from create-view-modify cases below
        // Date ranges
        // {
        //   type: CreateViewModifyV2TabInputType.SECTION,
        //   label: 'LNG_CASE_FIELD_LABEL_HOSPITALIZATION_ISOLATION_DETAILS',
        //   inputs: [{
        //     type: CreateViewModifyV2TabInputType.LIST,
        //     name: 'dateRanges',
        //     items: this.itemData.dateRanges,
        //     itemsChanged: (list) => {
        //       // update documents
        //       this.itemData.dateRanges = list.items;
        //     },
        //     definition: {
        //       add: {
        //         label: 'LNG_COMMON_BUTTON_ADD_DATE_RANGE',
        //         newItem: () => new CaseCenterDateRangeModel()
        //       },
        //       remove: {
        //         label: 'LNG_COMMON_BUTTON_DELETE',
        //         confirmLabel: 'LNG_DIALOG_CONFIRM_DELETE_DATE_RANGE'
        //       },
        //       input: {
        //         type: CreateViewModifyV2TabInputType.CENTER_DATE_RANGE,
        //         typeOptions: (this.activatedRoute.snapshot.data.dateRangeType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        //         centerOptions: (this.activatedRoute.snapshot.data.dateRangeCenter as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        //         value: {
        //           get: (index: number) => {
        //             return this.itemData.dateRanges[index];
        //           }
        //         },
        //         startDateValidators: {
        //           dateSameOrAfter: () => [
        //             'dateOfOnset'
        //           ]
        //         }
        //       }
        //     }
        //   }]
        // }
        // TODO: merge hospitalizations; html from old design below

        //   <!-- Dates section -->
        //   <app-form-case-center-daterange-list
        // name="dateRanges"
        //   [(ngModel)]="caseData.dateRanges"
        // fromTooltip="LNG_CASE_FIELD_LABEL_DATE_RANGE_FROM_DESCRIPTION"
        // toTooltip="LNG_CASE_FIELD_LABEL_DATE_RANGE_TO_DESCRIPTION"
        //   [componentTitle]="'LNG_CASE_FIELD_LABEL_HOSPITALIZATION_ISOLATION_DETAILS' | translate"
        // centerNameLabel="LNG_CASE_FIELD_LABEL_DATE_RANGE_CENTER_NAME"
        // centerNameTooltip="LNG_CASE_FIELD_LABEL_DATE_RANGE_CENTER_NAME_DESCRIPTION"
        //   [required]="true"
        //   [dateOfOnset]="caseData.dateOfOnset"
        //   ></app-form-case-center-daterange-list>
      ]
    };
  }

  /**
   * Initialize tabs - Questionnaire
   */
  // TODO: merge questionnaires; code from create-view-modify cases below
  // private initializeTabsQuestionnaire(): ICreateViewModifyV2TabTable {
  //   let errors: string = '';
  //   return {
  //     type: CreateViewModifyV2TabInputType.TAB_TABLE,
  //     label: 'LNG_PAGE_MODIFY_CASE_TAB_QUESTIONNAIRE_TITLE',
  //     definition: {
  //       type: CreateViewModifyV2TabInputType.TAB_TABLE_FILL_QUESTIONNAIRE,
  //       name: 'questionnaireAnswers',
  //       questionnaire: this.selectedOutbreak.caseInvestigationTemplate,
  //       value: {
  //         get: () => this.itemData.questionnaireAnswers,
  //         set: (value) => {
  //           this.itemData.questionnaireAnswers = value;
  //         }
  //       },
  //       updateErrors: (errorsHTML) => {
  //         errors = errorsHTML;
  //       }
  //     },
  //     invalidHTMLSuffix: () => {
  //       return errors;
  //     },
  //     visible: () => this.selectedOutbreak.caseInvestigationTemplate?.length > 0
  //   };
  // }
  // TODO: merge questionnaires; html from old design below

  //   <!-- Questionnaire step -->
  // <mat-step [stepControl]="questionnaireForm">
  //   <form #questionnaireForm="ngForm">
  //     <ng-template matStepLabel>{{ 'LNG_PAGE_CASE_MERGE_DUPLICATE_RECORDS_TAB_QUESTIONNAIRE_TITLE' | translate }}</ng-template>
  //
  // <app-form-select
  // name="selectedQuestionnaireAnswers"
  //   [(ngModel)]="uniqueOptions?.questionnaireAnswers.value"
  //   [placeholder]="'LNG_CASE_FIELD_LABEL_QUESTIONNAIRE_ANSWERS' | translate"
  //   [options]="uniqueOptions?.questionnaireAnswers.options"
  // (optionChanged)="changedQuestionnaireAnswers($event)"
  //   [clearable]="false">
  //   </app-form-select>
  //
  // <!-- Questionnaire section -->
  // <!--                    <app-form-fill-questionnaire-->
  // <!--                        name="questionnaireAnswers"-->
  // <!--                        [ngModel]="questionnaireAnswers"-->
  // <!--                        [questions]="selectedOutbreak?.caseInvestigationTemplate"-->
  // <!--                        [disabled]="true">-->
  // <!--                    </app-form-fill-questionnaire>-->
  //
  // <div class="stepper-navigation-buttons">
  //   <button mat-raised-button color="accent" matStepperNext>{{'LNG_STEPPER_BUTTON_NEXT'| translate}}</button>
  // </div>
  // </form>
  // </mat-step>

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
    return (
      _type,
      data,
      finished
    ) => {
      // finished
      this.outbreakDataService
        .mergePeople(
          this.selectedOutbreak.id,
          EntityType.CASE,
          this.mergeRecordIds,
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
  protected initializeExpandListColumnRenderer(): void {

  }

  /**
   * Initialize expand list query fields
   */
  protected initializeExpandListQueryFields(): void {

  }

  /**
   * Initialize expand list advanced filters
   */
  protected initializeExpandListAdvancedFilters(): void {

  }

  /**
   * Refresh expand list
   */
  refreshExpandList(_data): void {

  }

  private getFieldOptions(key: string): { options: LabelValuePair[], value: any } {
    switch (key) {
      case 'ageDob': return EntityModel.uniqueAgeDobOptions(
        this.mergeRecords,
        this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
        this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
      );
      case 'age': {
        const uniqueAgeOptions = EntityModel.uniqueAgeDobOptions(
          this.mergeRecords,
          this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
          this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
        );
        uniqueAgeOptions.options = uniqueAgeOptions.options.map(
          (labelValuePair) => {
            const caseModel = labelValuePair.value;
            if (caseModel.age.years === 0 && caseModel.age.months === 0) {
              labelValuePair.label = undefined;
            }
            labelValuePair.value = new AgeModel();
            labelValuePair.value.years = caseModel?.age?.years;
            labelValuePair.value.months = caseModel?.age?.months;

            return new LabelValuePair(labelValuePair.label, labelValuePair.value);
          }
        );
        uniqueAgeOptions.options = uniqueAgeOptions.options.filter(element => {return element.label !== undefined; });
        // console.log(filteredOptions);
        return uniqueAgeOptions;
      }
      case 'dob': return EntityModel.uniqueDateOptions(this.mergeRecords, key);
      case 'dateOfReporting': return EntityModel.uniqueDateOptions(this.mergeRecords, key);
      case 'isDateOfReportingApproximate': return EntityModel.uniqueBooleanOptions(this.mergeRecords, key);
      case 'transferRefused': return EntityModel.uniqueBooleanOptions(this.mergeRecords, key);
      case 'dateOfOnset': return EntityModel.uniqueDateOptions(this.mergeRecords, key);
      case 'isDateOfOnsetApproximate': return EntityModel.uniqueBooleanOptions(this.mergeRecords, key);
      case 'dateBecomeCase': return EntityModel.uniqueDateOptions(this.mergeRecords, key);
      case 'dateOfInfection': return EntityModel.uniqueDateOptions(this.mergeRecords, key);
      case 'dateInvestigationCompleted': return EntityModel.uniqueDateOptions(this.mergeRecords, key);
      case 'dateOfOutcome': return EntityModel.uniqueDateOptions(this.mergeRecords, key);
      case 'dateOfBurial': return EntityModel.uniqueDateOptions(this.mergeRecords, key);
      case 'safeBurial': return EntityModel.uniqueBooleanOptions(this.mergeRecords, key);
      case 'responsibleUserId': {
        const uniqueUserOptions = EntityModel.uniqueStringOptions(this.mergeRecords, key);
        uniqueUserOptions.options = uniqueUserOptions.options.map(
          (labelValuePair) => {
            labelValuePair.label = this.activatedRoute.snapshot.data.users.options.find(
              (user) => user.value === labelValuePair.value).label;

            return new LabelValuePair(labelValuePair.label, labelValuePair.value);
          });
        return uniqueUserOptions;
      }

      default: return EntityModel.uniqueStringOptions(this.mergeRecords, key);
    }
  }
}
