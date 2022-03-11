import { Injectable } from '@angular/core';
import { CaseModel } from '../../models/case.model';
import { ContactModel } from '../../models/contact.model';
import { EventModel } from '../../models/event.model';
import { EntityModel, RelationshipModel } from '../../models/entity-and-relationship.model';
import { throwError } from 'rxjs/index';
import { catchError } from 'rxjs/internal/operators';
import { ContactOfContactModel } from '../../models/contact-of-contact.model';
import { Observable } from 'rxjs';
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

/**
 * From ?
 */
enum SentFromColumn {
  CONTACTS = 'fromContacts',
  EXPOSURES = 'fromExposures'
}

@Injectable()
export class EntityHelperService {
  /**
   * Constructor
   */
  constructor(
    private dialogV2Service: DialogV2Service,
    private relationshipDataService: RelationshipDataService,
    private i18nService: I18nService
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
                // this.snackbarService.showApiError(err);

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
                placeholder: 'LNG_PAGE_LIST_CASES_DIALOG_ENTITY_SECTION_TITLE',
                panels: []
              };
              const relationshipList: IV2SideDialogConfigInputAccordion = {
                type: V2SideDialogConfigInputType.ACCORDION,
                placeholder: 'LNG_PAGE_LIST_CASES_DIALOG_ENTITY_RELATIONSHIPS_TITLE',
                panels: []
              };

