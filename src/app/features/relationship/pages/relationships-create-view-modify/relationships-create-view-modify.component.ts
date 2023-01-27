import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { EventModel } from '../../../../core/models/event.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { forkJoin, Observable, throwError } from 'rxjs';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import {
  CreateViewModifyV2ActionType,
  CreateViewModifyV2MenuType,
  CreateViewModifyV2TabInputType,
  ICreateViewModifyV2Buttons,
  ICreateViewModifyV2CreateOrUpdate,
  ICreateViewModifyV2Tab
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { RelationshipType } from '../../../../core/enums/relationship-type.enum';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { EntityModel, RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { EntityHelperService } from '../../../../core/services/helper/entity-helper.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { moment, Moment } from '../../../../core/helperClasses/x-moment';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { CreateViewModifyV2ExpandColumnType } from '../../../../shared/components-v2/app-create-view-modify-v2/models/expand-column.model';
import { RequestFilterGenerator } from '../../../../core/helperClasses/request-query-builder';
import { ClusterModel } from '../../../../core/models/cluster.model';
import * as _ from 'lodash';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { IAppFormIconButtonV2 } from '../../../../shared/forms-v2/core/app-form-icon-button-v2';
import { AppMessages } from '../../../../core/enums/app-messages.enum';
import { Constants } from '../../../../core/models/constants';
import { EntityType } from '../../../../core/models/entity-type';
import { Location } from '@angular/common';

@Component({
  selector: 'app-relationships-create-view-modify',
  templateUrl: './relationships-create-view-modify.component.html'
})
export class RelationshipsCreateViewModifyComponent extends CreateViewModifyComponent<RelationshipModel> implements OnDestroy {
  // constants
  private static readonly PROPERTY_LAST_CONTACT: string = 'contactDate';

  // today
  private _today: Moment = moment();

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
    protected activatedRoute: ActivatedRoute,
    protected relationshipDataService: RelationshipDataService,
    protected translateService: TranslateService,
    protected toastV2Service: ToastV2Service,
    protected entityHelperService: EntityHelperService,
    protected dialogV2Service: DialogV2Service,
    protected router: Router,
    protected location: Location,
    authDataService: AuthDataService,
    renderer2: Renderer2,
    redirectService: RedirectService
  ) {
    // parent
    super(
      toastV2Service,
      renderer2,
      redirectService,
      activatedRoute,
      authDataService
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
        const loading = this.dialogV2Service.showLoadingDialog();
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
    this.toastV2Service.hide(AppMessages.APP_MESSAGE_LAST_CONTACT_SHOULD_NOT_BE_BEFORE_DATE_OF_ONSET);
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
    return this.relationshipDataService
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
      this.toastV2Service.hide(AppMessages.APP_MESSAGE_LAST_CONTACT_SHOULD_NOT_BE_BEFORE_DATE_OF_ONSET);

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
        label: this.entityHelperService.entityMap[this._entity.type].label,
        action: {
          link: [this.entityHelperService.entityMap[this._entity.type].link]
        }
      }, {
        label: this._entity.name,
        action: {
          link: [
            this.entityHelperService.entityMap[this._entity.type].link,
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
        label: this.translateService.instant(
          'LNG_PAGE_MODIFY_ENTITY_RELATIONSHIP_TITLE', {
            name: this.itemData.relatedEntity(this._entity.id)?.model?.name || ''
          }
        ),
        action: null
      });
    } else {
      // view
      this.breadcrumbs.push({
        label: this.translateService.instant(
          'LNG_PAGE_VIEW_RELATIONSHIP_TITLE', {
            name: this.itemData.relatedEntity(this._entity.id)?.model?.name || ''
          }
        ),
        action: null
      });
    }
  }

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
          buttonLabel: this.translateService.instant('LNG_PAGE_CREATE_ENTITY_RELATIONSHIP_ACTION_CREATE_RELATIONSHIP_BUTTON'),
          message: () => this.translateService.instant(
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
          // redirect to view
          this.router.navigate([
            '/relationships',
            this._entity.type,
            this._entity.id,
            this.relationshipType === RelationshipType.CONTACT ?
              'contacts' :
              'exposures'
          ]);

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
    title: string,
    name: (property: string) => string,
    relationshipData: RelationshipModel
  ): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
      name: title,
      label: title,
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: title,
          inputs: [{
            type: CreateViewModifyV2TabInputType.DATE,
            name: name('dateOfFirstContact'),
            placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_DATE_OF_FIRST_CONTACT',
            description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_DATE_OF_FIRST_CONTACT_DESCRIPTION',
            value: {
              get: () => relationshipData.dateOfFirstContact,
              set: (value) => {
                relationshipData.dateOfFirstContact = value;
              }
            },
            maxDate: this._today,
            validators: {
              dateSameOrBefore: () => [
                this._today
              ]
            },
            suffixIconButtons: this.createCopySuffixButtons('dateOfFirstContact')
          }, {
            type: CreateViewModifyV2TabInputType.DATE,
            name: name('contactDate'),
            placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE',
            description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_DESCRIPTION',
            value: {
              get: () => relationshipData.contactDate,
              set: (value) => {
                relationshipData.contactDate = value;

                // validate against date of onset
                this.checkForLastContactBeforeCaseOnSet(
                  { [entityId]: title },
                  relationshipData.contactDate
                );
              }
            },
            maxDate: this._today,
            validators: {
              required: () => true,
              dateSameOrBefore: () => [
                this._today
              ]
            },
            suffixIconButtons: this.createCopySuffixButtons('contactDate')
          }, {
            type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
            name: name('contactDateEstimated'),
            placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_ESTIMATED',
            description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_ESTIMATED_DESCRIPTION',
            value: {
              get: () => relationshipData.contactDateEstimated,
              set: (value) => {
                // set data
                relationshipData.contactDateEstimated = value;
              }
            },
            suffixIconButtons: this.createCopySuffixButtons('contactDateEstimated')
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: name('certaintyLevelId'),
            placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL',
            description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL_DESCRIPTION',
            options: (this.activatedRoute.snapshot.data.certaintyLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            value: {
              get: () => relationshipData.certaintyLevelId,
              set: (value) => {
                relationshipData.certaintyLevelId = value;
              }
            },
            validators: {
              required: () => true
            },
            suffixIconButtons: this.createCopySuffixButtons('certaintyLevelId')
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: name('exposureTypeId'),
            placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE',
            description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE_DESCRIPTION',
            options: (this.activatedRoute.snapshot.data.exposureType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            value: {
              get: () => relationshipData.exposureTypeId,
              set: (value) => {
                relationshipData.exposureTypeId = value;
              }
            },
            suffixIconButtons: this.createCopySuffixButtons('exposureTypeId')
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: name('exposureFrequencyId'),
            placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY',
            description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY_DESCRIPTION',
            options: (this.activatedRoute.snapshot.data.exposureFrequency as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            value: {
              get: () => relationshipData.exposureFrequencyId,
              set: (value) => {
                relationshipData.exposureFrequencyId = value;
              }
            },
            suffixIconButtons: this.createCopySuffixButtons('exposureFrequencyId')
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: name('exposureDurationId'),
            placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION',
            description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION_DESCRIPTION',
            options: (this.activatedRoute.snapshot.data.exposureDuration as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            value: {
              get: () => relationshipData.exposureDurationId,
              set: (value) => {
                relationshipData.exposureDurationId = value;
              }
            },
            suffixIconButtons: this.createCopySuffixButtons('exposureDurationId')
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: name('socialRelationshipTypeId'),
            placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION',
            description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION_DESCRIPTION',
            options: (this.activatedRoute.snapshot.data.contextOfTransmission as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            value: {
              get: () => relationshipData.socialRelationshipTypeId,
              set: (value) => {
                relationshipData.socialRelationshipTypeId = value;
              }
            },
            suffixIconButtons: this.createCopySuffixButtons('socialRelationshipTypeId')
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: name('clusterId'),
            placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER',
            description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER_DESCRIPTION',
            options: (this.activatedRoute.snapshot.data.cluster as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            value: {
              get: () => relationshipData.clusterId,
              set: (value) => {
                relationshipData.clusterId = value;
              }
            },
            suffixIconButtons: this.createCopySuffixButtons('clusterId')
          }, {
            type: CreateViewModifyV2TabInputType.TEXT,
            name: name('socialRelationshipDetail'),
            placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP',
            description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP_DESCRIPTION',
            value: {
              get: () => relationshipData.socialRelationshipDetail,
              set: (value) => {
                relationshipData.socialRelationshipDetail = value;
              }
            },
            suffixIconButtons: this.createCopySuffixButtons('socialRelationshipDetail')
          }, {
            type: CreateViewModifyV2TabInputType.TEXTAREA,
            name: name('comment'),
            placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_COMMENT',
            description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_COMMENT_DESCRIPTION',
            value: {
              get: () => relationshipData.comment,
              set: (value) => {
                relationshipData.comment = value;
              }
            },
            suffixIconButtons: this.createCopySuffixButtons('comment')
          }]
        }
      ]
    };
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
                this.dialogV2Service.showRecordDetailsDialog(
                  'LNG_PAGE_MODIFY_ENTITY_RELATIONSHIP_TAB_PERSONAL_SECTION_RECORD_DETAILS_TITLE',
                  this.itemData,
                  this.activatedRoute.snapshot.data.user
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
              this.relationshipDataService
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
          this.relationshipDataService
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
          this.toastV2Service.success(
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
    this.expandListRecords$ = this.entityHelperService
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
    this.expandListAdvancedFilters = this.entityHelperService.generateAdvancedFilters({
      options: {
        certaintyLevel: (this.activatedRoute.snapshot.data.certaintyLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        exposureType: (this.activatedRoute.snapshot.data.exposureType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        exposureFrequency: (this.activatedRoute.snapshot.data.exposureFrequency as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        exposureDuration: (this.activatedRoute.snapshot.data.exposureDuration as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        contextOfTransmission: (this.activatedRoute.snapshot.data.contextOfTransmission as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        cluster: (this.activatedRoute.snapshot.data.cluster as IResolverV2ResponseModel<ClusterModel>).options
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
          this.dialogV2Service.showConfirmDialog({
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
   *
   * @param entities A list of pairs: entity id/name
   * @param contactDate Contact Date
   * @private
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
        moment(contactDate).isValid() &&
        moment(contactDate).isBefore(moment((sourceEntity as CaseModel).dateOfOnset))
      ) {
        // when new contacts are added keep the source date of onset
        if (RelationshipType.CONTACT) {
          this._warnings.sourceDateOfOnset = moment((sourceEntity as CaseModel).dateOfOnset).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
        }

        this._warnings.entities[this.isCreate ? entityId : sourceEntity.id] = {
          id: this.isCreate ? entityId : sourceEntity.id,
          name: this.isCreate ? entities[entityId] : sourceEntity.name,
          type: this.isCreate ? (this._createEntitiesMap[entityId] as CaseModel).type : sourceEntity.type,
          dateOfOnset: moment((sourceEntity as CaseModel).dateOfOnset).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT)
        };
      } else {
        // remove if exists
        delete this._warnings.entities[this.isCreate ? entityId : sourceEntity.id];
      }
    });

    // hide current warning to re-display the updated message
    this.toastV2Service.hide(AppMessages.APP_MESSAGE_LAST_CONTACT_SHOULD_NOT_BE_BEFORE_DATE_OF_ONSET);

    // show the updated message
    if (Object.keys(this._warnings.entities).length) {
      this.toastV2Service.notice(
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
              return `${item.name} (${this.translateService.instant(item.type)})`;
            }

            // create url
            const url: string = `/cases/${item.id}/view`;

            // finished
            const additionalInfo = this.isCreate && this.relationshipType === RelationshipType.EXPOSURE ?
              this.translateService.instant('LNG_ENTITY_FIELD_LABEL_DATE_OF_ONSET') + ': ' + item.dateOfOnset :
              '';

            // return entity as a link
            return `<br><a class="gd-alert-link" href="${this.location.prepareExternalUrl(url)}"><span>${item.name} (${this.translateService.instant(item.type)}) ${additionalInfo}</span></a>`;
          })
            .join(', ')
        },
        AppMessages.APP_MESSAGE_LAST_CONTACT_SHOULD_NOT_BE_BEFORE_DATE_OF_ONSET
      );
    }
  }
}
