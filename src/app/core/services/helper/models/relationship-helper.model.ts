import { UserModel } from '../../../models/user.model';
import { EntityType } from '../../../models/entity-type';
import { CaseModel } from '../../../models/case.model';
import { ContactModel } from '../../../models/contact.model';
import { ContactOfContactModel } from '../../../models/contact-of-contact.model';
import { EventModel } from '../../../models/event.model';
import { OutbreakModel } from '../../../models/outbreak.model';
import { EntityModel, RelationshipModel } from '../../../models/entity-and-relationship.model';
import { IAppFormIconButtonV2 } from '../../../../shared/forms-v2/core/app-form-icon-button-v2';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { CreateViewModifyV2TabInputType, ICreateViewModifyV2Tab } from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { Observable, throwError } from 'rxjs';
import { IV2SideDialogConfigButtonType, IV2SideDialogConfigInputAccordion, V2SideDialogConfigInput, V2SideDialogConfigInputType } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { catchError } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import * as _ from 'lodash';
import { Constants } from '../../../models/constants';
import { RelationshipType } from '../../../enums/relationship-type.enum';
import { IV2Column, IV2ColumnAction, IV2ColumnPinned, IV2ColumnStatusFormType, V2ColumnFormat, V2ColumnStatusForm } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { IResolverV2ResponseModel } from '../../resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../models/reference-data.model';
import { ClusterModel } from '../../../models/cluster.model';
import { V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { RequestQueryBuilder } from '../../../helperClasses/request-query-builder';
import { IBasicCount } from '../../../models/basic-count.interface';
import { V2AdvancedFilter, V2AdvancedFilterType } from '../../../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { PersonAndRelatedHelperService } from '../person-and-related-helper.service';
import { RelationshipDataService } from '../../data/relationship.data.service';
import { IV2ColumnToVisibleMandatoryConf, V2AdvancedFilterToVisibleMandatoryConf } from '../../../../shared/forms-v2/components/app-form-visible-mandatory-v2/models/visible-mandatory.model';
import { LocalizationHelper, Moment } from '../../../helperClasses/localization-helper';

/**
 * From ?
 */
enum SentFromColumn {
  CONTACTS = 'fromContacts',
  EXPOSURES = 'fromExposures'
}

export class RelationshipHelperModel {
  // data
  public readonly visibleMandatoryKey: string = 'relationships';

  // entities map
  readonly entityMap: {
    [entityType: string]: {
      label: string,
      link: string,
      can: {
        [type: string]: {
          view: (user: UserModel) => boolean,
          create: (user: UserModel) => boolean,
          modify: (user: UserModel) => boolean,
          delete: (user: UserModel) => boolean,
          share: (user: UserModel) => boolean,
          changeSource: (user: UserModel) => boolean,
          bulkDelete: (user: UserModel) => boolean
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
          contacts: {
            view: ContactOfContactModel.canViewRelationshipContacts,
            create: ContactOfContactModel.canCreateRelationshipContacts,
            modify: ContactOfContactModel.canModifyRelationshipContacts,
            delete: ContactOfContactModel.canDeleteRelationshipContacts,
            share: ContactOfContactModel.canShareRelationship,
            changeSource: ContactOfContactModel.canChangeSource,
            bulkDelete: ContactOfContactModel.canBulkDeleteRelationshipContacts
          },
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
    private parent: PersonAndRelatedHelperService,
    public relationshipDataService: RelationshipDataService
  ) {}

  /**
   * Generate tab - Details
   */
  generateTabsDetails(
    useToFilterOutbreak: OutbreakModel,
    data: {
      entityId: string,
      tabName: string,
      tabLabel: string,
      tabVisible: () => boolean,
      inputName: (property: string) => string
      itemData: RelationshipModel,
      createCopySuffixButtons: (prop: string) => IAppFormIconButtonV2[],
      checkForLastContactBeforeCaseOnSet: (
        entities: {
          [id: string]: string
        },
        contactDate: Moment | string
      ) => void
      options: {
        certaintyLevel: ILabelValuePairModel[],
        exposureType: ILabelValuePairModel[],
        exposureFrequency: ILabelValuePairModel[],
        exposureDuration: ILabelValuePairModel[],
        contextOfTransmission: ILabelValuePairModel[],
        cluster: ILabelValuePairModel[]
      }
    }
  ): ICreateViewModifyV2Tab {
    // today
    const today: Moment = LocalizationHelper.today();

    // create tab
    const tab: ICreateViewModifyV2Tab = this.parent.createViewModify.tabFilter(
      {
        type: CreateViewModifyV2TabInputType.TAB,
        name: data.tabName,
        label: data.tabLabel,
        visible: data.tabVisible,
        sections: [
          // Details
          {
            type: CreateViewModifyV2TabInputType.SECTION,
            label: 'LNG_COMMON_LABEL_DETAILS',
            inputs: [{
              type: CreateViewModifyV2TabInputType.DATE,
              name: data.inputName('dateOfFirstContact'),
              placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_DATE_OF_FIRST_CONTACT',
              description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_DATE_OF_FIRST_CONTACT_DESCRIPTION',
              value: {
                get: () => data.itemData.dateOfFirstContact,
                set: (value) => {
                  data.itemData.dateOfFirstContact = value;
                }
              },
              maxDate: today,
              validators: {
                dateSameOrBefore: () => [
                  today
                ]
              },
              suffixIconButtons: data.createCopySuffixButtons('dateOfFirstContact'),
              visibleMandatoryConf: {
                originalName: 'dateOfFirstContact'
              }
            }, {
              type: CreateViewModifyV2TabInputType.DATE,
              name: data.inputName('contactDate'),
              placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE',
              description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_DESCRIPTION',
              value: {
                get: () => data.itemData.contactDate,
                set: (value) => {
                  data.itemData.contactDate = value;

                  // validate against date of onset
                  data.checkForLastContactBeforeCaseOnSet(
                    { [data.entityId]: data.tabLabel },
                    data.itemData.contactDate
                  );
                }
              },
              visibleMandatoryConf: {
                visible: true,
                required: true,
                originalName: 'contactDate'
              },
              maxDate: today,
              validators: {
                required: () => true,
                dateSameOrBefore: () => [
                  today
                ]
              },
              suffixIconButtons: data.createCopySuffixButtons('contactDate')
            }, {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: data.inputName('contactDateEstimated'),
              placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_ESTIMATED',
              description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_ESTIMATED_DESCRIPTION',
              value: {
                get: () => data.itemData.contactDateEstimated,
                set: (value) => {
                  // set data
                  data.itemData.contactDateEstimated = value;
                }
              },
              suffixIconButtons: data.createCopySuffixButtons('contactDateEstimated'),
              visibleMandatoryConf: {
                originalName: 'contactDateEstimated'
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: data.inputName('certaintyLevelId'),
              placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL',
              description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL_DESCRIPTION',
              options: data.options.certaintyLevel,
              value: {
                get: () => data.itemData.certaintyLevelId,
                set: (value) => {
                  data.itemData.certaintyLevelId = value;
                }
              },
              validators: {
                required: () => true
              },
              suffixIconButtons: data.createCopySuffixButtons('certaintyLevelId'),
              visibleMandatoryConf: {
                originalName: 'certaintyLevelId'
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: data.inputName('exposureTypeId'),
              placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE',
              description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE_DESCRIPTION',
              options: data.options.exposureType,
              value: {
                get: () => data.itemData.exposureTypeId,
                set: (value) => {
                  data.itemData.exposureTypeId = value;
                }
              },
              suffixIconButtons: data.createCopySuffixButtons('exposureTypeId'),
              visibleMandatoryConf: {
                originalName: 'exposureTypeId'
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: data.inputName('exposureFrequencyId'),
              placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY',
              description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY_DESCRIPTION',
              options: data.options.exposureFrequency,
              value: {
                get: () => data.itemData.exposureFrequencyId,
                set: (value) => {
                  data.itemData.exposureFrequencyId = value;
                }
              },
              suffixIconButtons: data.createCopySuffixButtons('exposureFrequencyId'),
              visibleMandatoryConf: {
                originalName: 'exposureFrequencyId'
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: data.inputName('exposureDurationId'),
              placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION',
              description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION_DESCRIPTION',
              options: data.options.exposureDuration,
              value: {
                get: () => data.itemData.exposureDurationId,
                set: (value) => {
                  data.itemData.exposureDurationId = value;
                }
              },
              suffixIconButtons: data.createCopySuffixButtons('exposureDurationId'),
              visibleMandatoryConf: {
                originalName: 'exposureDurationId'
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: data.inputName('socialRelationshipTypeId'),
              placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION',
              description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION_DESCRIPTION',
              options: data.options.contextOfTransmission,
              value: {
                get: () => data.itemData.socialRelationshipTypeId,
                set: (value) => {
                  data.itemData.socialRelationshipTypeId = value;
                }
              },
              suffixIconButtons: data.createCopySuffixButtons('socialRelationshipTypeId'),
              visibleMandatoryConf: {
                originalName: 'socialRelationshipTypeId'
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: data.inputName('clusterId'),
              placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER',
              description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER_DESCRIPTION',
              options: data.options.cluster,
              value: {
                get: () => data.itemData.clusterId,
                set: (value) => {
                  data.itemData.clusterId = value;
                }
              },
              suffixIconButtons: data.createCopySuffixButtons('clusterId'),
              visibleMandatoryConf: {
                originalName: 'clusterId'
              }
            }, {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: data.inputName('socialRelationshipDetail'),
              placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP',
              description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP_DESCRIPTION',
              value: {
                get: () => data.itemData.socialRelationshipDetail,
                set: (value) => {
                  data.itemData.socialRelationshipDetail = value;
                }
              },
              suffixIconButtons: data.createCopySuffixButtons('socialRelationshipDetail'),
              visibleMandatoryConf: {
                originalName: 'socialRelationshipDetail'
              }
            }, {
              type: CreateViewModifyV2TabInputType.TEXTAREA,
              name: data.inputName('comment'),
              placeholder: () => 'LNG_RELATIONSHIP_FIELD_LABEL_COMMENT',
              description: () => 'LNG_RELATIONSHIP_FIELD_LABEL_COMMENT_DESCRIPTION',
              value: {
                get: () => data.itemData.comment,
                set: (value) => {
                  data.itemData.comment = value;
                }
              },
              suffixIconButtons: data.createCopySuffixButtons('comment'),
              visibleMandatoryConf: {
                originalName: 'comment'
              }
            }]
          }
        ]
      },
      this.visibleMandatoryKey,
      useToFilterOutbreak
    );

    // finished
    return tab;
  }

  /**
   * Entity dialog
   */
  private showEntityDialog(
    selectedOutbreak: OutbreakModel,
    from: SentFromColumn,
    endpoint$: Observable<EntityModel[]>,
    entity: CaseModel | ContactModel | EventModel | ContactOfContactModel
  ): void  {
    this.parent.dialogV2Service
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
                this.parent.toastV2Service.error(err);

                // hide
                handler.hide();

                // send error down the road
                return throwError(err);
              })
            )
            .subscribe((data) => {
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
                  relationshipData.model.canView(this.parent.authUser) &&
                  !relationshipData.model.deleted
                }, {
                  type: V2SideDialogConfigInputType.DIVIDER
                });

                // attach entity fields information
                this.lightEntity(
                  selectedOutbreak,
                  relationshipData.model
                ).forEach((labelValue) => {
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
                  visible: () => RelationshipModel.canView(this.parent.authUser) &&
                    (
                      relationshipData.model.type !== EntityType.CONTACT_OF_CONTACT ||
                      selectedOutbreak?.isContactsOfContactsActive
                    ) &&
                    relationshipData.model.canView(this.parent.authUser) &&
                    !relationshipData.model.deleted
                }, {
                  type: V2SideDialogConfigInputType.DIVIDER
                });

                // attach entity fields information
                this.lightRelationship(
                  selectedOutbreak,
                  relationshipData.relationship
                ).forEach((labelValue) => {
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
      data = this.lightRelationship(
        selectedOutbreak,
        entity
      );
    } else {
      data = this.lightEntity(
        selectedOutbreak,
        entity
      );
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
    this.parent.dialogV2Service
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
    useToFilterOutbreak: OutbreakModel,
    entity: CaseModel | EventModel | ContactModel | ContactOfContactModel
  ): ILabelValuePairModel[] {
    // create list of fields to display
    const lightObject: ILabelValuePairModel[] = [];

    // determine entity type key
    let visibleMandatoryKey: string = this.parent.case.visibleMandatoryKey;
    switch (entity.type) {
      case EntityType.CONTACT:
        visibleMandatoryKey = this.parent.contact.visibleMandatoryKey;
        break;

      case EntityType.CONTACT_OF_CONTACT:
        visibleMandatoryKey = this.parent.contactOfContact.visibleMandatoryKey;
        break;

      case EntityType.EVENT:
        visibleMandatoryKey = this.parent.event.visibleMandatoryKey;
        break;
    }

    // case, contact and contact of contacts
    if (
      entity instanceof CaseModel ||
      entity instanceof ContactModel ||
      entity instanceof ContactOfContactModel
    ) {
      // first name
      if (this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
        useToFilterOutbreak,
        visibleMandatoryKey,
        'firstName'
      )) {
        lightObject.push({
          label: 'LNG_CASE_FIELD_LABEL_FIRST_NAME',
          value: entity.firstName
        });
      }

      // last name
      if (this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
        useToFilterOutbreak,
        visibleMandatoryKey,
        'lastName'
      )) {
        lightObject.push({
          label: 'LNG_CASE_FIELD_LABEL_LAST_NAME',
          value: entity.lastName
        });
      }

      // age
      if (this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
        useToFilterOutbreak,
        visibleMandatoryKey,
        'ageDob'
      )) {
        // display age. decide between years and months
        let ageUnit: string = this.parent.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS');
        let ageValue: number = _.get(entity, 'age.years', 0);
        const ageMonths = _.get(entity, 'age.months', 0);
        if (ageMonths > 0) {
          // show age in months
          ageUnit = this.parent.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS');
          ageValue = ageMonths;
        }

        // push age
        lightObject.push({
          label: 'LNG_CASE_FIELD_LABEL_AGE',
          value: `${ageValue} ${ageUnit}`
        });
      }

      // gender
      if (this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
        useToFilterOutbreak,
        visibleMandatoryKey,
        'gender'
      )) {
        lightObject.push({
          label: 'LNG_CASE_FIELD_LABEL_GENDER',
          value: entity.gender
        });
      }

      // occupation
      if (this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
        useToFilterOutbreak,
        visibleMandatoryKey,
        'occupation'
      )) {
        lightObject.push({
          label: 'LNG_CASE_FIELD_LABEL_OCCUPATION',
          value: entity.occupation
        });
      }

      // visualId
      if (this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
        useToFilterOutbreak,
        visibleMandatoryKey,
        'visualId'
      )) {
        lightObject.push({
          label: 'LNG_CASE_FIELD_LABEL_LAST_VISUAL_ID',
          value: entity.visualId
        });
      }

      // riskLevel
      if (this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
        useToFilterOutbreak,
        visibleMandatoryKey,
        'riskLevel'
      )) {
        lightObject.push({
          label: 'LNG_CASE_FIELD_LABEL_RISK_LEVEL',
          value: entity.riskLevel
        });
      }

      // riskReason
      if (this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
        useToFilterOutbreak,
        visibleMandatoryKey,
        'riskReason'
      )) {
        lightObject.push({
          label: 'LNG_CASE_FIELD_LABEL_RISK_REASON',
          value: entity.riskReason
        });
      }
    }

    // entity type = Case
    if (entity instanceof CaseModel) {
      // classification
      if (this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
        useToFilterOutbreak,
        visibleMandatoryKey,
        'classification'
      )) {
        lightObject.push({
          label: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION',
          value: entity.classification
        });
      }

      // dateOfOnset
      if (this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
        useToFilterOutbreak,
        visibleMandatoryKey,
        'dateOfOnset'
      )) {
        lightObject.push({
          label: 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET',
          value: entity.dateOfOnset ?
            LocalizationHelper.toMoment(entity.dateOfOnset).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
            ''
        });
      }

      // dateBecomeCase
      if (this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
        useToFilterOutbreak,
        visibleMandatoryKey,
        'dateBecomeCase'
      )) {
        lightObject.push({
          label: 'LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE',
          value: entity.dateBecomeCase ?
            LocalizationHelper.toMoment(entity.dateBecomeCase).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
            ''
        });
      }

      // dateOfInfection
      if (this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
        useToFilterOutbreak,
        visibleMandatoryKey,
        'dateOfInfection'
      )) {
        lightObject.push({
          label: 'LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION',
          value: entity.dateOfInfection ?
            LocalizationHelper.toMoment(entity.dateOfInfection).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
            ''
        });
      }

      // outcomeId
      if (this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
        useToFilterOutbreak,
        visibleMandatoryKey,
        'outcomeId'
      )) {
        lightObject.push({
          label: 'LNG_CASE_FIELD_LABEL_OUTCOME',
          value: entity.outcomeId
        });
      }
    }

    // case, contact and contact of contacts
    if (
      entity instanceof CaseModel ||
      entity instanceof ContactModel ||
      entity instanceof ContactOfContactModel
    ) {
      // dateOfReporting
      if (this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
        useToFilterOutbreak,
        visibleMandatoryKey,
        'dateOfReporting'
      )) {
        lightObject.push({
          label: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING',
          value: entity.dateOfReporting ?
            LocalizationHelper.toMoment(entity.dateOfReporting).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
            ''
        });
      }
    }

    // entity type = Event
    if (entity instanceof EventModel) {
      // name
      if (this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
        useToFilterOutbreak,
        visibleMandatoryKey,
        'name'
      )) {
        lightObject.push({
          label: 'LNG_EVENT_FIELD_LABEL_NAME',
          value: entity.name
        });
      }

      // visualId
      if (this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
        useToFilterOutbreak,
        visibleMandatoryKey,
        'visualId'
      )) {
        lightObject.push({
          label: 'LNG_EVENT_FIELD_LABEL_VISUAL_ID',
          value: entity.visualId
        });
      }

      // date
      if (this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
        useToFilterOutbreak,
        visibleMandatoryKey,
        'date'
      )) {
        lightObject.push({
          label: 'LNG_EVENT_FIELD_LABEL_DATE',
          value: entity.date ?
            LocalizationHelper.toMoment(entity.date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
            ''
        });
      }

      // description
      if (this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
        useToFilterOutbreak,
        visibleMandatoryKey,
        'description'
      )) {
        lightObject.push({
          label: 'LNG_EVENT_FIELD_LABEL_DESCRIPTION',
          value: entity.description
        });
      }

      // dateOfReporting
      if (this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
        useToFilterOutbreak,
        visibleMandatoryKey,
        'dateOfReporting'
      )) {
        lightObject.push({
          label: 'LNG_EVENT_FIELD_LABEL_DATE_OF_REPORTING',
          value: entity.dateOfReporting ?
            LocalizationHelper.toMoment(entity.dateOfReporting).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
            ''
        });
      }
    }

    // finished
    return lightObject;
  }

  /**
   * Get light relationship
   */
  lightRelationship(
    useToFilterOutbreak: OutbreakModel,
    relationship: RelationshipModel
  ): ILabelValuePairModel[] {
    // determine source and target
    const sourcePerson = _.find(relationship.persons, (person) => person.source === true);
    const sourcePeople = _.find(relationship.people, (people) => people.model.id === sourcePerson.id);
    const destinationPeople = _.find(relationship.people, (people) => people.model.id !== sourcePerson.id);

    // create list of fields to display
    const lightObject: ILabelValuePairModel[] = [{
      label: 'LNG_RELATIONSHIP_FIELD_LABEL_SOURCE',
      value: sourcePeople.model.name
    }, {
      label: 'LNG_RELATIONSHIP_FIELD_LABEL_TARGET',
      value: destinationPeople.model.name
    }];

    // contactDate
    if (this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
      useToFilterOutbreak,
      this.visibleMandatoryKey,
      'contactDate'
    )) {
      lightObject.push({
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE',
        value: relationship.contactDate ?
          LocalizationHelper.toMoment(relationship.contactDate).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
          ''
      });
    }

    // certaintyLevelId
    if (this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
      useToFilterOutbreak,
      this.visibleMandatoryKey,
      'certaintyLevelId'
    )) {
      lightObject.push({
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL',
        value: relationship.certaintyLevelId
      });
    }

    // exposureTypeId
    if (this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
      useToFilterOutbreak,
      this.visibleMandatoryKey,
      'exposureTypeId'
    )) {
      lightObject.push({
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE',
        value: relationship.exposureTypeId
      });
    }

    // exposureFrequencyId
    if (this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
      useToFilterOutbreak,
      this.visibleMandatoryKey,
      'exposureFrequencyId'
    )) {
      lightObject.push({
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY',
        value: relationship.exposureFrequencyId
      });
    }

    // exposureDurationId
    if (this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
      useToFilterOutbreak,
      this.visibleMandatoryKey,
      'exposureDurationId'
    )) {
      lightObject.push({
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION',
        value: relationship.exposureDurationId
      });
    }

    // socialRelationshipTypeId
    if (this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
      useToFilterOutbreak,
      this.visibleMandatoryKey,
      'socialRelationshipTypeId'
    )) {
      lightObject.push({
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION',
        value: relationship.socialRelationshipTypeId
      });
    }

    // socialRelationshipDetail
    if (this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
      useToFilterOutbreak,
      this.visibleMandatoryKey,
      'socialRelationshipDetail'
    )) {
      lightObject.push({
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP',
        value: relationship.socialRelationshipDetail
      });
    }

    // comment
    if (this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
      useToFilterOutbreak,
      this.visibleMandatoryKey,
      'comment'
    )) {
      lightObject.push({
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_COMMENT',
        value: relationship.comment
      });
    }

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
              RelationshipModel.canView(this.parent.authUser) &&
              this.entityMap[definitions.entity.type].can[definitions.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures'].view(this.parent.authUser);
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
              RelationshipModel.canModify(this.parent.authUser) &&
              this.entityMap[definitions.entity.type].can[definitions.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures'].modify(this.parent.authUser);
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
                  this.parent.dialogV2Service.showConfirmDialog({
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
                    const loading = this.parent.dialogV2Service.showLoadingDialog();

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
                          this.parent.toastV2Service.error(err);

                          // hide loading
                          loading.close();

                          // send error down the road
                          return throwError(err);
                        })
                      )
                      .subscribe(() => {
                        // success
                        this.parent.toastV2Service.success('LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_ACTION_DELETE_RELATIONSHIP_SUCCESS_MESSAGE');

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
                  CaseModel.canDelete(this.parent.authUser);
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
  retrieveTableColumns(
    useToFilterOutbreak: OutbreakModel,
    definitions: {
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
    }
  ): IV2Column[] {
    // default table columns
    const tableColumns: IV2ColumnToVisibleMandatoryConf[] = [
      {
        field: 'lastName',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_PERSON_LAST_NAME',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.parent.case.visibleMandatoryKey,
          'lastName'
        ) || this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.parent.contact.visibleMandatoryKey,
          'lastName'
        ) || this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.parent.contactOfContact.visibleMandatoryKey,
          'lastName'
        ),
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
          return data.model && data.model.canView(this.parent.authUser) && !data.model.deleted ?
            `${this.entityMap[data.model.type].link}/${data.model.id}/view` :
            undefined;
        }
      },
      {
        field: 'firstName',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_PERSON_FIRST_NAME',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.parent.case.visibleMandatoryKey,
          'firstName'
        ) || this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.parent.contact.visibleMandatoryKey,
          'firstName'
        ) || this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.parent.contactOfContact.visibleMandatoryKey,
          'firstName'
        ),
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
          return data.model && data.model.canView(this.parent.authUser) && !data.model.deleted ?
            `${this.entityMap[data.model.type].link}/${data.model.id}/view` :
            undefined;
        }
      },
      {
        field: 'visualId',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_PERSON_VISUAL_ID',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.parent.case.visibleMandatoryKey,
          'visualId'
        ) || this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.parent.contact.visibleMandatoryKey,
          'visualId'
        ) || this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.parent.contactOfContact.visibleMandatoryKey,
          'visualId'
        ) || this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.parent.event.visibleMandatoryKey,
          'visualId'
        ),
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
          return data.model && data.model.canView(this.parent.authUser) && !data.model.deleted ?
            `${this.entityMap[data.model.type].link}/${data.model.id}/view` :
            undefined;
        }
      },
      {
        field: 'statuses',
        label: 'LNG_COMMON_LABEL_STATUSES',
        visibleMandatoryIf: () => true,
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
                label: item.id,
                order: item.order
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
              tooltip: this.parent.i18nService.instant(data.type)
            });
          } else {
            forms.push({
              type: IV2ColumnStatusFormType.EMPTY
            });
          }

          // finished
          return forms;
        }
      },
      {
        field: 'contactDate',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.visibleMandatoryKey,
          'contactDate'
        ),
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
        field: 'dateOfFirstContact',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_DATE_OF_FIRST_CONTACT',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.visibleMandatoryKey,
          'dateOfFirstContact'
        ),
        format: {
          type: V2ColumnFormat.DATE,
          value: (item) => item.relationship?.dateOfFirstContact
        },
        filter: {
          type: V2FilterType.DATE_RANGE,
          childQueryBuilderKey: 'relationship'
        }
      },
      {
        field: 'contactDateEstimated',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_ESTIMATED',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.visibleMandatoryKey,
          'contactDateEstimated'
        ),
        notVisible: true,
        format: {
          type: V2ColumnFormat.BOOLEAN,
          value: (item) => item.relationship?.contactDateEstimated
        },
        filter: {
          type: V2FilterType.BOOLEAN,
          value: '',
          defaultValue: '',
          childQueryBuilderKey: 'relationship'
        }
      },
      {
        field: 'certaintyLevelId',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.visibleMandatoryKey,
          'certaintyLevelId'
        ),
        format: {
          type: (item) => item.relationship?.certaintyLevelId ?
            this.parent.i18nService.instant(item.relationship?.certaintyLevelId) :
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
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.visibleMandatoryKey,
          'exposureTypeId'
        ),
        format: {
          type: (item) => item.relationship?.exposureTypeId ?
            this.parent.i18nService.instant(item.relationship?.exposureTypeId) :
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
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.visibleMandatoryKey,
          'exposureFrequencyId'
        ),
        format: {
          type: (item) => item.relationship?.exposureFrequencyId ?
            this.parent.i18nService.instant(item.relationship?.exposureFrequencyId) :
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
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.visibleMandatoryKey,
          'exposureDurationId'
        ),
        format: {
          type: (item) => item.relationship?.exposureDurationId ?
            this.parent.i18nService.instant(item.relationship?.exposureDurationId) :
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
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.visibleMandatoryKey,
          'socialRelationshipTypeId'
        ),
        format: {
          type: (item) => item.relationship?.socialRelationshipTypeId ?
            this.parent.i18nService.instant(item.relationship?.socialRelationshipTypeId) :
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
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.visibleMandatoryKey,
          'socialRelationshipDetail'
        ),
        format: {
          type: 'relationship.socialRelationshipDetail'
        },
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH,
          childQueryBuilderKey: 'relationship'
        }
      },
      {
        field: 'comment',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_COMMENT',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.visibleMandatoryKey,
          'comment'
        ),
        notVisible: true,
        format: {
          type: 'relationship.comment'
        },
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH,
          childQueryBuilderKey: 'relationship'
        }
      }
    ];

    // by cluster
    if (ClusterModel.canList(this.parent.authUser)) {
      tableColumns.push({
        field: 'clusterId',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.visibleMandatoryKey,
          'clusterId'
        ),
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
        visibleMandatoryIf: () => true,
        format: {
          type: 'relationship.createdByUser.nameAndEmail'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: definitions.options.user,
          includeNoValue: true,
          childQueryBuilderKey: 'relationship'
        },
        exclude: (): boolean => {
          return !UserModel.canView(this.parent.authUser);
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
        visibleMandatoryIf: () => true,
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
        visibleMandatoryIf: () => true,
        format: {
          type: 'relationship.updatedByUser.nameAndEmail'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: definitions.options.user,
          includeNoValue: true,
          childQueryBuilderKey: 'relationship'
        },
        exclude: (): boolean => {
          return !UserModel.canView(this.parent.authUser);
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
        visibleMandatoryIf: () => true,
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
    return this.parent.list.filterVisibleMandatoryTableColumns(tableColumns);
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
        this.parent.toastV2Service.error(err);
        return throwError(err);
      })
    );
  }

  /**
   * Advanced filters
   */
  generateAdvancedFilters(
    useToFilterOutbreak: OutbreakModel,
    data: {
      options: {
        certaintyLevel: ILabelValuePairModel[],
        exposureType: ILabelValuePairModel[],
        exposureFrequency: ILabelValuePairModel[],
        exposureDuration: ILabelValuePairModel[],
        contextOfTransmission: ILabelValuePairModel[],
        cluster: ILabelValuePairModel[],
        yesNo: ILabelValuePairModel[]
      }
    }
  ): V2AdvancedFilter[] {
    // initialize
    const advancedFilters: V2AdvancedFilterToVisibleMandatoryConf[] = [
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'lastName',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_PERSON_LAST_NAME',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.parent.case.visibleMandatoryKey,
          'lastName'
        ) || this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.parent.contact.visibleMandatoryKey,
          'lastName'
        ) || this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.parent.contactOfContact.visibleMandatoryKey,
          'lastName'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'firstName',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_PERSON_FIRST_NAME',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.parent.case.visibleMandatoryKey,
          'firstName'
        ) || this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.parent.contact.visibleMandatoryKey,
          'firstName'
        ) || this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.parent.contactOfContact.visibleMandatoryKey,
          'firstName'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'visualId',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_PERSON_VISUAL_ID',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.parent.case.visibleMandatoryKey,
          'visualId'
        ) || this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.parent.contact.visibleMandatoryKey,
          'visualId'
        ) || this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.parent.contactOfContact.visibleMandatoryKey,
          'visualId'
        ) || this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.parent.event.visibleMandatoryKey,
          'visualId'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'contactDate',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.visibleMandatoryKey,
          'contactDate'
        ),
        childQueryBuilderKey: 'relationship'
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfFirstContact',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_DATE_OF_FIRST_CONTACT',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.visibleMandatoryKey,
          'dateOfFirstContact'
        ),
        childQueryBuilderKey: 'relationship'
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'contactDateEstimated',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_ESTIMATED',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.visibleMandatoryKey,
          'contactDateEstimated'
        ),
        options: data.options.yesNo,
        childQueryBuilderKey: 'relationship'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'certaintyLevelId',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.visibleMandatoryKey,
          'certaintyLevelId'
        ),
        options: data.options.certaintyLevel,
        childQueryBuilderKey: 'relationship'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'exposureTypeId',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.visibleMandatoryKey,
          'exposureTypeId'
        ),
        options: data.options.exposureType,
        childQueryBuilderKey: 'relationship'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'exposureFrequencyId',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.visibleMandatoryKey,
          'exposureFrequencyId'
        ),
        options: data.options.exposureFrequency,
        childQueryBuilderKey: 'relationship'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'exposureDurationId',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.visibleMandatoryKey,
          'exposureDurationId'
        ),
        options: data.options.exposureDuration,
        childQueryBuilderKey: 'relationship'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'socialRelationshipTypeId',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.visibleMandatoryKey,
          'socialRelationshipTypeId'
        ),
        options: data.options.contextOfTransmission,
        childQueryBuilderKey: 'relationship'
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'socialRelationshipDetail',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION_DETAIL',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.visibleMandatoryKey,
          'socialRelationshipDetail'
        ),
        childQueryBuilderKey: 'relationship'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'clusterId',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.visibleMandatoryKey,
          'clusterId'
        ),
        options: data.options.cluster,
        childQueryBuilderKey: 'relationship'
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'comment',
        label: 'LNG_RELATIONSHIP_FIELD_LABEL_COMMENT',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          useToFilterOutbreak,
          this.visibleMandatoryKey,
          'comment'
        ),
        childQueryBuilderKey: 'relationship'
      }
    ];

    // finished
    return this.parent.list.filterVisibleMandatoryAdvancedFilters(advancedFilters);
  }
}
