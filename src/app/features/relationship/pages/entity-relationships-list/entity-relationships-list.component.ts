import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { EntityModel, RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { TopnavComponent } from '../../../../core/components/topnav/topnav.component';
import { IV2ColumnPinned, IV2ColumnStatusFormType, V2ColumnFormat, V2ColumnStatusForm } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { RelationshipType } from '../../../../core/enums/relationship-type.enum';
import { EntityType } from '../../../../core/models/entity-type';
import * as _ from 'lodash';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { catchError, takeUntil, tap } from 'rxjs/operators';
import { throwError } from 'rxjs/internal/observable/throwError';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { TranslateService } from '@ngx-translate/core';
import { ClusterModel } from '../../../../core/models/cluster.model';
import { UserModel } from '../../../../core/models/user.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { RelationshipPersonModel } from '../../../../core/models/relationship-person.model';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';

@Component({
  selector: 'app-entity-relationships-list',
  templateUrl: './entity-relationships-list.component.html'
})
export class EntityRelationshipsListComponent extends ListComponent implements OnDestroy {
  // list of relationships
  relationshipsList$: Observable<EntityModel[]>;
  private _relationshipsListRecordsMap: {
    [idRelationship: string]: EntityModel
  } = {};

  // route
  relationshipType: RelationshipType;

  // entities map
  private _entityMap: {
    [entityType: string]: {
      label: string,
      link: string,
      can: {
        [type: string]: {
          view: (UserModel) => boolean,
          create: (UserModel) => boolean,
          modify: (UserModel) => boolean,
          delete: (UserModel) => boolean,
          share: (UserModel) => boolean,
          changeSource: (UserModel) => boolean,
          bulkDelete: (UserModel) => boolean
        }
      }
    }
  } = {
      [EntityType.CASE]: {
        label: 'LNG_PAGE_LIST_CASES_TITLE',
        link: '/cases',
        can: {
          contacts: {
            view: CaseModel.canViewRelationshipContacts,
            create: CaseModel.canCreateRelationshipContacts,
            modify: CaseModel.canModifyRelationshipContacts,
            delete: CaseModel.canDeleteRelationshipContacts,
            share: CaseModel.canShareRelationship,
            changeSource: CaseModel.canChangeSource,
            bulkDelete: CaseModel.canBulkDeleteRelationshipContacts
          },
          exposures: {
            view: CaseModel.canViewRelationshipExposures,
            create: CaseModel.canCreateRelationshipExposures,
            modify: CaseModel.canModifyRelationshipExposures,
            delete: CaseModel.canDeleteRelationshipExposures,
            share: CaseModel.canShareRelationship,
            changeSource: () => false,
            bulkDelete: CaseModel.canBulkDeleteRelationshipExposures
          }
        }
      },
      [EntityType.CONTACT]: {
        label: 'LNG_PAGE_LIST_CONTACTS_TITLE',
        link: '/contacts',
        can: {
          contacts: {
            view: ContactModel.canViewRelationshipContacts,
            create: ContactModel.canCreateRelationshipContacts,
            modify: ContactModel.canModifyRelationshipContacts,
            delete: ContactModel.canDeleteRelationshipContacts,
            share: ContactModel.canShareRelationship,
            changeSource: ContactModel.canChangeSource,
            bulkDelete: ContactModel.canBulkDeleteRelationshipContacts
          },
          exposures: {
            view: ContactModel.canViewRelationshipExposures,
            create: ContactModel.canCreateRelationshipExposures,
            modify: ContactModel.canModifyRelationshipExposures,
            delete: ContactModel.canDeleteRelationshipExposures,
            share: ContactModel.canShareRelationship,
            changeSource: ContactModel.canChangeSource,
            bulkDelete: ContactModel.canBulkDeleteRelationshipExposures
          }
        }
      },
      [EntityType.CONTACT_OF_CONTACT]: {
        label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE',
        link: '/contacts-of-contacts',
        can: {
          exposures: {
            view: ContactOfContactModel.canViewRelationshipExposures,
            create: ContactOfContactModel.canCreateRelationshipExposures,
            modify: ContactOfContactModel.canModifyRelationshipExposures,
            delete: ContactOfContactModel.canDeleteRelationshipExposures,
            share: ContactOfContactModel.canShareRelationship,
            changeSource: ContactOfContactModel.canChangeSource,
            bulkDelete: ContactOfContactModel.canBulkDeleteRelationshipExposures
          }
        }
      },
      [EntityType.EVENT]: {
        label: 'LNG_PAGE_LIST_EVENTS_TITLE',
        link: '/events',
        can: {
          contacts: {
            view: EventModel.canViewRelationshipContacts,
            create: EventModel.canCreateRelationshipContacts,
            modify: EventModel.canModifyRelationshipContacts,
            delete: EventModel.canDeleteRelationshipContacts,
            share: EventModel.canShareRelationship,
            changeSource: EventModel.canChangeSource,
            bulkDelete: EventModel.canBulkDeleteRelationshipContacts
          },
          exposures: {
            view: EventModel.canViewRelationshipExposures,
            create: EventModel.canCreateRelationshipExposures,
            modify: EventModel.canModifyRelationshipExposures,
            delete: EventModel.canDeleteRelationshipExposures,
            share: EventModel.canShareRelationship,
            changeSource: () => false,
            bulkDelete: EventModel.canBulkDeleteRelationshipExposures
          }
        }
      }
    };

  // entity
  private _entity: CaseModel | ContactModel | EventModel;

  // constants
  RelationshipType = RelationshipType;

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    protected activatedRoute: ActivatedRoute,
    protected relationshipDataService: RelationshipDataService,
    protected toastV2Service: ToastV2Service,
    protected translateService: TranslateService,
    protected router: Router,
    protected dialogV2Service: DialogV2Service
  ) {
    // parent
    super(
      listHelperService,
      true
    );

    // disable select outbreak
    TopnavComponent.SELECTED_OUTBREAK_DROPDOWN_DISABLED = true;

    // retrieve data from snapshot
    this.relationshipType = this.activatedRoute.snapshot.data.relationshipType;
    this._entity = this.activatedRoute.snapshot.data.entity;
  }

  /**
   * Component destroyed
   */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();

    // enable select outbreak
    TopnavComponent.SELECTED_OUTBREAK_DROPDOWN_DISABLED = false;
  }

  /**
   * Selected outbreak was changed
   */
  selectedOutbreakChanged(): void {
    // initialize pagination
    this.initPaginator();

    // ...and re-load the list when the Selected Outbreak is changed
    this.needsRefreshList(true);
  }

  /**
   * Initialize Side Table Columns
   */
  protected initializeTableColumns(): void {
    // default table columns
    this.tableColumns = [
      {
        field: 'lastName',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_PERSON_LAST_NAME',
        format: {
          type: 'model.lastName'
        },
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'firstName',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_PERSON_FIRST_NAME',
        format: {
          type: 'model.firstName'
        },
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'visualId',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_PERSON_VISUAL_ID',
        format: {
          type: 'model.visualId'
        },
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'statuses',
        label: 'LNG_COMMON_LABEL_STATUSES',
        format: {
          type: V2ColumnFormat.STATUS
        },
        notResizable: true,
        pinned: true,
        legends: [
          // person type
          {
            title: 'LNG_ENTITY_FIELD_LABEL_TYPE',
            items: (this.activatedRoute.snapshot.data.personType as IResolverV2ResponseModel<ReferenceDataEntryModel>).list.map((item) => {
              return {
                form: {
                  type: IV2ColumnStatusFormType.CIRCLE,
                  color: item.getColorCode()
                },
                label: item.id
              };
            })
          }
        ],
        forms: (_column, data): V2ColumnStatusForm[] => {
          // construct list of forms that we need to display
          const forms: V2ColumnStatusForm[] = [];

          // person type
          const personType = this.activatedRoute.snapshot.data.personType as IResolverV2ResponseModel<ReferenceDataEntryModel>;
          if (
            data.type &&
            personType.map[data.type]
          ) {
            forms.push({
              type: IV2ColumnStatusFormType.CIRCLE,
              color: personType.map[data.type].getColorCode(),
              tooltip: this.translateService.instant(data.type)
            });
          }

          // finished
          return forms;
        }
      },
      {
        field: 'contactDate',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE',
        format: {
          type: V2ColumnFormat.DATE,
          value: (item) => item.relationship?.contactDate
        },
        filter: {
          type: V2FilterType.DATE_RANGE,
          childQueryBuilder: 'relationship'
        }
      },
      {
        field: 'certaintyLevelId',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL',
        format: {
          type: (item) => item.relationship?.certaintyLevelId ?
            this.translateService.instant(item.relationship?.certaintyLevelId) :
            item.relationship?.certaintyLevelId
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          childQueryBuilder: 'relationship',
          options: (this.activatedRoute.snapshot.data.certaintyLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          includeNoValue: true
        }
      },
      {
        field: 'exposureTypeId',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE',
        format: {
          type: (item) => item.relationship?.exposureTypeId ?
            this.translateService.instant(item.relationship?.exposureTypeId) :
            item.relationship?.exposureTypeId
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          childQueryBuilder: 'relationship',
          options: (this.activatedRoute.snapshot.data.exposureType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          includeNoValue: true
        }
      },
      {
        field: 'exposureFrequencyId',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY',
        format: {
          type: (item) => item.relationship?.exposureFrequencyId ?
            this.translateService.instant(item.relationship?.exposureFrequencyId) :
            item.relationship?.exposureFrequencyId
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          childQueryBuilder: 'relationship',
          options: (this.activatedRoute.snapshot.data.exposureFrequency as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          includeNoValue: true
        }
      },
      {
        field: 'exposureDurationId',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION',
        format: {
          type: (item) => item.relationship?.exposureDurationId ?
            this.translateService.instant(item.relationship?.exposureDurationId) :
            item.relationship?.exposureDurationId
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          childQueryBuilder: 'relationship',
          options: (this.activatedRoute.snapshot.data.exposureDuration as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          includeNoValue: true
        }
      },
      {
        field: 'socialRelationshipTypeId',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION',
        format: {
          type: (item) => item.relationship?.socialRelationshipTypeId ?
            this.translateService.instant(item.relationship?.socialRelationshipTypeId) :
            item.relationship?.socialRelationshipTypeId
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          childQueryBuilder: 'relationship',
          options: (this.activatedRoute.snapshot.data.contextOfTransmission as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          includeNoValue: true
        }
      },
      {
        field: 'socialRelationshipDetail',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION_DETAIL',
        format: {
          type: 'relationship.socialRelationshipDetail'
        },
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH,
          childQueryBuilder: 'relationship'
        }
      }
    ];

    // by cluster
    if (ClusterModel.canList(this.authUser)) {
      this.tableColumns.push({
        field: 'clusterId',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER',
        format: {
          type: (item) => item.relationship?.clusterId && (this.activatedRoute.snapshot.data.cluster as IResolverV2ResponseModel<ClusterModel>).map[item.relationship?.clusterId] ?
            (this.activatedRoute.snapshot.data.cluster as IResolverV2ResponseModel<ClusterModel>).map[item.relationship?.clusterId].name :
            item.relationship?.clusterId
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          childQueryBuilder: 'relationship',
          options: (this.activatedRoute.snapshot.data.cluster as IResolverV2ResponseModel<ClusterModel>).options,
          includeNoValue: true
        }
      });
    }

    // general
    this.tableColumns.push(
      {
        field: 'createdBy',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CREATED_BY',
        format: {
          type: 'relationship.createdByUser.name'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
          includeNoValue: true,
          childQueryBuilder: 'relationship'
        },
        exclude: (): boolean => {
          return !UserModel.canView(this.authUser);
        },
        link: (data) => {
          return data.relationship?.createdBy ?
            `/users/${data.relationship.createdBy}/view` :
            undefined;
        }
      },
      {
        field: 'createdAt',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CREATED_AT',
        format: {
          type: V2ColumnFormat.DATE,
          value: (item) => item.relationship?.createdAt
        },
        filter: {
          type: V2FilterType.DATE_RANGE,
          childQueryBuilder: 'relationship'
        }
      },
      {
        field: 'updatedBy',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_UPDATED_BY',
        format: {
          type: 'relationship.updatedByUser.name'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
          includeNoValue: true,
          childQueryBuilder: 'relationship'
        },
        exclude: (): boolean => {
          return !UserModel.canView(this.authUser);
        },
        link: (data) => {
          return data.relationship?.updatedBy ?
            `/users/${data.relationship.updatedBy}/view` :
            undefined;
        }
      },
      {
        field: 'updatedAt',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_UPDATED_AT',
        format: {
          type: V2ColumnFormat.DATE,
          value: (item) => item.relationship?.updatedAt
        },
        filter: {
          type: V2FilterType.DATE_RANGE,
          childQueryBuilder: 'relationship'
        }
      },

      // actions
      {
        field: 'actions',
        label: 'LNG_COMMON_LABEL_ACTIONS',
        pinned: IV2ColumnPinned.RIGHT,
        notResizable: true,
        cssCellClass: 'gd-cell-no-focus',
        format: {
          type: V2ColumnFormat.ACTIONS
        },
        actions: [
          // View
          {
            type: V2ActionType.ICON,
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_ACTION_VIEW_RELATIONSHIP',
            action: {
              link: (item: EntityModel): string[] => {
                return ['/relationships', this._entity.type, this._entity.id, this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures', item.relationship.id, 'view'];
              }
            },
            visible: (item: EntityModel): boolean => {
              return !item.relationship.deleted &&
                RelationshipModel.canView(this.authUser) &&
                this._entityMap[this._entity.type].can[this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures'].view(this.authUser);
            }
          },

          // Modify
          {
            type: V2ActionType.ICON,
            icon: 'edit',
            iconTooltip: 'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_ACTION_MODIFY_RELATIONSHIP',
            action: {
              link: (item: EntityModel): string[] => {
                return ['/relationships', this._entity.type, this._entity.id, this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures', item.relationship.id, 'modify'];
              }
            },
            visible: (item: EntityModel): boolean => {
              return !item.relationship.deleted &&
                this.selectedOutbreakIsActive &&
                RelationshipModel.canModify(this.authUser) &&
                this._entityMap[this._entity.type].can[this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures'].modify(this.authUser);
            }
          },

          // Other actions
          {
            type: V2ActionType.MENU,
            icon: 'more_horiz',
            menuOptions: [
              // Delete
              {
                label: 'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_ACTION_DELETE_RELATIONSHIP',
                cssClasses: () => 'gd-list-table-actions-action-menu-warning',
                action: {
                  click: (item: EntityModel): void => {
                    // confirm
                    this.dialogV2Service.showConfirmDialog({
                      config: {
                        title: {
                          get: () => 'LNG_COMMON_LABEL_DELETE',
                          data: () => ({
                            name: item.model.name
                          })
                        },
                        message: {
                          get: () => 'LNG_DIALOG_CONFIRM_DELETE_RELATIONSHIP',
                          data: () => ({
                            name: item.model.name
                          })
                        }
                      }
                    }).subscribe((response) => {
                      // canceled ?
                      if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                        // finished
                        return;
                      }

                      // show loading
                      const loading = this.dialogV2Service.showLoadingDialog();

                      // delete
                      this.relationshipDataService
                        .deleteRelationship(
                          this.selectedOutbreak.id,
                          this._entity.type,
                          this._entity.id,
                          item.relationship.id
                        )
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
                          this.toastV2Service.success('LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_ACTION_DELETE_RELATIONSHIP_SUCCESS_MESSAGE');

                          // hide loading
                          loading.close();

                          // reload data
                          this.needsRefreshList(true);
                        });
                    });
                  }
                },
                visible: (item: CaseModel): boolean => {
                  return !item.deleted &&
                    this.selectedOutbreakIsActive &&
                    CaseModel.canDelete(this.authUser);
                }
              }
            ]
          }
        ]
      }
    );
  }

  /**
   * Initialize table infos
   */
  protected initializeTableInfos(): void {}

  /**
   * Initialize Table Advanced Filters
   */
  protected initializeTableAdvancedFilters(): void {
    this.advancedFilters = RelationshipModel.generateAdvancedFilters({
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
   * Initialize table quick actions
   */
  protected initializeQuickActions(): void {}

  /**
   * Initialize table group actions
   */
  protected initializeGroupActions(): void {
    this.groupActions = [
      // Share
      {
        label: this.relationshipType === RelationshipType.EXPOSURE ?
          'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_GROUP_ACTION_SHARE_SELECTED_EXPOSURES' :
          'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_GROUP_ACTION_SHARE_SELECTED_CONTACTS',
        action: {
          click: (selected: string[]) => {
            // determine list of model ids
            const selectedRecords: string[] = _.map(selected, (idRelationship: string) => this._relationshipsListRecordsMap[idRelationship].model.id)
              .filter((record, index, self) => {
                // keep only unique dates
                return self.indexOf(record) === index;
              });

            // redirect to next step
            this.router.navigate(
              [`/relationships/${this._entity.type}/${this._entity.id}/${this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures'}/share`],
              {
                queryParams: {
                  selectedTargetIds: JSON.stringify(selectedRecords)
                }
              }
            );
          }
        },
        visible: (): boolean => {
          return RelationshipModel.canShare(this.authUser) &&
            this._entityMap[this._entity.type].can[this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures'].share(this.authUser);
        },
        disable: (selected: string[]): boolean => {
          return selected.length < 1;
        }
      },

      // Change source
      {
        label: 'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_ACTION_CHANGE_SOURCE',
        action: {
          click: (selected: string[]) => {
            // pass the selected target persons for not including them in available peoples
            const selectedTargetPersons = {};
            _.forEach(this._relationshipsListRecordsMap, (model) => {
              const targetPerson: RelationshipPersonModel = _.find(model.relationship.persons, 'target');
              selectedTargetPersons[targetPerson.id] = true;
            });

            // redirect
            this.router.navigate(
              [`/relationships/${this._entity.type}/${this._entity.id}/${this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures'}/switch`],
              {
                queryParams: {
                  selectedTargetIds: JSON.stringify(selected),
                  selectedPersonsIds: JSON.stringify(Object.keys(selectedTargetPersons)),
                  entityType: JSON.stringify(this._entity.type)
                }
              }
            );
          }
        },
        visible: (): boolean => {
          return this.relationshipType === RelationshipType.CONTACT &&
            this._entityMap[this._entity.type].can[this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures'].changeSource(this.authUser);
        },
        disable: (selected: string[]): boolean => {
          return selected.length < 1;
        }
      },

      // Bulk delete
      {
        label: 'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_GROUP_ACTION_DELETE_SELECTED_RELATIONSHIPS',
        action: {
          click: (selected: string[]) => {
            // create query
            const qb = new RequestQueryBuilder();
            qb.filter.where({
              id: {
                inq: selected
              }
            });

            // ask for confirmation
            this.dialogV2Service
              .showConfirmDialog({
                config: {
                  title: {
                    get: () => 'LNG_PAGE_ACTION_DELETE'
                  },
                  message: {
                    get: () => 'LNG_DIALOG_CONFIRM_DELETE_RELATIONSHIPS'
                  }
                }
              })
              .subscribe((response) => {
                // canceled ?
                if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                  // finished
                  return;
                }

                // show loading
                const loading = this.dialogV2Service.showLoadingDialog();

                // delete relationships
                this.relationshipDataService
                  .deleteBulkRelationships(
                    this.selectedOutbreak.id,
                    qb
                  )
                  .pipe(
                    catchError((err) => {
                      this.toastV2Service.error(err);

                      // hide loading
                      loading.close();

                      return throwError(err);
                    })
                  )
                  .subscribe(() => {
                    this.toastV2Service.success('LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_GROUP_ACTION_DELETE_SELECTED_RELATIONSHIPS_SUCCESS_MESSAGE');

                    // hide loading
                    loading.close();

                    this.needsRefreshList(true);
                  });
              });
          }
        },
        visible: (): boolean => {
          return RelationshipModel.canBulkDelete(this.authUser) &&
            this._entityMap[this._entity.type].can[this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures'].bulkDelete(this.authUser);
        },
        disable: (selected: string[]): boolean => {
          return selected.length < 1;
        }
      }
    ];
  }

  /**
   * Initialize table add action
   */
  protected initializeAddAction(): void {
    this.addAction = {
      type: V2ActionType.ICON_LABEL,
      label: 'LNG_COMMON_BUTTON_ADD',
      icon: 'add_circle_outline',
      action: {
        link: (): string[] => [
          '/relationships',
          this._entity.type,
          this._entity.id,
          this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures',
          'available-entities'
        ]
      },
      visible: (): boolean => {
        return RelationshipModel.canCreate(this.authUser) &&
          this._entityMap[this._entity.type].can[this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures'].create(this.authUser);
      }
    };
  }

  /**
   * Initialize table grouped data
   */
  protected initializeGroupedData(): void {}

  /**
   * Initialize breadcrumbs
   */
  initializeBreadcrumbs(): void {
    // set breadcrumbs
    this.breadcrumbs = [
      {
        label: 'LNG_COMMON_LABEL_HOME',
        action: {
          link: DashboardModel.canViewDashboard(this.authUser) ?
            ['/dashboard'] :
            ['/version']
        }
      }, {
        label: this._entityMap[this._entity.type].label,
        action: {
          link: [this._entityMap[this._entity.type].link]
        }
      }, {
        label: this._entity.name,
        action: {
          link: [
            this._entityMap[this._entity.type].link,
            this._entity.id,
            'view'
          ]
        }
      }, {
        label: this.relationshipType === RelationshipType.EXPOSURE ?
          'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_EXPOSURES_TITLE' :
          'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_CONTACTS_TITLE',
        action: null
      }
    ];
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [];
  }

  /**
   * Re(load) the Relationships list, based on the applied filter, sort criterias
   */
  refreshList(): void {
    // request data
    this.relationshipsList$ = (
      this.relationshipType === RelationshipType.EXPOSURE ?
        this.relationshipDataService
          .getEntityExposures(
            this.selectedOutbreak.id,
            this._entity.type,
            this._entity.id,
            this.queryBuilder
          ) :
        this.relationshipDataService.getEntityContacts(
          this.selectedOutbreak.id,
          this._entity.type,
          this._entity.id,
          this.queryBuilder
        )
    ).pipe(
      tap((entities: EntityModel[]) => {
        // map models
        this._relationshipsListRecordsMap = {};
        (entities || []).forEach((entity) => {
          this._relationshipsListRecordsMap[entity.relationship.id] = entity;
        });
      }),

      // should be the last pipe
      takeUntil(this.destroyed$)
    );
  }

  /**
   * Get total number of items, based on the applied filters
   */
  refreshListCount(applyHasMoreLimit?: boolean): void {
    // reset
    this.pageCount = undefined;

    // set apply value
    if (applyHasMoreLimit !== undefined) {
      this.applyHasMoreLimit = applyHasMoreLimit;
    }

    // remove paginator from query builder
    const countQueryBuilder = _.cloneDeep(this.queryBuilder);
    countQueryBuilder.paginator.clear();
    countQueryBuilder.sort.clear();

    // apply has more limit
    if (this.applyHasMoreLimit) {
      countQueryBuilder.flag(
        'applyHasMoreLimit',
        true
      );
    }

    // count
    (
      this.relationshipType === RelationshipType.EXPOSURE ?
        this.relationshipDataService
          .getEntityExposuresCount(
            this.selectedOutbreak.id,
            this._entity.type,
            this._entity.id,
            countQueryBuilder
          ) :
        this.relationshipDataService
          .getEntityContactsCount(
            this.selectedOutbreak.id,
            this._entity.type,
            this._entity.id,
            countQueryBuilder
          )
    ).pipe(
      catchError((err) => {
        this.toastV2Service.error(err);
        return throwError(err);
      }),

      // should be the last pipe
      takeUntil(this.destroyed$)
    ).subscribe((response) => {
      this.pageCount = response;
    });
  }
}
