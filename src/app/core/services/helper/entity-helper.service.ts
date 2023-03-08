import { Injectable } from '@angular/core';
import { CaseModel } from '../../models/case.model';
import { ContactModel } from '../../models/contact.model';
import { EventModel } from '../../models/event.model';
import { EntityModel, RelationshipModel } from '../../models/entity-and-relationship.model';
import { ContactOfContactModel } from '../../models/contact-of-contact.model';
import { Observable, throwError } from 'rxjs';
import { DialogV2Service } from './dialog-v2.service';
import { IV2SideDialogConfigButtonType, IV2SideDialogConfigInputAccordion, V2SideDialogConfigInput, V2SideDialogConfigInputType } from '../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { EntityType } from '../../models/entity-type';
import { OutbreakModel } from '../../models/outbreak.model';
import { RelationshipDataService } from '../data/relationship.data.service';
import * as _ from 'lodash';
import { moment } from '../../helperClasses/x-moment';
import { Constants } from '../../models/constants';
import { ILabelValuePairModel } from '../../../shared/forms-v2/core/label-value-pair.model';
import { I18nService } from './i18n.service';
import { ToastV2Service } from './toast-v2.service';
import { IV2Column, IV2ColumnAction, IV2ColumnPinned, IV2ColumnStatusFormType, V2ColumnFormat, V2ColumnStatusForm } from '../../../shared/components-v2/app-list-table-v2/models/column.model';
import { RelationshipType } from '../../enums/relationship-type.enum';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { V2FilterTextType, V2FilterType } from '../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { IResolverV2ResponseModel } from '../resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../models/reference-data.model';
import { ClusterModel } from '../../models/cluster.model';
import { UserModel } from '../../models/user.model';
import { V2ActionType } from '../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2BottomDialogConfigButtonType } from '../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { TranslateService } from '@ngx-translate/core';
import { IBasicCount } from '../../models/basic-count.interface';
import { V2AdvancedFilter, V2AdvancedFilterType } from '../../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { v4 as uuid } from 'uuid';
import { catchError } from 'rxjs/operators';
import { AuthDataService } from '../data/auth.data.service';

/**
 * From ?
 */
enum SentFromColumn {
  CONTACTS = 'fromContacts',
  EXPOSURES = 'fromExposures'
}

