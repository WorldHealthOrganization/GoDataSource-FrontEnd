import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Constants } from '../../../../core/models/constants';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ActivatedRoute } from '@angular/router';
import { EntityType } from '../../../../core/models/entity-type';
import { GraphNodeModel } from '../../../../core/models/graph-node.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { NgForm } from '@angular/forms';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { SelectedNodes } from '../../classes/selected-nodes';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { GraphEdgeModel } from '../../../../core/models/graph-edge.model';
import * as _ from 'lodash';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { Subscription } from 'rxjs/internal/Subscription';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { ContactsOfContactsDataService } from '../../../../core/services/data/contacts-of-contacts.data.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { EntityHelperService } from '../../../../core/services/helper/entity-helper.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { TransmissionChainsDashletComponent } from '../../components/transmission-chains-dashlet/transmission-chains-dashlet.component';
import { DomService } from '../../../../core/services/helper/dom.service';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';

enum NodeAction {
  MODIFY_PERSON = 'modify-person',
  CREATE_CONTACT = 'create-contact',
  CREATE_CONTACT_OF_CONTACT = 'create-contact-of-contact',
  MODIFY_EDGE = 'modify-edge'
}

@Component({
  selector: 'app-transmission-chains-graph',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './transmission-chains-graph.component.html',
  styleUrls: ['./transmission-chains-graph.component.scss']
})
export class TransmissionChainsGraphComponent implements OnInit, OnDestroy {
  @ViewChild('cotDashletChild', { static: false }) cotDashletChild: TransmissionChainsDashletComponent;

  outbreakSubscriber: Subscription;

  // authenticated user
  authUser: UserModel;
  // selected outbreak
  selectedOutbreak: OutbreakModel;
  // filter used for size of chains
  sizeOfChainsFilter: string | number = null;
  // person Id - to filter the chain
  personId: string = null;
  // snapshot Id, showPersonContacts, showPersonContactsOfContacts - to filter the chains
  snapshotId: string = null;
  showPersonContacts: boolean = false;
  showPersonContactsOfContacts: boolean = false;
  // type of the selected person . event
  selectedEntityType: EntityType = null;
  // should we display personal chain of transmission link?
  displayPersonChainOfTransmissionLink: boolean = false;

  // nodes selected from graph
  selectedNodes: SelectedNodes = new SelectedNodes();
  // selected relationship
  selectedRelationship: RelationshipModel;
  // action to do on the selected node
  currentNodeAction: NodeAction = null;
  // can we swap relationship persons?
  canSwapRelationshipPersons: boolean;

  // Edit or View mode?
  editMode: boolean = false;
  // new relationship model
  newRelationship = new RelationshipModel();
  // new contact model
  newContact = new ContactModel();

  // provide constants to template
  Constants = Constants;
  EntityType = EntityType;
  NodeAction = NodeAction;

  /**
   * Constructor
   */
  constructor(
    private authDataService: AuthDataService,
    protected toastV2Service: ToastV2Service,
    protected route: ActivatedRoute,
    private entityDataService: EntityDataService,
    private outbreakDataService: OutbreakDataService,
    private formHelper: FormHelperService,
    private relationshipDataService: RelationshipDataService,
    private contactDataService: ContactDataService,
    private contactsOfContactsDataService: ContactsOfContactsDataService,
    private dialogV2Service: DialogV2Service,
    private entityHelperService: EntityHelperService,
    private i18nService: I18nService,
    private domService: DomService
  ) {}