              // add entities and relationships
              data.forEach((relationshipData) => {
                // define entity panel inputs
                const entityInputs: V2SideDialogConfigInput[] = [];
                const relationshipsInputs: V2SideDialogConfigInput[] = [];

                // attach entity fields information
                this.lightEntity(relationshipData.model)
                  .forEach((labelValue) => {
                    entityInputs.push({
                      type: V2SideDialogConfigInputType.KEY_VALUE,
                      placeholder: labelValue.label,
                      value: labelValue.value
                    });
                  });

                // View full resource link
                entityInputs.push({
                  type: V2SideDialogConfigInputType.LINK,
                  placeholder: 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ACTION_VIEW_FULL_RESOURCE',
                  link: () => [
                    EntityModel.getLinkForEntityType(relationshipData.model.type),
                    relationshipData.model.id,
                    'view'
                  ],
                  visible: () => relationshipData.model.type !== EntityType.CONTACT_OF_CONTACT || selectedOutbreak?.isContactsOfContactsActive
                });

                // add entities to the list
                entitiesList.panels.push({
                  type: V2SideDialogConfigInputType.ACCORDION_PANEL,
                  placeholder: relationshipData.model.name,
                  inputs: entityInputs
                });

                // add related entities into relationship people to display relationship dialog
                relationshipData.relationship.people = [
                  new EntityModel(entity),
                  new EntityModel(relationshipData.model)
                ];

                // attach entity fields information
                this.lightRelationship(relationshipData.relationship)
                  .forEach((labelValue) => {
                    relationshipsInputs.push({
                      type: V2SideDialogConfigInputType.KEY_VALUE,
                      placeholder: labelValue.label,
                      value: labelValue.value
                    });
                  });

                // View full resource link
                const sourcePerson = relationshipData.relationship.sourcePerson;
                relationshipsInputs.push({
                  type: V2SideDialogConfigInputType.LINK,
                  placeholder: 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ACTION_VIEW_FULL_RESOURCE',
                  link: () => [
                    `/relationships/${sourcePerson.type}/${sourcePerson.id}/contacts/${relationshipData.relationship.id}/view`
                  ]
                });

                // add relationships to the list
                relationshipList.panels.push({
                  type: V2SideDialogConfigInputType.ACCORDION_PANEL,
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
   * Get light entity
   */
  private lightEntity(
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
  private lightRelationship(
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







  // /**
  //  * Display dialog with entities and related relationships
  //  */
  // displayEntitiesAndRelationships(
  //   from: SentFromColumn,
  //   entity: CaseModel | ContactModel | EventModel | ContactOfContactModel,
  //   relationshipsData: EntityModel[]
  // ) {
  //   if (!_.isEmpty(relationshipsData)) {
  //     // split relationships data into entities and relationships
  //     // entities collection
  //     const entities: DialogField[] = [];
  //
  //     // add links to list relationship page only if we're allowed to view that page
  //     const authUser: UserModel = this.authDataService.getAuthenticatedUser();
  //     if (
  //       RelationshipModel.canList(authUser) && (
  //         from === SentFromColumn.CONTACTS ?
  //           entity.canListRelationshipContacts(authUser) :
  //           entity.canListRelationshipExposures(authUser)
  //       )
  //     ) {
  //       entities.push(
  //         // add link to full resource
  //         new DialogField({
  //           name: 'link',
  //           fieldType: DialogFieldType.LINK,
  //           routerLink: [
  //             from === SentFromColumn.CONTACTS ?
  //               `/relationships/${entity.type}/${entity.id}/contacts` :
  //               `/relationships/${entity.type}/${entity.id}/exposures`
  //           ],
  //           placeholder: from === SentFromColumn.CONTACTS ?
  //             'LNG_DIALOG_GENERAL_DIALOG_LINK_FULL_LIST_CONTACTS' :
  //             'LNG_DIALOG_GENERAL_DIALOG_LINK_FULL_LIST_EXPOSURES',
  //           linkTarget: '_blank'
  //         }),
  //
  //         // add section title for entities
  //         new DialogField({
  //           name: '_',
  //           fieldType: DialogFieldType.SECTION_TITLE,
  //           placeholder: 'LNG_PAGE_LIST_CASES_DIALOG_ENTITY_SECTION_TITLE'
  //         })
  //       );
  //     }
  //
  //     // relationships collection
  //     const relationships: DialogField[] = [
  //       // add section title for relationships
  //       new DialogField({
  //         name: '_',
  //         fieldType: DialogFieldType.SECTION_TITLE,
  //         placeholder: 'LNG_PAGE_LIST_CASES_DIALOG_ENTITY_RELATIONSHIPS_TITLE'
  //       })
  //     ];
  //
  //     // add entities and relationships
  //     relationshipsData.forEach((relationshipData) => {
  //       // add entities to the list
  //       entities.push(new DialogField({
  //         name: '_',
  //         fieldType: DialogFieldType.ACTION,
  //         placeholder: relationshipData.model.name,
  //         actionData: relationshipData.model,
  //         actionCallback: relationshipData.model.canView(authUser) ? ((item) => {
  //           // show entity information
  //           this.dialogService.showCustomDialog(
  //             ViewCotNodeDialogComponent,
  //             {
  //               ...ViewCotNodeDialogComponent.DEFAULT_CONFIG,
  //               ...{
  //                 data: {
  //                   entity: item
  //                 }
  //               }
  //             }
  //           );
  //         }) : null
  //       }));
  //
  //       // construct relationship label for dialog
  //       let relationshipLabel: string = '';
  //       switch (from) {
  //         case SentFromColumn.CONTACTS:
  //           relationshipLabel = `${entity.name} - ${relationshipData.model.name}`;
  //           break;
  //         case SentFromColumn.EXPOSURES:
  //           relationshipLabel = `${entity.name} - ${relationshipData.model.name}`;
  //           break;
  //       }
  //
  //       // add related entities into relationship people to display relationship dialog
  //       relationshipData.relationship.people = [
  //         new EntityModel(entity),
  //         new EntityModel(relationshipData.model)
  //       ];
  //
  //       // add relationships to the list
  //       relationships.push(new DialogField({
  //         name: '_',
  //         fieldType: DialogFieldType.ACTION,
  //         placeholder: relationshipLabel,
  //         actionData: relationshipData.relationship,
  //         actionCallback: relationshipData.relationship.canView(authUser) ? ((item) => {
  //           // show entity information
  //           this.dialogService.showCustomDialog(
  //             ViewCotEdgeDialogComponent,
  //             {
  //               ...ViewCotEdgeDialogComponent.DEFAULT_CONFIG,
  //               ...{
  //                 data: {
  //                   relationship: item,
  //                   showResourceViewPageLink:
  //                     from === SentFromColumn.EXPOSURES ?
  //                       relationshipData.model.canViewRelationshipExposures(authUser) :
  //                       relationshipData.model.canViewRelationshipContacts(authUser)
  //                 }
  //               }
  //             }
  //           );
  //         }) : null
  //       }));
  //     });
  //
  //     // display dialog to choose item from list
  //     this.dialogService
  //       .showInput(new DialogConfiguration({
  //         message: from === 'fromContacts' ?
  //           'LNG_DIALOG_GENERAL_DIALOG_TITLE_GROUP_CONTACTS_DIALOG_TITLE' :
  //           'LNG_DIALOG_GENERAL_DIALOG_TITLE_GROUP_EXPOSURES_DIALOG_TITLE',
  //         buttons: [
  //           new DialogButton({
  //             label: 'LNG_COMMON_BUTTON_CLOSE',
  //             clickCallback: (dialogHandler: MatDialogRef<DialogComponent>) => {
  //               dialogHandler.close();
  //             }
  //           })
  //         ],
  //         fieldsList: [
  //           ...entities,
  //           ...relationships
  //         ]
  //       }))
  //       .subscribe();
  //   }
  // }
}
