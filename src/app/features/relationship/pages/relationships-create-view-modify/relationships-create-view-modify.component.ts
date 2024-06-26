import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { EventModel } from '../../../../core/models/event.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { forkJoin, Observable, throwError } from 'rxjs';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import {
  CreateViewModifyV2ActionType,
  CreateViewModifyV2MenuType,
  ICreateViewModifyV2Buttons,
  ICreateViewModifyV2CreateOrUpdate,
  ICreateViewModifyV2Tab
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { RelationshipType } from '../../../../core/enums/relationship-type.enum';
import { EntityModel, RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { CreateViewModifyV2ExpandColumnType } from '../../../../shared/components-v2/app-create-view-modify-v2/models/expand-column.model';
import { RequestFilterGenerator } from '../../../../core/helperClasses/request-query-builder';
import { ClusterModel } from '../../../../core/models/cluster.model';
import * as _ from 'lodash';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { IAppFormIconButtonV2 } from '../../../../shared/forms-v2/core/app-form-icon-button-v2';
import { AppMessages } from '../../../../core/enums/app-messages.enum';
import { EntityType } from '../../../../core/models/entity-type';
import { Location } from '@angular/common';
import { ReferenceDataHelperService } from '../../../../core/services/helper/reference-data-helper.service';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { OutbreakAndOutbreakTemplateHelperService } from '../../../../core/services/helper/outbreak-and-outbreak-template-helper.service';
import { PersonAndRelatedHelperService } from '../../../../core/services/helper/person-and-related-helper.service';
import { LocalizationHelper, Moment } from '../../../../core/helperClasses/localization-helper';

@Component({
  selector: 'app-relationships-create-view-modify',
  templateUrl: './relationships-create-view-modify.component.html'
})
export class RelationshipsCreateViewModifyComponent extends CreateViewModifyComponent<RelationshipModel> implements OnDestroy {
  // constants
  private static readonly PROPERTY_LAST_CONTACT: string = 'contactDate';

  // entity
  private _entity: CaseModel | ContactModel | EventModel | ContactOfContactModel;

  // route
  relationshipType: RelationshipType;

  // constants
  RelationshipType = RelationshipType;

  // relationship models for create
  private _createRelationships: RelationshipModel[];
  private _createEntities: (CaseModel | ContactModel | EventModel | ContactOfContactModel)[];
  private _createEntitiesMap: {
    [id: string]: CaseModel | ContactModel | EventModel | ContactOfContactModel
  } = {};

  // warning messages
  private _warnings: {
    sourceDateOfOnset: string | null,
    entities: {
      [entityId: string]: {
        id: string,
        name: string,
        type: string,
        dateOfOnset: string | null,
      }
    }
  } = {
      sourceDateOfOnset: null,
      entities: {}
    };


  /**
   * Constructor
   */
  constructor(
    protected authDataService: AuthDataService,
    protected activatedRoute: ActivatedRoute,
    protected renderer2: Renderer2,
    protected outbreakAndOutbreakTemplateHelperService: OutbreakAndOutbreakTemplateHelperService,
    protected router: Router,
    protected location: Location,
    protected referenceDataHelperService: ReferenceDataHelperService,
    private personAndRelatedHelperService: PersonAndRelatedHelperService
  ) {
    // parent
    super(
      authDataService,
      activatedRoute,
      renderer2,
      personAndRelatedHelperService.redirectService,
      personAndRelatedHelperService.toastV2Service,
      outbreakAndOutbreakTemplateHelperService
    );

    // retrieve data from snapshot
    this.relationshipType = this.activatedRoute.snapshot.data.relationshipType;
    this._entity = this.activatedRoute.snapshot.data.entity;

    // on create we should have selectedEntityIds
    if (this.isCreate) {
      // initialize
      this._createEntities = (this.activatedRoute.snapshot.data.selectedEntities as IResolverV2ResponseModel<CaseModel | ContactModel | EventModel | ContactOfContactModel>).list;
      this._createRelationships =  [];
      this._createEntitiesMap = {};
      (this._createEntities || []).forEach((item) => {
        // initialize new relationship
        this._createRelationships.push(new RelationshipModel());

        // map entity for easy access
        this._createEntitiesMap[item.id] = item;
      });

      // something went wrong, we should have at least one relationship model on create
      if (this._createRelationships.length < 1) {
        const loading = this.personAndRelatedHelperService.dialogV2Service.showLoadingDialog();
        loading.message({
          message: 'Something went wrong...'
        });
      }
    }
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // parent
    super.onDestroy();

    // remove global notifications
    this.personAndRelatedHelperService.toastV2Service.hide(AppMessages.APP_MESSAGE_LAST_CONTACT_SHOULD_NOT_BE_BEFORE_DATE_OF_ONSET);
  }

  /**
   * Create new item model if needed
   */
  protected createNewItem(): RelationshipModel {
    return new RelationshipModel();
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(record?: RelationshipModel): Observable<RelationshipModel> {
    return this.personAndRelatedHelperService.relationship.relationshipDataService
      .getEntityRelationship(
        this.selectedOutbreak.id,
        this._entity.type,
        this._entity.id,
        record ?
          record.id :
          this.activatedRoute.snapshot.params.relationshipId
      );
  }

  /**
   * Data initialized
   */
  protected initializedData(): void {
    // validate Last Contact Date against Date of Onset
    if (
      this.isView ||
      this.isModify
    ) {
      // remove global notifications
      this.personAndRelatedHelperService.toastV2Service.hide(AppMessages.APP_MESSAGE_LAST_CONTACT_SHOULD_NOT_BE_BEFORE_DATE_OF_ONSET);

      // show global notifications
      this.checkForLastContactBeforeCaseOnSet(
        { [this._entity.id]: this._entity.name },
        this.itemData.contactDate
      );
    }
  }

  /**
   * Initialize page title
   */
  protected initializePageTitle(): void {
    // add info accordingly to page type
    if (this.isCreate) {
      this.pageTitle = 'LNG_PAGE_CREATE_ENTITY_RELATIONSHIP_TITLE';
      this.pageTitleData = undefined;
    } else if (this.isModify) {
      this.pageTitle = 'LNG_PAGE_MODIFY_ENTITY_RELATIONSHIP_TITLE';
      this.pageTitleData = {
        name: this.itemData.relatedEntity(this._entity.id)?.model?.name || ''
      };
    } else {
      // view
      this.pageTitle = 'LNG_PAGE_VIEW_RELATIONSHIP_TITLE';
      this.pageTitleData = {
        name: this.itemData.relatedEntity(this._entity.id)?.model?.name || ''
      };
    }
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
      }, {
        label: this.personAndRelatedHelperService.relationship.entityMap[this._entity.type].label,
        action: {
          link: [this.personAndRelatedHelperService.relationship.entityMap[this._entity.type].link]
        }
      }, {
        label: this._entity.name,
        action: {
          link: [
            this.personAndRelatedHelperService.relationship.entityMap[this._entity.type].link,
            this._entity.id,
            'view'
          ]
        }
      }, {
        label: this.relationshipType === RelationshipType.EXPOSURE ?
          'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_EXPOSURES_TITLE' :
          'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_CONTACTS_TITLE',
        action: {
          link: [
            '/relationships',
            this._entity.type,
            this._entity.id,
            this.relationshipType === RelationshipType.CONTACT ?
              'contacts' :
              'exposures'
          ]
        }
      }
    ];

    // add info accordingly to page type
    if (this.isCreate) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_CREATE_ENTITY_RELATIONSHIP_TITLE',
        action: null
      });
    } else if (this.isModify) {
      this.breadcrumbs.push({
        label: this.personAndRelatedHelperService.i18nService.instant(
          'LNG_PAGE_MODIFY_ENTITY_RELATIONSHIP_TITLE', {
            name: this.itemData.relatedEntity(this._entity.id)?.model?.name || ''
          }
        ),
        action: null
      });
    } else {
      // view
      this.breadcrumbs.push({
        label: this.personAndRelatedHelperService.i18nService.instant(
          'LNG_PAGE_VIEW_RELATIONSHIP_TITLE', {
            name: this.itemData.relatedEntity(this._entity.id)?.model?.name || ''
          }
        ),
        action: null
      });
    }
  }

  /**
   * Initialize breadcrumb infos
   */
  protected initializeBreadcrumbInfos(): void {}

  /**
   * Initialize tabs
   */
  protected initializeTabs(): void {
    this.tabData = {
      // tabs
      tabs: [
        // Details
        ...this.initializeDetailTabs()
      ],

      // create details
      create: {
        finalStep: {
          buttonLabel: this.personAndRelatedHelperService.i18nService.instant('LNG_PAGE_CREATE_ENTITY_RELATIONSHIP_ACTION_CREATE_RELATIONSHIP_BUTTON'),
          message: () => this.personAndRelatedHelperService.i18nService.instant(
            'LNG_STEPPER_FINAL_STEP_TEXT_GENERAL',
            {
              name: this._entity.name
            }
          )
        }
      },

      // buttons
      buttons: this.initializeButtons(),

      // create or update
      createOrUpdate: this.initializeProcessData(),
      redirectAfterCreateUpdate: (data: RelationshipModel | RelationshipModel[]) => {
        // bulk create ?
        if (Array.isArray(data)) {
          // redirect to list / view ?
          if (data.length === 1) {
            this.router.navigate([
              '/relationships',
              this._entity.type,
              this._entity.id,
              this.relationshipType === RelationshipType.CONTACT ?
                'contacts' :
                'exposures',
              data[0].id,
              'view'
            ]);
          } else {
            this.router.navigate([
              '/relationships',
              this._entity.type,
              this._entity.id,
              this.relationshipType === RelationshipType.CONTACT ?
                'contacts' :
                'exposures'
            ]);
          }

          // finished
          return;
        }

        // update - redirect to view
        this.router.navigate([
          '/relationships',
          this._entity.type,
          this._entity.id,
          this.relationshipType === RelationshipType.CONTACT ?
            'contacts' :
            'exposures',
          (data as RelationshipModel).id,
          'view'
        ]);
      }
    };
  }

  /**
   * Details tabs
   */
  private initializeDetailTabs(): ICreateViewModifyV2Tab[] {
    // view / modify ?
    if (!this.isCreate) {
      return [this.initializeTabsDetails(
        'LNG_COMMON_MODEL_FIELD_LABEL_ID',
        'details',
        'LNG_COMMON_LABEL_DETAILS',
        (property) => property,
        this.itemData
      )];
    }

    // create ?
    return this._createEntities.map((item, index) => {
      // since merging forms overwrites the array due to spread operator we need unique root properties
      // - fields = { ...fields, ...this.getFields(form) };
      return this.initializeTabsDetails(
        item.id,
        item.name,
        item.name,
        (property) => `r_${_.camelCase(item.id)}[${item.id}][${property}]`,
        this._createRelationships[index]
      );
    });
  }

  /**
   * Initialize tab details
   */
  private initializeTabsDetails(
    entityId: string,
    tabName: string,
    tabLabel: string,
    inputName: (property: string) => string,
    relationshipData: RelationshipModel
  ): ICreateViewModifyV2Tab {
    return this.personAndRelatedHelperService.relationship.generateTabsDetails(this.selectedOutbreak, {
      entityId,
      tabName,
      tabLabel,
      tabVisible: () => true,
      inputName: (property) => {
        return inputName(property);
      },
      itemData: relationshipData,
      createCopySuffixButtons: (prop): IAppFormIconButtonV2[] => {
        // we need arrow function to keep context (or use apply)
        return this.createCopySuffixButtons(prop);
      },
      checkForLastContactBeforeCaseOnSet: (entities, contactDate) => {
        // we need arrow function to keep context (or use apply)
        this.checkForLastContactBeforeCaseOnSet(entities, contactDate);
      },
      options: {
        certaintyLevel: (this.activatedRoute.snapshot.data.certaintyLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        exposureType: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.exposureType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          relationshipData.exposureTypeId
        ),
        exposureFrequency: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.exposureFrequency as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          relationshipData.exposureFrequencyId
        ),
        exposureDuration: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.exposureDuration as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          relationshipData.exposureDurationId
        ),
        contextOfTransmission: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.contextOfTransmission as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          relationshipData.socialRelationshipTypeId
        ),
        cluster: (this.activatedRoute.snapshot.data.cluster as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
      }
    });
  }

  /**
   * Initialize buttons
   */
  private initializeButtons(): ICreateViewModifyV2Buttons {
    return {
      view: {
        link: {
          link: () => [
            '/relationships',
            this._entity.type,
            this._entity.id,
            this.relationshipType === RelationshipType.CONTACT ?
              'contacts' :
              'exposures',
            this.itemData?.id,
            'view'
          ]
        }
      },
      modify: {
        link: {
          link: () => [
            '/relationships',
            this._entity.type,
            this._entity.id,
            this.relationshipType === RelationshipType.CONTACT ?
              'contacts' :
              'exposures',
            this.itemData?.id,
            'modify'
          ]
        },
        visible: () => RelationshipModel.canModify(this.authUser)
      },
      createCancel: {
        link: {
          link: () => [
            '/relationships',
            this._entity.type,
            this._entity.id,
            this.relationshipType === RelationshipType.CONTACT ?
              'contacts' :
              'exposures'
          ]
        }
      },
      viewCancel: {
        link: {
          link: () => [
            '/relationships',
            this._entity.type,
            this._entity.id,
            this.relationshipType === RelationshipType.CONTACT ?
              'contacts' :
              'exposures'
          ]
        }
      },
      modifyCancel: {
        link: {
          link: () => [
            '/relationships',
            this._entity.type,
            this._entity.id,
            this.relationshipType === RelationshipType.CONTACT ?
              'contacts' :
              'exposures'
          ]
        }
      },
      quickActions: {
        options: [
          // Record details
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_MODIFY_ENTITY_RELATIONSHIP_TAB_PERSONAL_SECTION_RECORD_DETAILS_TITLE',
            action: {
              click: () => {
                // show record details dialog
                this.personAndRelatedHelperService.dialogV2Service.showRecordDetailsDialog(
                  this.authUser,
                  'LNG_PAGE_MODIFY_ENTITY_RELATIONSHIP_TAB_PERSONAL_SECTION_RECORD_DETAILS_TITLE',
                  this.itemData,
                  this.activatedRoute.snapshot.data.user,
                  this.activatedRoute.snapshot.data.deletedUser
                );
              }
            }
          }
        ]
      }
    };
  }

  /**
   * Initialize process data
   */
  private initializeProcessData(): ICreateViewModifyV2CreateOrUpdate {
    return (
      type,
      data,
      finished
    ) => {
      // if create we need to do multiple requests
      const requests$: Observable<RelationshipModel>[] = [];
      if (type === CreateViewModifyV2ActionType.CREATE) {
        Object.keys(data).forEach((uniqueKey) => {
          Object.keys(data[uniqueKey]).forEach((personId) => {
            // set target
            const relationshipData = data[uniqueKey][personId];

            // set target person
            relationshipData.persons = [{
              id: this.relationshipType === RelationshipType.CONTACT ?
                personId :
                this._entity.id
            }];

            // add request
            requests$.push(
              this.personAndRelatedHelperService.relationship.relationshipDataService
                .createRelationship(
                  this.selectedOutbreak.id,
                  this.relationshipType === RelationshipType.CONTACT ?
                    this._entity.type :
                    this._createEntitiesMap[personId].type,
                  this.relationshipType === RelationshipType.CONTACT ?
                    this._entity.id :
                    personId,
                  relationshipData
                )
            );
          });
        });
      } else {
        // update
        requests$.push(
          this.personAndRelatedHelperService.relationship.relationshipDataService
            .modifyRelationship(
              this.selectedOutbreak.id,
              this._entity.type,
              this._entity.id,
              this.itemData.id,
              data
            )
        );
      }

      // do requests
      forkJoin(requests$)
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
        .subscribe((items) => {
          // success creating / updating event
          this.personAndRelatedHelperService.toastV2Service.success(
            type === CreateViewModifyV2ActionType.CREATE ?
              (
                items.length > 1 ?
                  'LNG_PAGE_CREATE_ENTITY_RELATIONSHIP_ACTION_CREATE_MULTIPLE_RELATIONSHIP_SUCCESS_MESSAGE' :
                  'LNG_PAGE_CREATE_ENTITY_RELATIONSHIP_ACTION_CREATE_RELATIONSHIP_SUCCESS_MESSAGE'
              ) :
              'LNG_PAGE_MODIFY_ENTITY_RELATIONSHIP_ACTION_MODIFY_RELATIONSHIP_SUCCESS_MESSAGE'
          );

          // finished with success
          finished(undefined, items);
        });
    };
  }

  /**
   * Initialize expand list column renderer fields
   */
  protected initializeExpandListColumnRenderer(): void {
    this.expandListColumnRenderer = {
      type: CreateViewModifyV2ExpandColumnType.TEXT,
      link: (item: EntityModel) => [
        '/relationships',
        this._entity.type,
        this._entity.id,
        this.relationshipType === RelationshipType.CONTACT ?
          'contacts' :
          'exposures',
        item.relationship.id,
        'view'
      ],
      get: {
        text: (item: EntityModel) => item.model.name
      }
    };
  }

  /**
   * Initialize expand list query fields
   */
  protected initializeExpandListQueryFields(): void {
    this.expandListQueryFields = [];
  }

  /**
   * Refresh expand list
   */
  refreshExpandList(data): void {
    // append / remove search
    if (data.searchBy) {
      data.queryBuilder.filter.where({
        or: [
          {
            firstName: RequestFilterGenerator.textContains(
              data.searchBy
            )
          }, {
            lastName: RequestFilterGenerator.textContains(
              data.searchBy
            )
          }, {
            middleName: RequestFilterGenerator.textContains(
              data.searchBy
            )
          }, {
            visualId: RequestFilterGenerator.textContains(
              data.searchBy
            )
          }, {
            name: RequestFilterGenerator.textContains(
              data.searchBy
            )
          }
        ]
      });
    }

    // retrieve data
    this.expandListRecords$ = this.personAndRelatedHelperService.relationship
      .retrieveRecords(
        this.relationshipType,
        this.selectedOutbreak,
        this._entity,
        data.queryBuilder
      )
      .pipe(
        // map to relationships
        map((items) => {
          // trick eslint
          return (items || []).map((item) => item as any);
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }

  /**
   * Initialize expand list advanced filters
   */
  protected initializeExpandListAdvancedFilters(): void {
    this.expandListAdvancedFilters = this.personAndRelatedHelperService.relationship.generateAdvancedFilters(this.selectedOutbreak, {
      options: {
        certaintyLevel: (this.activatedRoute.snapshot.data.certaintyLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        exposureType: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.exposureType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        exposureFrequency: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.exposureFrequency as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        exposureDuration: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.exposureDuration as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        contextOfTransmission: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.contextOfTransmission as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        cluster: (this.activatedRoute.snapshot.data.cluster as IResolverV2ResponseModel<ClusterModel>).options,
        yesNo: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options
      }
    });
  }

  /**
   * Expand list item
   */
  expandListChangeRecord(data: any): void {
    super.expandListChangeRecord(data.relationship);
  }

  /**
   * Create copy suffix buttons
   */
  createCopySuffixButtons(prop: string): IAppFormIconButtonV2[] {
    return this._createRelationships?.length > 1 ?
      [{
        icon: 'content_copy',
        tooltip: 'LNG_PAGE_CREATE_ENTITY_RELATIONSHIP_COPY_BUTTON_TITLE',
        clickAction: (item) => {
          this.personAndRelatedHelperService.dialogV2Service.showConfirmDialog({
            config: {
              title: {
                get: () => 'LNG_COMMON_LABEL_ATTENTION_REQUIRED'
              },
              message: {
                get: () => 'LNG_DIALOG_CONFIRM_COPY_VALUE'
              }
            }
          }).subscribe((response) => {
            // canceled ?
            if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
              // finished
              return;
            }

            // copy values
            // keep also the entities for which contact date was copied
            const updatedEntities: {
              [id: string]: string
            } = {};
            this._createRelationships.forEach((rel, index) => {
              // we already have data, no need to replace
              if (rel[prop]) {
                return;
              }

              // replace with new data
              const propValue = _.cloneDeep(item.value);
              rel[prop] = propValue;

              // keep entity to validate against date of onset
              if (prop === RelationshipsCreateViewModifyComponent.PROPERTY_LAST_CONTACT) {
                updatedEntities[this._createEntities[index].id] = this._createEntities[index].name;
              }
            });

            // validate against date of onset
            this.checkForLastContactBeforeCaseOnSet(
              updatedEntities,
              item.value
            );
          });
        }
      }] :
      undefined;
  }

  /**
   * Check if "Date of Last Contact" is before "Date of Onset" of the source case
   */
  private checkForLastContactBeforeCaseOnSet(
    entities: {
      [id: string]: string
    },
    contactDate: Moment | string
  ) {
    // validate if only the feature is enabled
    if (
      !this.selectedOutbreak.checkLastContactDateAgainstDateOnSet ||
      !Object.keys(entities).length
    ) {
      return;
    }

    // check all entities
    Object.keys(entities).forEach((entityId) => {
      // get the source entity
      const sourceEntity = this.relationshipType === RelationshipType.CONTACT ?
        this._entity :
        this.isCreate ?
          this._createEntitiesMap[entityId] :
          this.itemData.relatedEntity(this._entity.id)?.model;

      // validate contact date
      if (
        (sourceEntity as CaseModel)?.dateOfOnset &&
        contactDate &&
        LocalizationHelper.toMoment(contactDate).isValid() &&
        LocalizationHelper.toMoment(contactDate).isBefore(LocalizationHelper.toMoment((sourceEntity as CaseModel).dateOfOnset))
      ) {
        // when new contacts are added keep the source date of onset
        if (RelationshipType.CONTACT) {
          this._warnings.sourceDateOfOnset = LocalizationHelper.displayDate((sourceEntity as CaseModel).dateOfOnset);
        }

        this._warnings.entities[this.isCreate ? entityId : sourceEntity.id] = {
          id: this.isCreate ? entityId : sourceEntity.id,
          name: this.isCreate ? entities[entityId] : sourceEntity.name,
          type: this.isCreate ? (this._createEntitiesMap[entityId] as CaseModel).type : sourceEntity.type,
          dateOfOnset: LocalizationHelper.displayDate((sourceEntity as CaseModel).dateOfOnset)
        };
      } else {
        // remove if exists
        delete this._warnings.entities[this.isCreate ? entityId : sourceEntity.id];
      }
    });

    // hide current warning to re-display the updated message
    this.personAndRelatedHelperService.toastV2Service.hide(AppMessages.APP_MESSAGE_LAST_CONTACT_SHOULD_NOT_BE_BEFORE_DATE_OF_ONSET);

    // show the updated message
    if (Object.keys(this._warnings.entities).length) {
      this.personAndRelatedHelperService.toastV2Service.notice(
        this.isCreate ?
          (
            this.relationshipType === RelationshipType.CONTACT ?
              'LNG_PAGE_CREATE_ENTITY_RELATIONSHIP_WARNING_CONTACT_LAST_CONTACT_IS_BEFORE_DATE_OF_ONSET' :
              'LNG_PAGE_CREATE_ENTITY_RELATIONSHIP_WARNING_EXPOSURE_LAST_CONTACT_IS_BEFORE_DATE_OF_ONSET'
          ) : (
            this.relationshipType === RelationshipType.CONTACT ?
              'LNG_PAGE_MODIFY_ENTITY_RELATIONSHIP_WARNING_CONTACT_LAST_CONTACT_IS_BEFORE_DATE_OF_ONSET' :
              'LNG_PAGE_MODIFY_ENTITY_RELATIONSHIP_WARNING_EXPOSURE_LAST_CONTACT_IS_BEFORE_DATE_OF_ONSET'
          ),
        {
          // for same case get the first date of onset (modify relationship and create contacts)
          dateOfOnset: this._warnings.sourceDateOfOnset,
          entities: Object.values(this._warnings.entities).map((item) => {
            // check rights
            if (
              (
                this.isCreate &&
                this.relationshipType === RelationshipType.CONTACT
              ) || (
                item.type === EntityType.CASE &&
                !CaseModel.canView(this.authUser)
              )
            ) {
              return `${item.name} (${this.personAndRelatedHelperService.i18nService.instant(item.type)})`;
            }

            // create url
            const url: string = `/cases/${item.id}/view`;

            // finished
            const additionalInfo = this.isCreate && this.relationshipType === RelationshipType.EXPOSURE ?
              this.personAndRelatedHelperService.i18nService.instant('LNG_ENTITY_FIELD_LABEL_DATE_OF_ONSET') + ': ' + item.dateOfOnset :
              '';

            // return entity as a link
            return `<br><a class="gd-alert-link" href="${this.location.prepareExternalUrl(url)}"><span>${item.name} (${this.personAndRelatedHelperService.i18nService.instant(item.type)}) ${additionalInfo}</span></a>`;
          })
            .join(', ')
        },
        AppMessages.APP_MESSAGE_LAST_CONTACT_SHOULD_NOT_BE_BEFORE_DATE_OF_ONSET
      );
    }
  }
}