@Injectable()
export class EntityHelperService {
  // entities map
  readonly entityMap: {
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

  /**
   * Constructor
   */
  constructor(
    private dialogV2Service: DialogV2Service,
    private relationshipDataService: RelationshipDataService,
    private i18nService: I18nService,
    private toastV2Service: ToastV2Service,
    private translateService: TranslateService,
    private authDataService: AuthDataService
  ) {}

  /**
   * Entity dialog
   */
  private showEntityDialog(
    selectedOutbreak: OutbreakModel,
    from: SentFromColumn,
    endpoint$: Observable<EntityModel[]>,
    entity: CaseModel | ContactModel | EventModel | ContactOfContactModel
  ): void  {
    this.dialogV2Service
      .showSideDialog({
        title: {
          get: () => from === SentFromColumn.CONTACTS ?
            'LNG_DIALOG_GENERAL_DIALOG_TITLE_GROUP_CONTACTS_DIALOG_TITLE' :
            'LNG_DIALOG_GENERAL_DIALOG_TITLE_GROUP_EXPOSURES_DIALOG_TITLE'
        },
        inputs: [],
        width: '65rem',
        bottomButtons: [{
          type: IV2SideDialogConfigButtonType.CANCEL,
          label: 'LNG_COMMON_BUTTON_CANCEL',
          color: 'text'
        }],
        initialized: (handler) => {
          // show loading
          handler.loading.show();

          // retrieve data
          endpoint$
            .pipe(
              catchError((err) => {
                // show error
                this.toastV2Service.error(err);

                // hide
                handler.hide();

                // send error down the road
                return throwError(err);
              })
            )
            .subscribe((data) => {
              // get the authenticated user
              const authUser = this.authDataService.getAuthenticatedUser();

              // construct list of inputs to display
              const entitiesList: IV2SideDialogConfigInputAccordion = {
                type: V2SideDialogConfigInputType.ACCORDION,
                name: 'entities-list',
                placeholder: 'LNG_PAGE_LIST_CASES_DIALOG_ENTITY_SECTION_TITLE',
                panels: []
              };
              const relationshipList: IV2SideDialogConfigInputAccordion = {
                type: V2SideDialogConfigInputType.ACCORDION,
                name: 'relationship-list',
                placeholder: 'LNG_PAGE_LIST_CASES_DIALOG_ENTITY_RELATIONSHIPS_TITLE',
                panels: []
              };

              // add entities and relationships
              data.forEach((relationshipData) => {
                // define entity panel inputs
                const entityInputs: V2SideDialogConfigInput[] = [];
                const relationshipsInputs: V2SideDialogConfigInput[] = [];

                // View full resource link
                entityInputs.push({
                  type: V2SideDialogConfigInputType.LINK,
                  name: `entities-list-view-list-${relationshipData.model.id}`,
                  placeholder: 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ACTION_VIEW_FULL_RESOURCE',
                  link: () => [
                    EntityModel.getLinkForEntityType(relationshipData.model.type),
                    relationshipData.model.id,
                    'view'
                  ],
                  visible: () => (
                    relationshipData.model.type !== EntityType.CONTACT_OF_CONTACT ||
                    selectedOutbreak?.isContactsOfContactsActive
                  ) &&
                    relationshipData.model.canView(authUser) &&
                    !relationshipData.model.deleted
                }, {
                  type: V2SideDialogConfigInputType.DIVIDER
                });

                // attach entity fields information
                this.lightEntity(relationshipData.model)
                  .forEach((labelValue) => {
                    entityInputs.push({
                      type: V2SideDialogConfigInputType.KEY_VALUE,
                      name: `entities-list-key-value-${relationshipData.model.id}-${labelValue.label}`,
                      placeholder: labelValue.label,
                      value: labelValue.value
                    });
                  });

                // add entities to the list
                entitiesList.panels.push({
                  type: V2SideDialogConfigInputType.ACCORDION_PANEL,
                  name: `entities-list-panels-${relationshipData.model.id}`,
                  placeholder: relationshipData.model.name,
                  inputs: entityInputs
                });

                // add related entities into relationship people to display relationship dialog
                relationshipData.relationship.people = [
                  new EntityModel(entity),
                  new EntityModel(relationshipData.model)
                ];

                // View full resource link
                const sourcePerson = relationshipData.relationship.sourcePerson;
                relationshipsInputs.push({
                  type: V2SideDialogConfigInputType.LINK,
                  name: `relationship-list-view-list-${relationshipData.relationship.id}`,
                  placeholder: 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ACTION_VIEW_FULL_RESOURCE',
                  link: () => [
                    `/relationships/${sourcePerson.type}/${sourcePerson.id}/contacts/${relationshipData.relationship.id}/view`
                  ],
                  visible: () => RelationshipModel.canView(authUser) &&
                    (
                      relationshipData.model.type !== EntityType.CONTACT_OF_CONTACT ||
                      selectedOutbreak?.isContactsOfContactsActive
                    ) &&
                    relationshipData.model.canView(authUser) &&
                    !relationshipData.model.deleted
                }, {
                  type: V2SideDialogConfigInputType.DIVIDER
                });

                // attach entity fields information
                this.lightRelationship(relationshipData.relationship)
                  .forEach((labelValue) => {
                    relationshipsInputs.push({
                      type: V2SideDialogConfigInputType.KEY_VALUE,
                      name: `relationship-list-key-value-${relationshipData.relationship.id}-${labelValue.label}`,
                      placeholder: labelValue.label,
                      value: labelValue.value
                    });
                  });

                // add relationships to the list
                relationshipList.panels.push({
                  type: V2SideDialogConfigInputType.ACCORDION_PANEL,
                  name: `entities-list-panels-${relationshipData.relationship.id}`,
                  placeholder: from === SentFromColumn.CONTACTS ?
                    `${entity.name} - ${relationshipData.model.name}` :
                    `${entity.name} - ${relationshipData.model.name}`,
                  inputs: relationshipsInputs
                });
              });


              // update inputs
              handler.update.inputs([
                {
                  type: V2SideDialogConfigInputType.LINK,
                  name: 'view-main-entity',
                  placeholder: from === SentFromColumn.CONTACTS ?
                    'LNG_DIALOG_GENERAL_DIALOG_LINK_FULL_LIST_CONTACTS' :
                    'LNG_DIALOG_GENERAL_DIALOG_LINK_FULL_LIST_EXPOSURES',
                  link: () => [from === SentFromColumn.CONTACTS ?
                    `/relationships/${entity.type}/${entity.id}/contacts` :
                    `/relationships/${entity.type}/${entity.id}/exposures`]
                },
                entitiesList,
                relationshipList
              ]);

              // hide loading
              handler.loading.hide();
            });
        }
      })
      .subscribe();
  }

  /**
   * Entity dialog
   */
  showEntityDetailsDialog(
    title: string,
    entity: CaseModel | ContactModel | EventModel | ContactOfContactModel | RelationshipModel,
    selectedOutbreak: OutbreakModel,
    config?: {
      displayPersonalCotLink: boolean,
      snapshotId: string,
      showPersonContacts: boolean,
      showPersonContactsOfContacts: boolean
    } | {
      showResourceViewPageLink: boolean
    }
  ): void  {
    // retrieve entity details
    let data: ILabelValuePairModel[] = [];
    if (entity instanceof RelationshipModel) {
      data = this.lightRelationship(entity);
    } else {
      data = this.lightEntity(entity);
    }

    // construct inputs
    const inputs: V2SideDialogConfigInput[] = [];
    data.forEach((item) => {
      inputs.push({
        type: V2SideDialogConfigInputType.KEY_VALUE,
        name: uuid(),
        placeholder: item.label,
        value: item.value
      });
    });

    // additional inputs - entity view
    if (
      entity instanceof CaseModel ||
      entity instanceof ContactModel ||
      entity instanceof EventModel || (
        entity instanceof ContactOfContactModel &&
        selectedOutbreak.isContactsOfContactsActive
      )
    ) {
      inputs.push({
        type: V2SideDialogConfigInputType.LINK,
        name: uuid(),
        placeholder: 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ACTION_VIEW_FULL_RESOURCE',
        link: () => [
          EntityModel.getLinkForEntityType(entity.type),
          entity.id,
          'view'
        ]
      });
    }

    // additional inputs - entity cot
    const entityConfig = config as {
      displayPersonalCotLink: boolean,
      snapshotId: string,
      showPersonContacts: boolean,
      showPersonContactsOfContacts: boolean
    };
    if (
      (
        entity instanceof CaseModel ||
        entity instanceof ContactModel ||
        entity instanceof EventModel
      ) &&
      entityConfig?.displayPersonalCotLink
    ) {
      inputs.push({
        type: V2SideDialogConfigInputType.LINK,
        name: uuid(),
        placeholder: 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ACTION_VIEW_CHAIN_OF_TRANSMISSION',
        link: () => ['/redirect'],
        linkQueryParams: () => ({
          path: JSON.stringify(['/transmission-chains']),
          data: JSON.stringify({
            personId: entity.id,
            selectedEntityType: entity.type,
            snapshotId: entityConfig?.snapshotId,
            showPersonContacts: entityConfig?.showPersonContacts,
            showPersonContactsOfContacts: entityConfig?.showPersonContactsOfContacts
          })
        })
      });
    }

    // additional inputs - entity cot
    const relationshipConfig = config as {
      showResourceViewPageLink: boolean
    };
    if (
      entity instanceof RelationshipModel &&
      relationshipConfig?.showResourceViewPageLink &&
      entity.sourcePerson
    ) {
      // determine relationship link
      inputs.push({
        type: V2SideDialogConfigInputType.LINK,
        name: uuid(),
        placeholder: 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ACTION_VIEW_FULL_RESOURCE',
        link: () => [
          `/relationships/${entity.sourcePerson.type}/${entity.sourcePerson.id}/contacts/${entity.id}/view`
        ]
      });
    }

    // display dialog
    this.dialogV2Service
      .showSideDialog({
        title: {
          get: () => title
        },
        inputs,
        width: '65rem',
        bottomButtons: [{
          type: IV2SideDialogConfigButtonType.CANCEL,
          label: 'LNG_COMMON_BUTTON_CANCEL',
          color: 'text'
        }]
      })
      .subscribe();
  }

  /**
   * Get light entity
   */
  lightEntity(
    entity: CaseModel | EventModel | ContactModel | ContactOfContactModel
  ): ILabelValuePairModel[] {
    // create list of fields to display
    const lightObject: ILabelValuePairModel[] = [];

    // case, contact and contact of contacts
    if (
      entity instanceof CaseModel ||
      entity instanceof ContactModel ||
      entity instanceof ContactOfContactModel
    ) {
      // name
      lightObject.push(
        {
          label: 'LNG_CASE_FIELD_LABEL_FIRST_NAME',
          value: entity.firstName
        }, {
          label: 'LNG_CASE_FIELD_LABEL_LAST_NAME',
          value: entity.lastName
        }
      );

      // display age. decide between years and months
      let ageUnit: string = this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS');
      let ageValue: number = _.get(entity, 'age.years', 0);
      const ageMonths = _.get(entity, 'age.months', 0);
      if (ageMonths > 0) {
        // show age in months
        ageUnit = this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS');
        ageValue = ageMonths;
      }

      // push age
      lightObject.push({
        label: 'LNG_CASE_FIELD_LABEL_AGE',
        value: `${ageValue} ${ageUnit}`
      });

      // other fields
      lightObject.push(
        {
          label: 'LNG_CASE_FIELD_LABEL_GENDER',
          value: entity.gender
        }, {
          label: 'LNG_CASE_FIELD_LABEL_OCCUPATION',
          value: entity.occupation
        }, {
          label: 'LNG_CASE_FIELD_LABEL_LAST_VISUAL_ID',
          value: entity.visualId
        }, {
          label: 'LNG_CASE_FIELD_LABEL_RISK_LEVEL',
          value: entity.riskLevel
        }, {
          label: 'LNG_CASE_FIELD_LABEL_RISK_REASON',
          value: entity.riskReason
        }
      );
    }

    // entity type = Case
    if (entity instanceof CaseModel) {
      lightObject.push(
        {
          label: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION',
          value: entity.classification
        }, {
          label: 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET',
          value: entity.dateOfOnset ?
            moment(entity.dateOfOnset).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
            ''
        }, {
          label: 'LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE',
          value: entity.dateBecomeCase ?
            moment(entity.dateBecomeCase).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
            ''
        }, {
          label: 'LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION',
          value: entity.dateOfInfection ?
            moment(entity.dateOfInfection).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
            ''
        }
      );
    }

    // case, contact and contact of contacts
    if (
      entity instanceof CaseModel ||
      entity instanceof ContactModel ||
      entity instanceof ContactOfContactModel
    ) {
      lightObject.push({
        label: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING',
        value: entity.dateOfReporting ?
          moment(entity.dateOfReporting).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
          ''
      });
    }

    // entity type = Event
    if (entity instanceof EventModel) {
      lightObject.push(
       {
          label: 'LNG_EVENT_FIELD_LABEL_NAME',
          value: entity.name
        }, {
          label: 'LNG_EVENT_FIELD_LABEL_VISUAL_ID',
          value: entity.visualId
        }, {
          label: 'LNG_EVENT_FIELD_LABEL_DATE',
          value: entity.date ?
            moment(entity.date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
            ''
        }, {
          label: 'LNG_EVENT_FIELD_LABEL_DESCRIPTION',
          value: entity.description
        }, {
          label: 'LNG_EVENT_FIELD_LABEL_DATE_OF_REPORTING',
          value: entity.dateOfReporting ?
            moment(entity.dateOfReporting).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
            ''
        }
      );
    }

    // finished
    return lightObject;
  }

  /**
   * Get light relationship
   */
  lightRelationship(
    relationship: RelationshipModel
  ): ILabelValuePairModel[] {
    // determine source and target
    const sourcePerson = _.find(relationship.persons, person => person.source === true);
    const sourcePeople = _.find(relationship.people, people => people.model.id === sourcePerson.id);
    const destinationPeople = _.find(relationship.people, people => people.model.id !== sourcePerson.id);

    // create list of fields to display
    const lightObject: ILabelValuePairModel[] = [];
    lightObject.push(
      {
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_SOURCE',
        value: sourcePeople.model.name
      }, {
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_TARGET',
        value: destinationPeople.model.name
      }, {
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE',
        value: relationship.contactDate ?
          moment(relationship.contactDate).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
          ''
      }, {
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL',
        value: relationship.certaintyLevelId
      }, {
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE',
        value: relationship.exposureTypeId
      }, {
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY',
        value: relationship.exposureFrequencyId
      }, {
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION',
        value: relationship.exposureDurationId
      }, {
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION',
        value: relationship.socialRelationshipTypeId
      }, {
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP',
        value: relationship.socialRelationshipDetail
      }, {
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_COMMENT',
        value: relationship.comment
      }
    );

    // finished
    return lightObject;
  }

  /**
   * Contacts list
   */
  contacts(
    selectedOutbreak: OutbreakModel,
    entity: CaseModel | ContactModel | EventModel | ContactOfContactModel
  ): void {
    this.showEntityDialog(
      selectedOutbreak,
      SentFromColumn.CONTACTS,
      this.relationshipDataService.getEntityContacts(
        selectedOutbreak.id,
        entity.type,
        entity.id
      ),
      entity
    );
  }

  /**
   * Exposures list
   */
  exposures(
    selectedOutbreak: OutbreakModel,
    entity: CaseModel | ContactModel | EventModel | ContactOfContactModel
  ): void {
    this.showEntityDialog(
      selectedOutbreak,
      SentFromColumn.EXPOSURES,
      this.relationshipDataService.getEntityExposures(
        selectedOutbreak.id,
        entity.type,
        entity.id
      ),
      entity
    );
  }

  /**
   * Retrieve table columns
   */
  retrieveTableColumnActions(definitions: {
    selectedOutbreakIsActive: () => boolean,
    selectedOutbreak: () => OutbreakModel,
    entity: CaseModel | ContactModel | EventModel | ContactOfContactModel,
    relationshipType: RelationshipType,
    authUser: UserModel,
    refreshList: () => void
  }): IV2ColumnAction {
    return {
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
              return ['/relationships', definitions.entity.type, definitions.entity.id, definitions.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures', item.relationship.id, 'view'];
            }
          },
          visible: (item: EntityModel): boolean => {
            return !item.relationship.deleted &&
              RelationshipModel.canView(definitions.authUser) &&
              this.entityMap[definitions.entity.type].can[definitions.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures'].view(definitions.authUser);
          }
        },

        // Modify
        {
          type: V2ActionType.ICON,
          icon: 'edit',
          iconTooltip: 'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_ACTION_MODIFY_RELATIONSHIP',
          action: {
            link: (item: EntityModel): string[] => {
              return ['/relationships', definitions.entity.type, definitions.entity.id, definitions.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures', item.relationship.id, 'modify'];
            }
          },
          visible: (item: EntityModel): boolean => {
            return !item.relationship.deleted &&
              definitions.selectedOutbreakIsActive() &&
              RelationshipModel.canModify(definitions.authUser) &&
              this.entityMap[definitions.entity.type].can[definitions.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures'].modify(definitions.authUser);
          }
        },

        // Other actions
        {
          type: V2ActionType.MENU,
          icon: 'more_horiz',
          menuOptions: [
            // Delete
            {
              label: {
                get: () => 'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_ACTION_DELETE_RELATIONSHIP'
              },
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
                        definitions.selectedOutbreak().id,
                        definitions.entity.type,
                        definitions.entity.id,
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
                        definitions.refreshList();
                      });
                  });
                }
              },
              visible: (item: CaseModel): boolean => {
                return !item.deleted &&
                  definitions.selectedOutbreakIsActive() &&
                  CaseModel.canDelete(definitions.authUser);
              }
            }
          ]
        }
      ]
    };
  }

  /**
   * Retrieve table columns
   */
  retrieveTableColumns(definitions: {
    authUser: UserModel,
    personType: IResolverV2ResponseModel<ReferenceDataEntryModel>,
    cluster: IResolverV2ResponseModel<ClusterModel>,
    options: {
      certaintyLevel: ILabelValuePairModel[],
      exposureType: ILabelValuePairModel[],
      exposureFrequency: ILabelValuePairModel[],
      exposureDuration: ILabelValuePairModel[],
      contextOfTransmission: ILabelValuePairModel[],
      user: ILabelValuePairModel[]
    }
  }): IV2Column[] {
    // default table columns
    const tableColumns: IV2Column[] = [
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
        },
        link: (data) => {
          return data.model && data.model.canView(definitions.authUser) && !data.model.deleted ?
            `${this.entityMap[data.model.type].link}/${data.model.id}/view` :
            undefined;
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
        },
        link: (data) => {
          return data.model && data.model.canView(definitions.authUser) && !data.model.deleted ?
            `${this.entityMap[data.model.type].link}/${data.model.id}/view` :
            undefined;
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
        },
        link: (data) => {
          return data.model && data.model.canView(definitions.authUser) && !data.model.deleted ?
            `${this.entityMap[data.model.type].link}/${data.model.id}/view` :
            undefined;
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
            items: definitions.personType.list.map((item) => {
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
          if (
            data.type &&
            definitions.personType.map[data.type]
          ) {
            forms.push({
              type: IV2ColumnStatusFormType.CIRCLE,
              color: definitions.personType.map[data.type].getColorCode(),
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
          childQueryBuilderKey: 'relationship'
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
          childQueryBuilderKey: 'relationship',
          options: definitions.options.certaintyLevel,
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
          childQueryBuilderKey: 'relationship',
          options: definitions.options.exposureType,
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
          childQueryBuilderKey: 'relationship',
          options: definitions.options.exposureFrequency,
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
          childQueryBuilderKey: 'relationship',
          options: definitions.options.exposureDuration,
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
          childQueryBuilderKey: 'relationship',
          options: definitions.options.contextOfTransmission,
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
          childQueryBuilderKey: 'relationship'
        }
      }
    ];

    // by cluster
    if (ClusterModel.canList(definitions.authUser)) {
      tableColumns.push({
        field: 'clusterId',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER',
        format: {
          type: (item) => item.relationship?.clusterId && definitions.cluster.map[item.relationship?.clusterId] ?
            definitions.cluster.map[item.relationship?.clusterId].name :
            item.relationship?.clusterId
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          childQueryBuilderKey: 'relationship',
          options: definitions.cluster.options,
          includeNoValue: true
        }
      });
    }

    // general
    tableColumns.push(
      {
        field: 'createdBy',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CREATED_BY',
        format: {
          type: 'relationship.createdByUser.name'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: definitions.options.user,
          includeNoValue: true,
          childQueryBuilderKey: 'relationship'
        },
        exclude: (): boolean => {
          return !UserModel.canView(definitions.authUser);
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
          childQueryBuilderKey: 'relationship'
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
          options: definitions.options.user,
          includeNoValue: true,
          childQueryBuilderKey: 'relationship'
        },
        exclude: (): boolean => {
          return !UserModel.canView(definitions.authUser);
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
          childQueryBuilderKey: 'relationship'
        }
      }
    );

    // finished
    return tableColumns;
  }

  /**
   * Retrieve data
   */
  retrieveRecords(
    relationshipType: RelationshipType,
    selectedOutbreak: OutbreakModel,
    entity: CaseModel | ContactModel | EventModel | ContactOfContactModel,
    queryBuilder: RequestQueryBuilder
  ): Observable<EntityModel[]> {
    return relationshipType === RelationshipType.EXPOSURE ?
      this.relationshipDataService.getEntityExposures(
        selectedOutbreak.id,
        entity.type,
        entity.id,
        queryBuilder
      ) :
      this.relationshipDataService.getEntityContacts(
        selectedOutbreak.id,
        entity.type,
        entity.id,
        queryBuilder
      );
  }

  /**
   * Retrieve data count
   */
  retrieveRecordsCount(
    relationshipType: RelationshipType,
    selectedOutbreak: OutbreakModel,
    entity: CaseModel | ContactModel | EventModel | ContactOfContactModel,
    countQueryBuilder: RequestQueryBuilder
  ): Observable<IBasicCount> {
    return (relationshipType === RelationshipType.EXPOSURE ?
      this.relationshipDataService
        .getEntityExposuresCount(
          selectedOutbreak.id,
          entity.type,
          entity.id,
          countQueryBuilder
        ) :
      this.relationshipDataService
        .getEntityContactsCount(
          selectedOutbreak.id,
          entity.type,
          entity.id,
          countQueryBuilder
        )
    ).pipe(
      catchError((err) => {
        this.toastV2Service.error(err);
        return throwError(err);
      })
    );
  }

  /**
   * Advanced filters
   */
  generateAdvancedFilters(data: {
    options: {
      certaintyLevel: ILabelValuePairModel[],
      exposureType: ILabelValuePairModel[],
      exposureFrequency: ILabelValuePairModel[],
      exposureDuration: ILabelValuePairModel[],
      contextOfTransmission: ILabelValuePairModel[],
      cluster: ILabelValuePairModel[]
    }
  }): V2AdvancedFilter[] {
    // initialize
    const advancedFilters: V2AdvancedFilter[] = [
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'lastName',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_PERSON_LAST_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'firstName',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_PERSON_FIRST_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'visualId',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_PERSON_VISUAL_ID',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'contactDate',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE',
        childQueryBuilderKey: 'relationship'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'certaintyLevelId',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL',
        options: data.options.certaintyLevel,
        childQueryBuilderKey: 'relationship'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'exposureTypeId',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE',
        options: data.options.exposureType,
        childQueryBuilderKey: 'relationship'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'exposureFrequencyId',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY',
        options: data.options.exposureFrequency,
        childQueryBuilderKey: 'relationship'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'exposureDurationId',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION',
        options: data.options.exposureDuration,
        childQueryBuilderKey: 'relationship'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'socialRelationshipTypeId',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION',
        options: data.options.contextOfTransmission,
        childQueryBuilderKey: 'relationship'
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'socialRelationshipDetail',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION_DETAIL',
        childQueryBuilderKey: 'relationship'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'clusterId',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER',
        options: data.options.cluster,
        childQueryBuilderKey: 'relationship'
      }
    ];

    // finished
    return advancedFilters;
  }
}
