import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CaseModel } from '../../../../core/models/case.model';
import { ActivatedRoute, Router } from '@angular/router';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { RelationshipType } from '../../../../core/enums/relationship-type.enum';
import { catchError, takeUntil } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { CreateViewModifyV2TabInputType, ICreateViewModifyV2Buttons, ICreateViewModifyV2CreateOrUpdate, ICreateViewModifyV2Tab } from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import * as moment from 'moment';
import { TopnavComponent } from '../../../../core/components/topnav/topnav.component';
import { ReferenceDataHelperService } from '../../../../core/services/helper/reference-data-helper.service';
import { ContactsOfContactsDataService } from '../../../../core/services/data/contacts-of-contacts.data.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';

@Component({
  selector: 'app-create-entity-relationship-bulk',
  templateUrl: './create-entity-relationship-bulk.component.html'
})
export class CreateEntityRelationshipBulkComponent extends CreateViewModifyComponent<RelationshipModel> implements OnDestroy {
  // entity related data
  private _entity: CaseModel | ContactModel | EventModel;
  entityType: EntityType;
  entityId: string;
  relationshipType: RelationshipType;
  isAddAndConvert: boolean = false;
  private _relationship: RelationshipModel = new RelationshipModel();

  // Entities Map for specific data
  entityMap = {
    [EntityType.CASE]: {
      'label': 'LNG_PAGE_LIST_CASES_TITLE',
      'link': '/cases'
    },
    [EntityType.CONTACT]: {
      'label': 'LNG_PAGE_LIST_CONTACTS_TITLE',
      'link': '/contacts'
    },
    [EntityType.EVENT]: {
      'label': 'LNG_PAGE_LIST_EVENTS_TITLE',
      'link': '/events'
    },
    [EntityType.CONTACT_OF_CONTACT]: {
      'label': 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE',
      'link': '/contacts-of-contacts'
    }
  };

  // route data
  selectedSourceIds: string[] = [];
  selectedTargetIds: string[] = [];

  // current date
  currentDate = this.Constants.getCurrentDate();

  // get route path
  get relationshipTypeRoutePath(): string {
    return this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures';
  }

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private entityDataService: EntityDataService,
    private relationshipDataService: RelationshipDataService,
    private referenceDataHelperService: ReferenceDataHelperService,
    private contactDataService: ContactDataService,
    private contactsOfContactsDataService: ContactsOfContactsDataService,
    private dialogV2Service: DialogV2Service,
    protected toastV2Service: ToastV2Service,
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

    // disable select outbreak
    TopnavComponent.SELECTED_OUTBREAK_DROPDOWN_DISABLED = true;

    // get addAndConvert flag
    this.isAddAndConvert = this.activatedRoute.snapshot.data.addAndConvert;

    // get relationship type
    this.relationshipType = this.activatedRoute.snapshot.data.relationshipType;

    // get person type and ID from route params
    this.entityType = this.activatedRoute.snapshot.params.entityType;
    this.entityId = this.activatedRoute.snapshot.params.entityId;

    // get source and target persons from query params
    this.selectedSourceIds = JSON.parse(this.activatedRoute.snapshot.queryParams.selectedSourceIds);
    this.selectedTargetIds = this.isAddAndConvert ?
      [this.entityId] :
      JSON.parse(this.activatedRoute.snapshot.queryParams.selectedTargetIds);
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // parent
    super.onDestroy();