  /**
     * Component initialized
     */
  ngOnInit() {
    // authenticated user
    this.authUser = this.authDataService.getAuthenticatedUser();

    this.route.queryParams
      .subscribe((params: {
        personId: string,
        selectedEntityType: EntityType,
        sizeOfChainsFilter: number,
        snapshotId?: string,
        showPersonContacts?: boolean,
        showPersonContactsOfContacts?: boolean
      }) => {
        // check if person id was sent in url
        if (params.personId && params.selectedEntityType) {
          this.personId = params.personId;
          this.selectedEntityType = params.selectedEntityType;
        }

        // check if the snapshotId was sent in url
        if (!!params.snapshotId) {
          this.snapshotId = params.snapshotId;
        }

        // check if the showContacts was sent in url
        if (!!params.showPersonContacts) {
          this.showPersonContacts = params.showPersonContacts;
        }

        // check if the showContactsOfContacts was sent in url
        if (!!params.showPersonContactsOfContacts) {
          this.showPersonContactsOfContacts = params.showPersonContactsOfContacts;
        }

        // check if the size of chains was sent in url
        if (params.sizeOfChainsFilter) {
          this.sizeOfChainsFilter = params.sizeOfChainsFilter;
        }
      });

    // subscribe to the Selected Outbreak Subject stream
    this.outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        this.selectedOutbreak = selectedOutbreak;
      });
  }

  /**
     * Component destroyed
     */
  ngOnDestroy() {
    // outbreak subscriber
    if (this.outbreakSubscriber) {
      this.outbreakSubscriber.unsubscribe();
      this.outbreakSubscriber = null;
    }
  }

  /**
     * Switch between View and Edit mode (when clicking nodes)
     * @param editMode
     */
  onEditModeChange(editMode: boolean) {
    this.editMode = editMode;

    if (!editMode) {
      // reset selected nodes
      this.resetNodes();
    }
  }

  /**
   * Node tap / click
   */
  onNodeTap(entity: GraphNodeModel) {
    // not really of expected format ?
    if (
      !entity ||
      !entity.type
    ) {
      return;
    }

    // retrieve entity info
    const loadingDialog = this.dialogV2Service.showLoadingDialog();
    this.entityDataService
      .getEntity(entity.type, this.selectedOutbreak.id, entity.id)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          loadingDialog.close();
          return throwError(err);
        })
      )
      .subscribe((entityData: CaseModel | EventModel | ContactModel | ContactOfContactModel) => {
        if (entityData.type !== EntityType.CONTACT_OF_CONTACT) {
          this.entityDataService
            .checkEntityRelationshipsCount(
              this.selectedOutbreak.id,
              entityData.type,
              entityData.id
            )
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err);
                loadingDialog.close();
                return throwError(err);
              })
            )
            .subscribe((relationshipCount: { count: number }) => {
              // set the flag for displaying personal chain of transmission link
              this.displayPersonChainOfTransmissionLink = relationshipCount.count > 0;

              // hide loading dialog
              loadingDialog.close();

              if (this.editMode) {
                this.selectedRelationship = undefined;
                // add node to selected persons list
                this.selectedNodes.addNode(entityData);

                // check if we can swap nodes
                this.canSwapRelationshipPersons = this.canSwapSelectedNodes();

                // focus boxes
                setTimeout(() => {
                  this.domService.scrollItemIntoView(
                    '.transmission-chain-edit-mode'
                  );
                });
              } else {
                // show node information
                this.entityHelperService.showEntityDetailsDialog(
                  this.i18nService.instant(
                    'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_NODE_TITLE',
                    {
                      type: this.i18nService.instant(entityData.type)
                    }
                  ),
                  entityData,
                  this.selectedOutbreak, {
                    displayPersonalCotLink: this.displayPersonChainOfTransmissionLink,
                    snapshotId: this.cotDashletChild.selectedSnapshot,
                    showPersonContacts: this.cotDashletChild.showContacts,
                    showPersonContactsOfContacts: this.cotDashletChild.showContactsOfContacts
                  }
                );
              }
            });
        } else {
          // hide loading dialog
          loadingDialog.close();

          // reset relationship swap persons
          this.canSwapRelationshipPersons = false;

          if (this.editMode) {
            this.selectedRelationship = undefined;
            // add node to selected persons list
            this.selectedNodes.addNode(entityData);

            // focus boxes
            setTimeout(() => {
              this.domService.scrollItemIntoView(
                '.transmission-chain-edit-mode'
              );
            });
          } else {
            // show node information
            this.entityHelperService.showEntityDetailsDialog(
              this.i18nService.instant(
                'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_NODE_TITLE',
                {
                  type: this.i18nService.instant(entityData.type)
                }
              ),
              entityData,
              this.selectedOutbreak
            );
          }
        }
      });
  }

  /**
   * Edge tap / click
   */
  onEdgeTap(relationship: GraphEdgeModel) {
    // retrieve relationship info
    const loadingDialog = this.dialogV2Service.showLoadingDialog();
    this.relationshipDataService
      .getEntityRelationship(
        this.selectedOutbreak.id,
        relationship.sourceType,
        relationship.source,
        relationship.id)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          loadingDialog.close();
          return throwError(err);
        })
      )
      .subscribe((relationshipData) => {
        // hide loading dialog
        loadingDialog.close();

        if (this.editMode) {
          this.resetNodes();

          this.selectedRelationship = relationshipData;

          // focus box
          setTimeout(() => {
            this.domService.scrollItemIntoView(
              '.selected-relationship-details'
            );
          });
        } else {
          // show edge information
          this.entityHelperService.showEntityDetailsDialog(
            this.i18nService.instant('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_EDGE_TITLE'),
            relationshipData,
            this.selectedOutbreak, {
              showResourceViewPageLink: true
            }
          );
        }
      });
  }

  removeSelectedNode(index) {
    this.selectedNodes.removeNodeAtIndex(index);
  }

  removeRelationship() {
    this.selectedRelationship = undefined;
  }

  swapSelectedNodes() {
    this.selectedNodes.swapNodes();
  }

  resetNodes() {
    this.selectedNodes = new SelectedNodes();
  }

  modifySelectedPerson(person: (CaseModel | ContactModel | EventModel)) {
    // remove other selected node(s) (if any)
    this.selectedNodes.keepNode(person);

    this.resetFormModels();

    this.currentNodeAction = NodeAction.MODIFY_PERSON;
  }

  modifySelectedRelationship() {
    this.currentNodeAction = NodeAction.MODIFY_EDGE;
  }

  createContactForSelectedPerson(person: (CaseModel | ContactModel | EventModel)) {
    // remove other selected node(s) (if any)
    this.selectedNodes.keepNode(person);

    this.resetFormModels();

    this.currentNodeAction = NodeAction.CREATE_CONTACT;
  }

  createContactOfContactForSelectedPerson(person: ContactModel) {
    // remove other selected node(s) (if any)
    this.selectedNodes.keepNode(person);

    this.resetFormModels();

    this.currentNodeAction = NodeAction.CREATE_CONTACT_OF_CONTACT;
  }

  /**
     * Check if we can we swap selected nodes
     */
  canSwapSelectedNodes() {
    return this.selectedNodes.nodes.length > 1 && (
      this.selectedNodes.targetNode.type !== EntityType.CONTACT &&
            this.selectedNodes.targetNode.type !== EntityType.CONTACT_OF_CONTACT
    );
  }

  /**
   * Delete selected person
   */
  deleteSelectedPerson(person: (CaseModel | ContactModel | EventModel)) {
    this.dialogV2Service
      .showConfirmDialog({
        config: {
          title: {
            get: () => 'LNG_COMMON_LABEL_ATTENTION_REQUIRED'
          },
          message: {
            get: () => 'LNG_DIALOG_CONFIRM_DELETE_CASE',
            data: () => ({
              name: person.name
            })
          }
        }
      })
      .subscribe((response) => {
        // canceled ?
        if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
          // finished
          return;
        }

        // delete person
        const loadingDialog = this.dialogV2Service.showLoadingDialog();
        this.entityDataService
          .deleteEntity(
            person.type,
            this.selectedOutbreak.id,
            person.id
          )
          .pipe(
            catchError((err) => {
              this.toastV2Service.error(err);
              loadingDialog.close();
              return throwError(err);
            })
          )
          .subscribe(() => {
            this.toastV2Service.success('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ACTION_DELETE_PERSON_SUCCESS_MESSAGE');
            loadingDialog.close();

            // reset form
            this.resetFormModels();

            // reset selected nodes
            this.resetNodes();
          });
      });
  }

  resetFormModels() {
    // reset Contact model
    this.newContact = new ContactModel();

    // reset Relationship model
    this.newRelationship = new RelationshipModel();
  }

  /**
     * Create a new Relationship between 2 selected nodes
     * @param form
     */
  createRelationship(form: NgForm) {
    // get forms fields
    const fields = this.formHelper.getFields(form);

    if (!this.formHelper.validateForm(form)) {
      return;
    }

    // get source and target persons
    const sourcePerson = this.selectedNodes.sourceNode;
    const targetPerson = this.selectedNodes.targetNode;

    // prepare relationship data
    const relationshipData = fields.relationship;
    relationshipData.persons = [{
      id: targetPerson.id
    }];

    this.relationshipDataService
      .createRelationship(
        this.selectedOutbreak.id,
        sourcePerson.type,
        sourcePerson.id,
        relationshipData
      )
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        })
      )
      .subscribe(() => {
        this.toastV2Service.success('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ACTION_CREATE_RELATIONSHIP_SUCCESS_MESSAGE');

        // reset form
        this.resetFormModels();

        // reset selected nodes
        this.resetNodes();

        // reset node action
        this.currentNodeAction = null;
      });
  }

  /**
     * Create a new Contact for a selected node (Case or Event)
     * @param form
     * @param entityType
     */
  createContact(form: NgForm) {
    // get forms fields
    const fields = this.formHelper.getFields(form);

    if (!this.formHelper.validateForm(form)) {
      return;
    }

    // contact fields
    const contactFields = fields.contact;
    // relationship fields
    const relationshipFields = fields.relationship;
    // get source person
    const sourcePerson = this.selectedNodes.sourceNode;

    // add the new Contact
    this.contactDataService
      .createContact(this.selectedOutbreak.id, contactFields)
      .pipe(
        switchMap((contactData: ContactModel) => {
          relationshipFields.persons = [{
            id: contactData.id
          }];

          // create the relationship between the source person and the new contact
          return this.relationshipDataService
            .createRelationship(
              this.selectedOutbreak.id,
              sourcePerson.type,
              sourcePerson.id,
              relationshipFields
            )
            .pipe(
              catchError((err) => {
                // display error message
                this.toastV2Service.error(err);

                // rollback - remove contact
                this.contactDataService
                  .deleteContact(this.selectedOutbreak.id, contactData.id)
                  .subscribe();

                // finished
                return throwError(err);
              })
            );
        }),
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        })
      )
      .subscribe(() => {
        this.toastV2Service.success('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ACTION_CREATE_CONTACT_SUCCESS_MESSAGE');

        // reset form
        this.resetFormModels();

        // reset selected nodes
        this.resetNodes();

        // reset node action
        this.currentNodeAction = null;
      });
  }

  createContactOfContact(form: NgForm) {
    // get forms fields
    const fields = this.formHelper.getFields(form);

    if (!this.formHelper.validateForm(form)) {
      return;
    }

    // contact of contact fields
    const contactOfContactFields = fields.contact;
    // relationship fields
    const relationshipFields = fields.relationship;
    // get source person
    const sourcePerson = this.selectedNodes.sourceNode;

    // add the new Contact of Contact
    this.contactsOfContactsDataService
      .createContactOfContact(this.selectedOutbreak.id, contactOfContactFields)
      .pipe(
        switchMap((contactOfContactData: ContactOfContactModel) => {
          relationshipFields.persons = [{
            id: contactOfContactData.id
          }];

          // create the relationship between the source person and the new contact of contact
          return this.relationshipDataService
            .createRelationship(
              this.selectedOutbreak.id,
              sourcePerson.type,
              sourcePerson.id,
              relationshipFields
            )
            .pipe(
              catchError((err) => {
                // display error message
                this.toastV2Service.error(err);

                // rollback - remove contact
                this.contactsOfContactsDataService
                  .deleteContactOfContact(this.selectedOutbreak.id, contactOfContactData.id)
                  .subscribe();

                // finished
                return throwError(err);
              })
            );
        }),
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        })
      )
      .subscribe(() => {
        this.toastV2Service.success('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ACTION_CREATE_CONTACT_OF_CONTACT_SUCCESS_MESSAGE');

        // reset form
        this.resetFormModels();

        // reset selected nodes
        this.resetNodes();

        // reset node action
        this.currentNodeAction = null;
      });
  }

  /**
     * Create a new Contact for a selected node (Case or Event)
     * @param form
     */
  modifyPerson(form: NgForm) {
    if (!this.formHelper.validateForm(form)) {
      return;
    }

    // get forms fields
    const dirtyFields: any = this.formHelper.getDirtyFields(form);

    // get person being modified
    const person: (CaseModel | ContactModel | EventModel | ContactOfContactModel) = this.selectedNodes.nodes[0];

    // modify person
    this.entityDataService
      .modifyEntity(person.type, this.selectedOutbreak.id, person.id, dirtyFields)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        })
      )
      .subscribe(() => {
        this.toastV2Service.success('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ACTION_MODIFY_PERSON_SUCCESS_MESSAGE');

        // reset form
        this.resetFormModels();

        // reset selected nodes
        this.resetNodes();

        // reset node action
        this.currentNodeAction = null;
      });
  }

  /**
     * Modify a selected relationship relationship
     * @param {NgForm} form
     */
  modifyRelationship(form: NgForm) {
    if (!this.formHelper.validateForm(form)) {
      return;
    }

    // get forms fields
    const dirtyFields: any = this.formHelper.getDirtyFields(form);
    // create source person
    const sourcePerson = _.find(this.selectedRelationship.persons, person => person.source === true);
    this.relationshipDataService
      .modifyRelationship(
        this.selectedOutbreak.id,
        sourcePerson.type,
        sourcePerson.id,
        this.selectedRelationship.id,
        dirtyFields.relationship
      )
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);

          return throwError(err);
        })
      )
      .subscribe(() => {
        this.toastV2Service.success('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ACTION_MODIFY_RELATIONSHIP_SUCCESS_MESSAGE');

        // reset selected relationship
        this.selectedRelationship = undefined;

        // reset form
        this.resetFormModels();

        // reset selected nodes
        this.resetNodes();

        // reset node action
        this.currentNodeAction = null;
      });
  }

  /**
     * Delete selected relationship
     */
  deleteSelectedRelationship() {
    this.dialogV2Service
      .showConfirmDialog({
        config: {
          title: {
            get: () => 'LNG_COMMON_LABEL_ATTENTION_REQUIRED'
          },
          message: {
            get: () => 'LNG_DIALOG_CONFIRM_DELETE_RELATIONSHIP_CHAIN_OF_TRANSMISSION'
          }
        }
      })
      .subscribe((response) => {
        // canceled ?
        if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
          // finished
          return;
        }

        // delete relationship
        const loadingDialog = this.dialogV2Service.showLoadingDialog();
        const sourcePerson = _.find(this.selectedRelationship.persons, person => person.source === true);
        this.relationshipDataService
          .deleteRelationship(
            this.selectedOutbreak.id,
            sourcePerson.type,
            sourcePerson.id,
            this.selectedRelationship.id
          )
          .pipe(
            catchError((err) => {
              this.toastV2Service.error(err);
              loadingDialog.close();
              return throwError(err);
            })
          )
          .subscribe(() => {
            this.toastV2Service.success('LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_ACTION_DELETE_RELATIONSHIP_SUCCESS_MESSAGE');
            loadingDialog.close();

            // reset selected relationship
            this.selectedRelationship = undefined;

            // reset form
            this.resetFormModels();

            // reset selected nodes
            this.resetNodes();

            // reset node action
            this.currentNodeAction = null;
          });
      });
  }

  /**
     * Refresh COT after a relationship was reversed
     */
  refreshAfterReverseRelationshipPersons() {
    // reset selected relationship
    this.selectedRelationship = undefined;

    // reset form
    this.resetFormModels();

    // reset selected nodes
    this.resetNodes();

    // reset node action
    this.currentNodeAction = null;
  }
}
