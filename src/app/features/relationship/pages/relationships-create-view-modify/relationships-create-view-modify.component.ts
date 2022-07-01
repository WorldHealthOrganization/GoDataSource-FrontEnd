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

@Component({
  selector: 'app-relationships-create-view-modify',
  templateUrl: './relationships-create-view-modify.component.html'
})
export class RelationshipsCreateViewModifyComponent extends CreateViewModifyComponent<RelationshipModel> implements OnDestroy {
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
  protected initializedData(): void {}

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
    title: string,
    name: (property: string) => string,
    relationshipData: RelationshipModel
  ): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
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
            }
          }, {
            type: CreateViewModifyV2TabInputType.DATE,
            name: name('contactDate'),
            placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE',
            description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_DESCRIPTION',
            value: {
              get: () => relationshipData.contactDate,
              set: (value) => {
                relationshipData.contactDate = value;
              }
            },
            maxDate: this._today,
            validators: {
              required: () => true,
              dateSameOrBefore: () => [
                this._today
              ]
            }
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
            }
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
            }
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
            }
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
            }
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
            }
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
            }
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
            }
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
            }
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
            }
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
            },
            visible: () => !this.isCreate
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
      get: (item: EntityModel) => item.model.name,
      link: (item: EntityModel) => [
        '/relationships',
        this._entity.type,
        this._entity.id,
        this.relationshipType === RelationshipType.CONTACT ?
          'contacts' :
          'exposures',
        item.relationship.id,
        'view'
      ]
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
}