    // enable select outbreak
    TopnavComponent.SELECTED_OUTBREAK_DROPDOWN_DISABLED = false;
  }

  /**
   * Create new item model if needed
   */
  protected createNewItem(): RelationshipModel {
    return null;
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(): Observable<RelationshipModel> {
    return new Observable<RelationshipModel>((subscriber) => {
      // get person data
      this.entityDataService
        .getEntity(this.entityType, this.selectedOutbreak.id, this.entityId)
        .pipe(
          catchError((err) => {
            this.toastV2Service.error(err);

            // Entity not found; navigate back to Entities list
            this.router.navigate([this.entityMap[this.entityType].link]);

            return throwError(err);
          })
        )
        .subscribe((entityData: CaseModel | ContactModel | EventModel) => {
          this._entity = entityData;

          // finished - no item to edit
          subscriber.next(null);
          subscriber.complete();
        });
    });
  }

  /**
   * Data initialized
   */
  protected initializedData(): void { }

  /**
   * Initialize page title
   */
  protected initializePageTitle(): void {
    // add info accordingly to page type
    if (this.isModify) {
      this.pageTitle = 'LNG_PAGE_CREATE_ENTITY_RELATIONSHIP_BULK_TITLE';
      this.pageTitleData = undefined;
    }
  }

  /**
   * Initialize tabs
   */
  protected initializeTabs(): void {
    this.tabData = {
      // tabs
      tabs: [
        // Detail
        this.initializeDetailTab()
      ],

      // create details
      create: null,

      // buttons
      buttons: this.initializeButtons(),

      // create or update
      createOrUpdate: this.initializeProcessData(),
      redirectAfterCreateUpdate: () => {
        if (this.isAddAndConvert) {
          // show loading
          const loading = this.dialogV2Service.showLoadingDialog();

          // convert the entity
          const convertSubscriber = this.entityType === EntityType.CONTACT_OF_CONTACT ?
            this.contactsOfContactsDataService.convertContactOfContactToContact(this.selectedOutbreak.id, this.entityId) :
            this.contactDataService.convertContactToContactOfContact(this.selectedOutbreak.id, this.entityId);
          convertSubscriber
            .pipe(
              catchError((err) => {
                // show error
                this.toastV2Service.error(err);

                // hide loading
                loading.close();

                // send error down the road
                return throwError(err);
              })
            )
            .subscribe(() => {
              // success
              this.toastV2Service.success(this.entityType === EntityType.CONTACT_OF_CONTACT ?
                'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_CONVERT_TO_CONTACT_SUCCESS_MESSAGE' :
                'LNG_PAGE_LIST_CONTACTS_ACTION_CONVERT_CONTACT_OF_CONTACT_SUCCESS_MESSAGE'
              );

              // hide loading
              loading.close();

              // navigate back to Entities list
              this.router.navigate([this.entityMap[this.entityType].link]);
            });
        } else {
          // update - redirect to view
          this.router.navigate([`/relationships/${ this.entityType }/${ this.entityId }/${ this.relationshipTypeRoutePath }`]);
        }
      }
    };
  }

  /**
   * Initialize expand list column renderer fields
   */
  protected initializeExpandListColumnRenderer(): void { }

  /**
   * Initialize expand list query fields
   */
  protected initializeExpandListQueryFields(): void { }

  /**
   * Initialize expand list advanced filters
   */
  protected initializeExpandListAdvancedFilters(): void { }

  /**
   * Refresh expand list
   */
  refreshExpandList(): void {}

  /**
   * Initialize process data
   */
  private initializeProcessData(): ICreateViewModifyV2CreateOrUpdate {
    return (
      _type,
      _data,
      finished
    ) => {
      // something went wrong ?
      if (this.selectedSourceIds.length < 1 || this.selectedTargetIds.length < 1) {
        // show error
        this.toastV2Service.error('LNG_PAGE_CREATE_ENTITY_ERROR_NO_SELECTED_ENTITIES');

        // don't do anything
        return;
      }

      // which are sources and which are targets (based on relationship type) ?
      let relationshipSources = this.selectedSourceIds;
      let relationshipTargets = this.selectedTargetIds;
      if (
        this.relationshipType === RelationshipType.EXPOSURE &&
        !this.isAddAndConvert
      ) {
        relationshipTargets = this.selectedSourceIds;
        relationshipSources = this.selectedTargetIds;
      }

      // bulk insert relationships
      const relationshipsBulkData = {
        sources: relationshipSources,
        targets: relationshipTargets,
        relationship: this._relationship
      };
      this.relationshipDataService
        .createBulkRelationships(this.selectedOutbreak.id, relationshipsBulkData)
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
        .subscribe(() => {
          this.toastV2Service.success('LNG_PAGE_CREATE_ENTITY_RELATIONSHIP_BULK_SUCCESS_MESSAGE');

          // finished with success
          finished(undefined, null);
        });
    };
  }

  /**
   * Initialize buttons
   */
  private initializeButtons(): ICreateViewModifyV2Buttons {
    return {
      view: null,
      modify: {
        link: {
          link: () => [`/relationships/${ this.entityType }/${ this.entityId }/${ this.relationshipTypeRoutePath }`]
        },
        visible: () => RelationshipModel.canModify(this.authUser)
      },
      createCancel: null,
      viewCancel: null,
      modifyCancel: {
        link: {
          link: () => [`/relationships/${ this.entityType }/${ this.entityId }/${ this.relationshipTypeRoutePath }`]
        }
      },
      quickActions: null
    };
  }

  /**
   * Details tabs
   */
  private initializeDetailTab(): ICreateViewModifyV2Tab {
    // modify ?
    return {
      // Details
      type: CreateViewModifyV2TabInputType.TAB,
      name: 'details',
      label: 'LNG_COMMON_LABEL_DETAILS',
      sections: [
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_PAGE_CREATE_ENTITY_RELATIONSHIP_BULK_TAB_RELATIONSHIPS',
          inputs: [
            // inputs
            {
              type: CreateViewModifyV2TabInputType.DATE,
              name: 'dateOfFirstContact',
              placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_DATE_OF_FIRST_CONTACT',
              description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_DATE_OF_FIRST_CONTACT_DESCRIPTION',
              maxDate: this.currentDate,
              minDate: this.selectedOutbreak && this.selectedOutbreak.startDate ?
                moment(this.selectedOutbreak.startDate).subtract(6, 'months').format() :
                undefined,
              value: {
                get: () => this._relationship.dateOfFirstContact,
                set: (value) => this._relationship.dateOfFirstContact = value
              }
            },
            {
              type: CreateViewModifyV2TabInputType.DATE,
              name: 'contactDate',
              placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE',
              description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_DESCRIPTION',
              maxDate: this.currentDate,
              minDate: this.selectedOutbreak && this.selectedOutbreak.startDate ?
                moment(this.selectedOutbreak.startDate).subtract(6, 'months').format() :
                undefined,
              value: {
                get: () => this._relationship.contactDate,
                set: (value) => this._relationship.contactDate = value
              },
              validators: {
                required: () => true
              }
            },
            {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'contactDateEstimated',
              placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_ESTIMATED',
              description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_ESTIMATED_DESCRIPTION',
              value: {
                get: () => this._relationship.contactDateEstimated,
                set: (value) => this._relationship.contactDateEstimated = value
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'certaintyLevelId',
              placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL',
              description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL_DESCRIPTION',
              options: this.activatedRoute.snapshot.data.certainty.options,
              value: {
                get: () => {
                  this._relationship.certaintyLevelId = this.activatedRoute.snapshot.data.certainty.options[0].value;
                  return this._relationship.certaintyLevelId;
                },
                set: (value) => this._relationship.certaintyLevelId = value
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'exposureTypeId',
              placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE',
              description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE_DESCRIPTION',
              options: this.referenceDataHelperService.filterPerOutbreakOptions(
                this.selectedOutbreak,
                this.activatedRoute.snapshot.data.exposureType.options,
                this._relationship.exposureTypeId
              ),
              value: {
                get: () => this._relationship.exposureTypeId,
                set: (value) => this._relationship.exposureTypeId = value
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'exposureFrequencyId',
              placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY',
              description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY_DESCRIPTION',
              options: this.referenceDataHelperService.filterPerOutbreakOptions(
                this.selectedOutbreak,
                this.activatedRoute.snapshot.data.exposureFrequency.options,
                this._relationship.exposureFrequencyId
              ),
              value: {
                get: () => this._relationship.exposureFrequencyId,
                set: (value) => this._relationship.exposureFrequencyId = value
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'exposureDurationId',
              placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION',
              description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION_DESCRIPTION',
              options: this.referenceDataHelperService.filterPerOutbreakOptions(
                this.selectedOutbreak,
                this.activatedRoute.snapshot.data.exposureDuration.options,
                this._relationship.exposureDurationId
              ),
              value: {
                get: () => this._relationship.exposureDurationId,
                set: (value) => this._relationship.exposureDurationId = value
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'socialRelationshipTypeId',
              placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION',
              description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION_DESCRIPTION',
              options: this.referenceDataHelperService.filterPerOutbreakOptions(
                this.selectedOutbreak,
                this.activatedRoute.snapshot.data.contextOfTransmission.options,
                this._relationship.socialRelationshipTypeId
              ),
              value: {
                get: () => this._relationship.socialRelationshipTypeId,
                set: (value) => this._relationship.socialRelationshipTypeId = value
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'clusterId',
              placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER',
              description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER_DESCRIPTION',
              options: this.activatedRoute.snapshot.data.cluster.options,
              value: {
                get: () => this._relationship.clusterId,
                set: (value) => this._relationship.clusterId = value
              }
            },
            {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'socialRelationshipDetail',
              placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP',
              description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP_DESCRIPTION',
              value: {
                get: () => this._relationship.socialRelationshipDetail,
                set: (value) => this._relationship.socialRelationshipDetail = value
              }
            },
            {
              type: CreateViewModifyV2TabInputType.TEXTAREA,
              name: 'comment',
              placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_COMMENT',
              description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_COMMENT_DESCRIPTION',
              value: {
                get: () => this._relationship.comment,
                set: (value) => this._relationship.comment = value
              }
            }
          ]
        }
      ]
    };
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
        label: this.entityMap[this.entityType].label,
        action: {
          link: [this.entityMap[this.entityType].link]
        }
      },
      {
        label: this._entity.name,
        action: {
          link: [`${ this.entityMap[this.entityType].link }/${ this.entityId }/view`]
        }
      },
      {
        label: this.relationshipType === RelationshipType.EXPOSURE ?
          'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_EXPOSURES_TITLE' :
          'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_CONTACTS_TITLE',
        action: {
          link: [`/relationships/${ this.entityType }/${ this.entityId }/${ this.relationshipTypeRoutePath }`]
        }
      },
      {
        label: this.relationshipType === RelationshipType.EXPOSURE ?
          (
            this.isAddAndConvert ?
              'LNG_PAGE_LIST_ENTITY_ADD_EXPOSURES_TITLE' :
              'LNG_PAGE_LIST_ENTITY_ASSIGN_EXPOSURES_TITLE'
          ) :
          'LNG_PAGE_LIST_ENTITY_ASSIGN_CONTACTS_TITLE',
        action: {
          link: [`/relationships/${this.entityType}/${this.entityId}/${this.relationshipTypeRoutePath}/` + (this.isAddAndConvert ? 'add' : 'share')],
          linkQueryParams: {
            selectedTargetIds: JSON.stringify(this.selectedTargetIds)
          }
        }
      },
      {
        label: 'LNG_PAGE_CREATE_ENTITY_RELATIONSHIP_BULK_TITLE',
        action: null
      }
    ];
  }
}
