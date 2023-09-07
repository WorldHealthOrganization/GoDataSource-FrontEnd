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
import { SelectedNodes } from '../../classes/selected-nodes';
import { UserModel } from '../../../../core/models/user.model';
import { GraphEdgeModel } from '../../../../core/models/graph-edge.model';
import * as _ from 'lodash';
import { catchError, switchMap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { Subscription } from 'rxjs/internal/Subscription';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { TransmissionChainsDashletComponent } from '../../components/transmission-chains-dashlet/transmission-chains-dashlet.component';
import { DomService } from '../../../../core/services/helper/dom.service';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { PersonAndRelatedHelperService } from '../../../../core/services/helper/person-and-related-helper.service';
import { IQuickEditorV2Handlers, IQuickEditorV2InputValidatorRequired, IQuickEditorV2Section, QuickEditorV2InputType } from '../../../../shared/components-v2/app-quick-editor-v2/models/input.model';
import { QuickEditorV2InputToVisibleMandatoryConf } from '../../../../shared/forms-v2/components/app-form-visible-mandatory-v2/models/visible-mandatory.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataHelperService } from '../../../../core/services/helper/reference-data-helper.service';
import { TimerCache } from '../../../../core/helperClasses/timer-cache';
import { IGeneralAsyncValidatorResponse } from '../../../../shared/xt-forms/validators/general-async-validator.directive';
import { ClusterDataService } from '../../../../core/services/data/cluster.data.service';
import { RequestQueryBuilder, RequestSortDirection } from '../../../../core/helperClasses/request-query-builder';

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

  // quick editor
  private _quickEditorDefinition: {
    id: string,
    handlers: IQuickEditorV2Handlers<CaseModel | ContactModel | EventModel | ContactOfContactModel | RelationshipModel, QuickEditorV2InputToVisibleMandatoryConf>
  };

  // timers
  private _scrollToEditModeTimer: number;
  private _scrollToRelatioshipDetailsTimer: number;

  // provide constants to template
  Constants = Constants;
  EntityType = EntityType;
  NodeAction = NodeAction;

  /**
   * Constructor
   */
  constructor(
    private authDataService: AuthDataService,
    protected activatedRoute: ActivatedRoute,
    private entityDataService: EntityDataService,
    private outbreakDataService: OutbreakDataService,
    private formHelper: FormHelperService,
    private personAndRelatedHelperService: PersonAndRelatedHelperService,
    private domService: DomService,
    private referenceDataHelperService: ReferenceDataHelperService,
    private clusterDataService: ClusterDataService
  ) {}

  /**
     * Component initialized
     */
  ngOnInit() {
    // authenticated user
    this.authUser = this.authDataService.getAuthenticatedUser();

    this.activatedRoute.queryParams
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

        // cleanup
        this.removeRelationship();
        this.resetFormModels();
        this.resetNodes();
        this.currentNodeAction = null;
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

    // stop timers
    this.stopScrollToEditModeTimer();
    this.stopScrollToRelatioshipDetailsTimer();
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
   * Stop timer
   */
  private stopScrollToEditModeTimer(): void {
    if (this._scrollToEditModeTimer) {
      clearTimeout(this._scrollToEditModeTimer);
      this._scrollToEditModeTimer = undefined;
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
    const loadingDialog = this.personAndRelatedHelperService.dialogV2Service.showLoadingDialog();
    this.entityDataService
      .getEntity(entity.type, this.selectedOutbreak.id, entity.id)
      .pipe(
        catchError((err) => {
          this.personAndRelatedHelperService.toastV2Service.error(err);
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
                this.personAndRelatedHelperService.toastV2Service.error(err);
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

                // stop previous
                this.stopScrollToEditModeTimer();

                // focus boxes
                this._scrollToEditModeTimer = setTimeout(() => {
                  // reset
                  this._scrollToEditModeTimer = undefined;

                  // scroll
                  this.domService.scrollItemIntoView(
                    '.transmission-chain-edit-mode'
                  );
                });
              } else {
                // show node information
                this.personAndRelatedHelperService.relationship.showEntityDetailsDialog(
                  this.personAndRelatedHelperService.i18nService.instant(
                    'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_NODE_TITLE',
                    {
                      type: this.personAndRelatedHelperService.i18nService.instant(entityData.type)
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

            // stop previous
            this.stopScrollToEditModeTimer();

            // focus boxes
            this._scrollToEditModeTimer = setTimeout(() => {
              // reset
              this._scrollToEditModeTimer = undefined;

              // scroll
              this.domService.scrollItemIntoView(
                '.transmission-chain-edit-mode'
              );
            });
          } else {
            // show node information
            this.personAndRelatedHelperService.relationship.showEntityDetailsDialog(
              this.personAndRelatedHelperService.i18nService.instant(
                'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_NODE_TITLE',
                {
                  type: this.personAndRelatedHelperService.i18nService.instant(entityData.type)
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
   * Stop timer
   */
  private stopScrollToRelatioshipDetailsTimer(): void {
    if (this._scrollToRelatioshipDetailsTimer) {
      clearTimeout(this._scrollToRelatioshipDetailsTimer);
      this._scrollToRelatioshipDetailsTimer = undefined;
    }
  }

  /**
   * Edge tap / click
   */
  onEdgeTap(relationship: GraphEdgeModel) {
    // retrieve relationship info
    const loadingDialog = this.personAndRelatedHelperService.dialogV2Service.showLoadingDialog();
    this.personAndRelatedHelperService.relationship.relationshipDataService
      .getEntityRelationship(
        this.selectedOutbreak.id,
        relationship.sourceType,
        relationship.source,
        relationship.id)
      .pipe(
        catchError((err) => {
          this.personAndRelatedHelperService.toastV2Service.error(err);
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

          // stop previous
          this.stopScrollToRelatioshipDetailsTimer();

          // focus box
          this._scrollToRelatioshipDetailsTimer = setTimeout(() => {
            // reset
            this._scrollToRelatioshipDetailsTimer = undefined;

            // scroll
            this.domService.scrollItemIntoView(
              '.selected-relationship-details'
            );
          });
        } else {
          // show edge information
          this.personAndRelatedHelperService.relationship.showEntityDetailsDialog(
            this.personAndRelatedHelperService.i18nService.instant('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_EDGE_TITLE'),
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
    this.personAndRelatedHelperService.dialogV2Service
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
        const loadingDialog = this.personAndRelatedHelperService.dialogV2Service.showLoadingDialog();
        this.entityDataService
          .deleteEntity(
            person.type,
            this.selectedOutbreak.id,
            person.id
          )
          .pipe(
            catchError((err) => {
              this.personAndRelatedHelperService.toastV2Service.error(err);
              loadingDialog.close();
              return throwError(err);
            })
          )
          .subscribe(() => {
            this.personAndRelatedHelperService.toastV2Service.success('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ACTION_DELETE_PERSON_SUCCESS_MESSAGE');
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
   */
  createRelationship(form: NgForm) {
    // submit to validate form
    form.ngSubmit.emit();

    // validate
    if (!form.valid) {
      // show message
      this.personAndRelatedHelperService.toastV2Service.notice('LNG_FORM_ERROR_FORM_INVALID');

      // finished
      return;
    }

    // get forms fields
    const fields = this.formHelper.getFields(form);

    // get source and target persons
    const sourcePerson = this.selectedNodes.sourceNode;
    const targetPerson = this.selectedNodes.targetNode;

    // show loading
    const loading = this.personAndRelatedHelperService.dialogV2Service.showLoadingDialog();

    // prepare relationship data
    const relationshipData = fields.relationship;
    relationshipData.persons = [{
      id: targetPerson.id
    }];
    this.personAndRelatedHelperService.relationship.relationshipDataService
      .createRelationship(
        this.selectedOutbreak.id,
        sourcePerson.type,
        sourcePerson.id,
        relationshipData
      )
      .pipe(
        catchError((err) => {
          this.personAndRelatedHelperService.toastV2Service.error(err);
          loading.close();
          return throwError(err);
        })
      )
      .subscribe(() => {
        loading.close();
        this.personAndRelatedHelperService.toastV2Service.success('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ACTION_CREATE_RELATIONSHIP_SUCCESS_MESSAGE');

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
   */
  createContact(form: NgForm) {
    // submit to validate form
    form.ngSubmit.emit();

    // validate
    if (!form.valid) {
      // show message
      this.personAndRelatedHelperService.toastV2Service.notice('LNG_FORM_ERROR_FORM_INVALID');

      // finished
      return;
    }

    // get forms fields
    const fields = this.formHelper.getFields(form);

    // contact fields
    const contactFields = fields.contact;
    // relationship fields
    const relationshipFields = fields.relationship;
    // get source person
    const sourcePerson = this.selectedNodes.sourceNode;

    // show loading
    const loading = this.personAndRelatedHelperService.dialogV2Service.showLoadingDialog();

    // add the new Contact
    this.personAndRelatedHelperService.contact.contactDataService
      .createContact(this.selectedOutbreak.id, contactFields)
      .pipe(
        switchMap((contactData: ContactModel) => {
          relationshipFields.persons = [{
            id: contactData.id
          }];

          // create the relationship between the source person and the new contact
          return this.personAndRelatedHelperService.relationship.relationshipDataService
            .createRelationship(
              this.selectedOutbreak.id,
              sourcePerson.type,
              sourcePerson.id,
              relationshipFields
            )
            .pipe(
              catchError((err) => {
                // display error message
                loading.close();
                this.personAndRelatedHelperService.toastV2Service.error(err);

                // rollback - remove contact
                this.personAndRelatedHelperService.contact.contactDataService
                  .deleteContact(this.selectedOutbreak.id, contactData.id)
                  .subscribe();

                // finished
                return throwError(err);
              })
            );
        }),
        catchError((err) => {
          loading.close();
          this.personAndRelatedHelperService.toastV2Service.error(err);
          return throwError(err);
        })
      )
      .subscribe(() => {
        loading.close();
        this.personAndRelatedHelperService.toastV2Service.success('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ACTION_CREATE_CONTACT_SUCCESS_MESSAGE');

        // reset form
        this.resetFormModels();

        // reset selected nodes
        this.resetNodes();

        // reset node action
        this.currentNodeAction = null;
      });
  }

  /**
   * Create contact of contacts
   */
  createContactOfContact(form: NgForm) {
    // submit to validate form
    form.ngSubmit.emit();

    // validate
    if (!form.valid) {
      // show message
      this.personAndRelatedHelperService.toastV2Service.notice('LNG_FORM_ERROR_FORM_INVALID');

      // finished
      return;
    }

    // get forms fields
    const fields = this.formHelper.getFields(form);

    // contact of contact fields
    const contactOfContactFields = fields.contact;
    // relationship fields
    const relationshipFields = fields.relationship;
    // get source person
    const sourcePerson = this.selectedNodes.sourceNode;

    // show loading
    const loading = this.personAndRelatedHelperService.dialogV2Service.showLoadingDialog();

    // add the new Contact of Contact
    this.personAndRelatedHelperService.contactOfContact.contactsOfContactsDataService
      .createContactOfContact(this.selectedOutbreak.id, contactOfContactFields)
      .pipe(
        switchMap((contactOfContactData: ContactOfContactModel) => {
          relationshipFields.persons = [{
            id: contactOfContactData.id
          }];

          // create the relationship between the source person and the new contact of contact
          return this.personAndRelatedHelperService.relationship.relationshipDataService
            .createRelationship(
              this.selectedOutbreak.id,
              sourcePerson.type,
              sourcePerson.id,
              relationshipFields
            )
            .pipe(
              catchError((err) => {
                // display error message
                loading.close();
                this.personAndRelatedHelperService.toastV2Service.error(err);

                // rollback - remove contact
                this.personAndRelatedHelperService.contactOfContact.contactsOfContactsDataService
                  .deleteContactOfContact(this.selectedOutbreak.id, contactOfContactData.id)
                  .subscribe();

                // finished
                return throwError(err);
              })
            );
        }),
        catchError((err) => {
          loading.close();
          this.personAndRelatedHelperService.toastV2Service.error(err);
          return throwError(err);
        })
      )
      .subscribe(() => {
        loading.close();
        this.personAndRelatedHelperService.toastV2Service.success('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ACTION_CREATE_CONTACT_OF_CONTACT_SUCCESS_MESSAGE');

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
   */
  modifyPerson(form: NgForm) {
    // submit to validate form
    form.ngSubmit.emit();

    // validate
    if (!form.valid) {
      // show message
      this.personAndRelatedHelperService.toastV2Service.notice('LNG_FORM_ERROR_FORM_INVALID');

      // finished
      return;
    }

    // get forms fields
    const dirtyFields: any = this.formHelper.getDirtyFields(form);
    if (_.isEmpty(dirtyFields)) {
      // show message
      this.personAndRelatedHelperService.toastV2Service.success('LNG_FORM_WARNING_NO_CHANGES');

      // finished
      return;
    }

    // get person being modified
    const person: (CaseModel | ContactModel | EventModel | ContactOfContactModel) = this.selectedNodes.nodes[0];

    // show loading
    const loading = this.personAndRelatedHelperService.dialogV2Service.showLoadingDialog();

    // modify person
    this.entityDataService
      .modifyEntity(person.type, this.selectedOutbreak.id, person.id, dirtyFields)
      .pipe(
        catchError((err) => {
          loading.close();
          this.personAndRelatedHelperService.toastV2Service.error(err);
          return throwError(err);
        })
      )
      .subscribe(() => {
        loading.close();
        this.personAndRelatedHelperService.toastV2Service.success('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ACTION_MODIFY_PERSON_SUCCESS_MESSAGE');

        // reset form
        this.resetFormModels();

        // reset selected nodes
        this.resetNodes();

        // reset node action
        this.currentNodeAction = null;
      });
  }

  /**
   * Modify a selected relationship
   */
  modifyRelationship(form: NgForm) {
    // submit to validate form
    form.ngSubmit.emit();

    // validate
    if (!form.valid) {
      // show message
      this.personAndRelatedHelperService.toastV2Service.notice('LNG_FORM_ERROR_FORM_INVALID');

      // finished
      return;
    }

    // get forms fields
    const dirtyFields: any = this.formHelper.getDirtyFields(form);
    if (_.isEmpty(dirtyFields)) {
      // show message
      this.personAndRelatedHelperService.toastV2Service.success('LNG_FORM_WARNING_NO_CHANGES');

      // finished
      return;
    }

    // show loading
    const loading = this.personAndRelatedHelperService.dialogV2Service.showLoadingDialog();

    // create source person
    const sourcePerson = _.find(this.selectedRelationship.persons, (person) => person.source === true);
    this.personAndRelatedHelperService.relationship.relationshipDataService
      .modifyRelationship(
        this.selectedOutbreak.id,
        sourcePerson.type,
        sourcePerson.id,
        this.selectedRelationship.id,
        dirtyFields.relationship
      )
      .pipe(
        catchError((err) => {
          loading.close();
          this.personAndRelatedHelperService.toastV2Service.error(err);
          return throwError(err);
        })
      )
      .subscribe(() => {
        loading.close();
        this.personAndRelatedHelperService.toastV2Service.success('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ACTION_MODIFY_RELATIONSHIP_SUCCESS_MESSAGE');

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
    this.personAndRelatedHelperService.dialogV2Service
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
        const loadingDialog = this.personAndRelatedHelperService.dialogV2Service.showLoadingDialog();
        const sourcePerson = _.find(this.selectedRelationship.persons, (person) => person.source === true);
        this.personAndRelatedHelperService.relationship.relationshipDataService
          .deleteRelationship(
            this.selectedOutbreak.id,
            sourcePerson.type,
            sourcePerson.id,
            this.selectedRelationship.id
          )
          .pipe(
            catchError((err) => {
              this.personAndRelatedHelperService.toastV2Service.error(err);
              loadingDialog.close();
              return throwError(err);
            })
          )
          .subscribe(() => {
            this.personAndRelatedHelperService.toastV2Service.success('LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_ACTION_DELETE_RELATIONSHIP_SUCCESS_MESSAGE');
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

  /**
   * Section filter per outbreak visible and mandatory fields
   */
  private filterVisibleMandatorySectionFields(sections: IQuickEditorV2Section<QuickEditorV2InputToVisibleMandatoryConf>[]): IQuickEditorV2Section<QuickEditorV2InputToVisibleMandatoryConf>[] {
    // filter
    sections.forEach((section) => {
      // filter
      section.inputs = (section.inputs || []).filter((input) => {
        // not visible ?
        if (!this.personAndRelatedHelperService.list.shouldVisibleMandatoryTableColumnBeVisible(
          this.selectedOutbreak,
          input.visibleMandatory.key,
          input.visibleMandatory.field
        )) {
          return false;
        }

        // must check for required ?
        if (
          this.selectedOutbreak?.visibleAndMandatoryFields &&
          this.selectedOutbreak.visibleAndMandatoryFields[input.visibleMandatory.key] &&
          this.selectedOutbreak.visibleAndMandatoryFields[input.visibleMandatory.key][input.visibleMandatory.field]?.mandatory
        ) {
          // must initialize ?
          if (!input.validators) {
            input.validators = {};
          }

          // attach required
          if (!(input.validators as IQuickEditorV2InputValidatorRequired)?.required) {
            (input.validators as IQuickEditorV2InputValidatorRequired).required = () => true;
          }
        } else if (
          this.selectedOutbreak?.visibleAndMandatoryFields &&
          this.selectedOutbreak.visibleAndMandatoryFields[input.visibleMandatory.key] &&
          !this.selectedOutbreak.visibleAndMandatoryFields[input.visibleMandatory.key][input.visibleMandatory.field]?.mandatory &&
          (input.validators as IQuickEditorV2InputValidatorRequired)?.required &&
          !input.visibleMandatory.keepRequired
        ) {
          // remove if it shouldn't be mandatory
          delete (input.validators as IQuickEditorV2InputValidatorRequired).required;
        }

        // visible
        return true;
      });
    });

    // finished
    return sections;
  }

  /**
   * Update quick editor definitions - case
   */
  private retrieveQuickInputCaseDefinition(caseModel: CaseModel): IQuickEditorV2Section<QuickEditorV2InputToVisibleMandatoryConf>[] {
    // init
    const today = Constants.getCurrentDate();
    const caseVisualIDMask: {
      mask: string
    } = {
      mask: this.personAndRelatedHelperService.case.generateCaseIDMask(this.selectedOutbreak.caseIdMask)
    };

    // generate definition
    return this.filterVisibleMandatorySectionFields([
      {
        label: 'LNG_FORM_CASE_QUICK_LABEL_PERSONAL',
        inputs: [
          {
            type: QuickEditorV2InputType.TEXT,
            name: 'firstName',
            placeholder: 'LNG_CASE_FIELD_LABEL_FIRST_NAME',
            description: 'LNG_CASE_FIELD_LABEL_FIRST_NAME_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.case.visibleMandatoryKey,
              field: 'firstName'
            },
            value: {
              get: () => caseModel.firstName,
              set: () => {}
            },
            validators: {
              required: () => true
            }
          }, {
            type: QuickEditorV2InputType.TEXT,
            name: 'lastName',
            placeholder: 'LNG_CASE_FIELD_LABEL_LAST_NAME',
            description: 'LNG_CASE_FIELD_LABEL_LAST_NAME_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.case.visibleMandatoryKey,
              field: 'lastName'
            },
            value: {
              get: () => caseModel.lastName,
              set: () => {}
            }
          }, {
            type: QuickEditorV2InputType.SELECT_SINGLE,
            name: 'gender',
            placeholder: 'LNG_CASE_FIELD_LABEL_GENDER',
            description: 'LNG_CASE_FIELD_LABEL_GENDER_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.case.visibleMandatoryKey,
              field: 'gender'
            },
            value: {
              get: () => caseModel.gender,
              set: () => {}
            },
            options: (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
          }, {
            type: QuickEditorV2InputType.SELECT_SINGLE,
            name: 'occupation',
            placeholder: 'LNG_CASE_FIELD_LABEL_OCCUPATION',
            description: 'LNG_CASE_FIELD_LABEL_OCCUPATION_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.case.visibleMandatoryKey,
              field: 'occupation'
            },
            value: {
              get: () => caseModel.occupation,
              set: () => {}
            },
            options: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.occupation as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              caseModel.occupation
            )
          }, {
            type: QuickEditorV2InputType.ASYNC_VALIDATOR_TEXT,
            name: 'visualId',
            placeholder: 'LNG_CASE_FIELD_LABEL_VISUAL_ID',
            description: this.personAndRelatedHelperService.i18nService.instant(
              'LNG_CASE_FIELD_LABEL_VISUAL_ID_DESCRIPTION',
              caseVisualIDMask
            ),
            visibleMandatory: {
              key: this.personAndRelatedHelperService.case.visibleMandatoryKey,
              field: 'visualId'
            },
            value: {
              get: () => caseModel.visualId,
              set: (value) => {
                caseModel.visualId = value;
              }
            },
            suffixIconButtons: [
              {
                icon: 'refresh',
                tooltip: 'LNG_PAGE_ACTION_REFRESH_VISUAL_ID_DESCRIPTION',
                clickAction: (input) => {
                  // generate
                  caseModel.visualId = this.personAndRelatedHelperService.case.generateCaseIDMask(this.selectedOutbreak.caseIdMask);

                  // mark as dirty
                  input.control?.markAsDirty();
                }
              }
            ],
            validators: {
              async: new Observable((observer) => {
                // construct cache key
                const cacheKey: string = 'CCA_' + this.selectedOutbreak.id +
                  caseVisualIDMask.mask +
                  caseModel.visualId +
                  (
                    caseModel.id ?
                      caseModel.id :
                      ''
                  );

                // get data from cache or execute validator
                TimerCache.run(
                  cacheKey,
                  this.personAndRelatedHelperService.case.caseDataService.checkCaseVisualIDValidity(
                    this.selectedOutbreak.id,
                    caseVisualIDMask.mask,
                    caseModel.visualId,
                    caseModel.id
                  )
                ).subscribe((isValid: boolean | IGeneralAsyncValidatorResponse) => {
                  observer.next(isValid);
                  observer.complete();
                });
              })
            }
          }
        ]
      }, {
        label: 'LNG_FORM_CASE_QUICK_LABEL_EPIDEMIOLOGY',
        inputs: [
          {
            type: QuickEditorV2InputType.SELECT_SINGLE,
            name: 'classification',
            placeholder: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION',
            description: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.case.visibleMandatoryKey,
              field: 'classification'
            },
            value: {
              get: () => caseModel.classification,
              set: () => {}
            },
            validators: {
              required: () => true
            },
            options: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.classification as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              caseModel.classification
            )
          }, {
            type: QuickEditorV2InputType.DATE,
            name: 'dateOfOnset',
            placeholder: 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET',
            description: 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.case.visibleMandatoryKey,
              field: 'dateOfOnset'
            },
            value: {
              get: () => caseModel.dateOfOnset,
              set: () => {}
            },
            maxDate: today,
            validators: {
              required: () => !!this.selectedOutbreak?.isDateOfOnsetRequired,
              dateSameOrBefore: () => [
                today,
                'dateOfOutcome'
              ]
            }
          }, {
            type: QuickEditorV2InputType.SELECT_SINGLE,
            name: 'outcomeId',
            placeholder: 'LNG_CASE_FIELD_LABEL_OUTCOME',
            description: 'LNG_CASE_FIELD_LABEL_OUTCOME_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.case.visibleMandatoryKey,
              field: 'outcomeId'
            },
            value: {
              get: () => caseModel.outcomeId,
              set: () => {}
            },
            options: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.outcome as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              caseModel.outcomeId
            )
          }, {
            type: QuickEditorV2InputType.DATE,
            name: 'dateOfOutcome',
            placeholder: 'LNG_CASE_FIELD_LABEL_DATE_OF_OUTCOME',
            description: 'LNG_CASE_FIELD_LABEL_DATE_OF_OUTCOME_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.case.visibleMandatoryKey,
              field: 'dateOfOutcome'
            },
            value: {
              get: () => caseModel.dateOfOutcome,
              set: () => {}
            },
            maxDate: today,
            validators: {
              required: () => !!this.selectedOutbreak?.isDateOfOnsetRequired,
              dateSameOrBefore: () => [
                today
              ],
              dateSameOrAfter: () => [
                'dateOfOnset'
              ]
            }
          }, {
            type: QuickEditorV2InputType.DATE,
            name: 'dateOfReporting',
            placeholder: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING',
            description: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.case.visibleMandatoryKey,
              field: 'dateOfReporting'
            },
            value: {
              get: () => caseModel.dateOfReporting,
              set: () => {}
            },
            maxDate: today,
            validators: {
              required: () => true,
              dateSameOrBefore: () => [
                today
              ]
            }
          }, {
            type: QuickEditorV2InputType.SELECT_SINGLE,
            name: 'riskLevel',
            placeholder: 'LNG_CASE_FIELD_LABEL_RISK_LEVEL',
            description: 'LNG_CASE_FIELD_LABEL_RISK_LEVEL_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.case.visibleMandatoryKey,
              field: 'riskLevel'
            },
            value: {
              get: () => caseModel.riskLevel,
              set: () => {}
            },
            options: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              caseModel.riskLevel
            )
          }, {
            type: QuickEditorV2InputType.TEXTAREA,
            name: 'riskReason',
            placeholder: 'LNG_CASE_FIELD_LABEL_RISK_REASON',
            description: 'LNG_CASE_FIELD_LABEL_RISK_REASON_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.case.visibleMandatoryKey,
              field: 'riskReason'
            },
            value: {
              get: () => caseModel.riskReason,
              set: () => {}
            }
          }
        ]
      }
    ]);
  }

  /**
   * Update quick editor definitions - contact
   */
  private retrieveQuickInputContactDefinition(contactModel: ContactModel): IQuickEditorV2Section<QuickEditorV2InputToVisibleMandatoryConf>[] {
    // init
    const today = Constants.getCurrentDate();
    const contactVisualIDMask: {
      mask: string
    } = {
      mask: this.personAndRelatedHelperService.contact.generateContactIDMask(this.selectedOutbreak.contactIdMask)
    };

    // generate definition
    return this.filterVisibleMandatorySectionFields([
      {
        label: 'LNG_PAGE_MODIFY_CONTACT_TAB_PERSONAL_TITLE',
        inputs: [
          {
            type: QuickEditorV2InputType.TEXT,
            name: 'firstName',
            placeholder: 'LNG_CONTACT_FIELD_LABEL_FIRST_NAME',
            description: 'LNG_CONTACT_FIELD_LABEL_FIRST_NAME_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
              field: 'firstName'
            },
            value: {
              get: () => contactModel.firstName,
              set: () => {}
            },
            validators: {
              required: () => true
            }
          }, {
            type: QuickEditorV2InputType.TEXT,
            name: 'lastName',
            placeholder: 'LNG_CONTACT_FIELD_LABEL_LAST_NAME',
            description: 'LNG_CONTACT_FIELD_LABEL_LAST_NAME_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
              field: 'lastName'
            },
            value: {
              get: () => contactModel.lastName,
              set: () => {}
            }
          }, {
            type: QuickEditorV2InputType.SELECT_SINGLE,
            name: 'gender',
            placeholder: 'LNG_CONTACT_FIELD_LABEL_GENDER',
            description: 'LNG_CONTACT_FIELD_LABEL_GENDER_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
              field: 'gender'
            },
            value: {
              get: () => contactModel.gender,
              set: () => {}
            },
            options: (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
          }, {
            type: QuickEditorV2InputType.SELECT_SINGLE,
            name: 'occupation',
            placeholder: 'LNG_CONTACT_FIELD_LABEL_OCCUPATION',
            description: 'LNG_CONTACT_FIELD_LABEL_OCCUPATION_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
              field: 'occupation'
            },
            value: {
              get: () => contactModel.occupation,
              set: () => {}
            },
            options: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.occupation as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              contactModel.occupation
            )
          }, {
            type: QuickEditorV2InputType.ASYNC_VALIDATOR_TEXT,
            name: 'visualId',
            placeholder: 'LNG_CONTACT_FIELD_LABEL_VISUAL_ID',
            description: this.personAndRelatedHelperService.i18nService.instant(
              'LNG_CASE_FIELD_LABEL_VISUAL_ID_DESCRIPTION',
              contactVisualIDMask
            ),
            visibleMandatory: {
              key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
              field: 'visualId'
            },
            value: {
              get: () => contactModel.visualId,
              set: (value) => {
                contactModel.visualId = value;
              }
            },
            suffixIconButtons: [
              {
                icon: 'refresh',
                tooltip: 'LNG_PAGE_ACTION_REFRESH_VISUAL_ID_DESCRIPTION',
                clickAction: (input) => {
                  // generate
                  contactModel.visualId = this.personAndRelatedHelperService.contact.generateContactIDMask(this.selectedOutbreak.contactIdMask);

                  // mark as dirty
                  input.control?.markAsDirty();
                }
              }
            ],
            validators: {
              async: new Observable((observer) => {
                // construct cache key
                const cacheKey: string = 'CCO_' + this.selectedOutbreak.id +
                  contactVisualIDMask.mask +
                  contactModel.visualId +
                  (
                    contactModel.id ?
                      contactModel.id :
                      ''
                  );

                // get data from cache or execute validator
                TimerCache.run(
                  cacheKey,
                  this.personAndRelatedHelperService.contact.contactDataService.checkContactVisualIDValidity(
                    this.selectedOutbreak.id,
                    contactVisualIDMask.mask,
                    contactModel.visualId,
                    contactModel.id
                  )
                ).subscribe((isValid: boolean | IGeneralAsyncValidatorResponse) => {
                  observer.next(isValid);
                  observer.complete();
                });
              })
            }
          }
        ]
      }, {
        label: 'LNG_PAGE_MODIFY_CONTACT_TAB_INFECTION_TITLE',
        inputs: [
          {
            type: QuickEditorV2InputType.DATE,
            name: 'dateOfReporting',
            placeholder: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING',
            description: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
              field: 'dateOfReporting'
            },
            value: {
              get: () => contactModel.dateOfReporting,
              set: () => {}
            },
            maxDate: today,
            validators: {
              required: () => true,
              dateSameOrBefore: () => [
                today
              ]
            }
          }, {
            type: QuickEditorV2InputType.SELECT_SINGLE,
            name: 'riskLevel',
            placeholder: 'LNG_CONTACT_FIELD_LABEL_RISK_LEVEL',
            description: 'LNG_CONTACT_FIELD_LABEL_RISK_LEVEL_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
              field: 'riskLevel'
            },
            value: {
              get: () => contactModel.riskLevel,
              set: () => {}
            },
            options: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              contactModel.riskLevel
            )
          }, {
            type: QuickEditorV2InputType.TEXTAREA,
            name: 'riskReason',
            placeholder: 'LNG_CONTACT_FIELD_LABEL_RISK_REASON',
            description: 'LNG_CONTACT_FIELD_LABEL_RISK_REASON_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
              field: 'riskReason'
            },
            value: {
              get: () => contactModel.riskReason,
              set: () => {}
            }
          }, {
            type: QuickEditorV2InputType.SELECT_SINGLE,
            name: 'followUp.status',
            placeholder: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_STATUS',
            description: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_STATUS_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
              field: 'followUp[status]'
            },
            value: {
              get: () => contactModel.followUp?.status,
              set: () => {}
            },
            options: (this.activatedRoute.snapshot.data.followUpStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
          }
        ]
      }
    ]);
  }

  /**
   * Update quick editor definitions - event
   */
  private retrieveQuickInputEventDefinition(eventModel: EventModel): IQuickEditorV2Section<QuickEditorV2InputToVisibleMandatoryConf>[] {
    // init
    const today = Constants.getCurrentDate();
    const eventVisualIDMask: {
      mask: string
    } = {
      mask: this.personAndRelatedHelperService.event.generateEventIDMask(this.selectedOutbreak.eventIdMask)
    };

    // generate definition
    return [
      {
        label: 'LNG_PAGE_MODIFY_EVENT_TAB_DETAILS_TITLE',
        inputs: [
          {
            type: QuickEditorV2InputType.TEXT,
            name: 'name',
            placeholder: 'LNG_EVENT_FIELD_LABEL_NAME',
            description: 'LNG_EVENT_FIELD_LABEL_NAME_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.event.visibleMandatoryKey,
              field: 'name'
            },
            value: {
              get: () => eventModel.name,
              set: () => {}
            },
            validators: {
              required: () => true
            }
          }, {
            type: QuickEditorV2InputType.DATE,
            name: 'date',
            placeholder: 'LNG_EVENT_FIELD_LABEL_DATE',
            description: 'LNG_EVENT_FIELD_LABEL_DATE_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.event.visibleMandatoryKey,
              field: 'date'
            },
            value: {
              get: () => eventModel.date,
              set: () => {}
            },
            maxDate: today,
            validators: {
              required: () => true,
              dateSameOrBefore: () => [
                today
              ]
            }
          }, {
            type: QuickEditorV2InputType.DATE,
            name: 'dateOfReporting',
            placeholder: 'LNG_EVENT_FIELD_LABEL_DATE_OF_REPORTING',
            description: 'LNG_EVENT_FIELD_LABEL_DATE_OF_REPORTING_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.event.visibleMandatoryKey,
              field: 'dateOfReporting'
            },
            value: {
              get: () => eventModel.dateOfReporting,
              set: () => {}
            },
            maxDate: today,
            validators: {
              required: () => true,
              dateSameOrBefore: () => [
                today
              ]
            }
          }, {
            type: QuickEditorV2InputType.ASYNC_VALIDATOR_TEXT,
            name: 'visualId',
            placeholder: 'LNG_EVENT_FIELD_LABEL_VISUAL_ID',
            description: this.personAndRelatedHelperService.i18nService.instant(
              'LNG_EVENT_FIELD_LABEL_VISUAL_ID_DESCRIPTION',
              eventVisualIDMask
            ),
            visibleMandatory: {
              key: this.personAndRelatedHelperService.event.visibleMandatoryKey,
              field: 'visualId'
            },
            value: {
              get: () => eventModel.visualId,
              set: (value) => {
                eventModel.visualId = value;
              }
            },
            suffixIconButtons: [
              {
                icon: 'refresh',
                tooltip: 'LNG_PAGE_ACTION_REFRESH_VISUAL_ID_DESCRIPTION',
                clickAction: (input) => {
                  // generate
                  eventModel.visualId = this.personAndRelatedHelperService.event.generateEventIDMask(this.selectedOutbreak.eventIdMask);

                  // mark as dirty
                  input.control?.markAsDirty();
                }
              }
            ],
            validators: {
              async: new Observable((observer) => {
                // construct cache key
                const cacheKey: string = 'CEV_' + this.selectedOutbreak.id +
                  eventVisualIDMask.mask +
                  eventModel.visualId +
                  (
                    eventModel.id ?
                      eventModel.id :
                      ''
                  );

                // get data from cache or execute validator
                TimerCache.run(
                  cacheKey,
                  this.personAndRelatedHelperService.event.eventDataService.checkEventVisualIDValidity(
                    this.selectedOutbreak.id,
                    eventVisualIDMask.mask,
                    eventModel.visualId,
                    eventModel.id
                  )
                ).subscribe((isValid: boolean | IGeneralAsyncValidatorResponse) => {
                  observer.next(isValid);
                  observer.complete();
                });
              })
            }
          }, {
            type: QuickEditorV2InputType.TEXTAREA,
            name: 'description',
            placeholder: 'LNG_EVENT_FIELD_LABEL_DESCRIPTION',
            description: 'LNG_EVENT_FIELD_LABEL_DESCRIPTION_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.event.visibleMandatoryKey,
              field: 'description'
            },
            value: {
              get: () => eventModel.description,
              set: () => {}
            }
          }
        ]
      }
    ];
  }

  /**
   * Update quick editor definitions - contact of contact
   */
  private retrieveQuickInputContactOfContactDefinition(contactOfContactModel: ContactOfContactModel): IQuickEditorV2Section<QuickEditorV2InputToVisibleMandatoryConf>[] {
    // init
    const today = Constants.getCurrentDate();
    const contactOfContactVisualIDMask: {
      mask: string
    } = {
      mask: this.personAndRelatedHelperService.contactOfContact.generateContactOfContactIDMask(this.selectedOutbreak.contactOfContactIdMask)
    };

    // generate definition
    return this.filterVisibleMandatorySectionFields([
      {
        label: 'LNG_PAGE_MODIFY_CONTACT_OF_CONTACT_TAB_PERSONAL_TITLE',
        inputs: [
          {
            type: QuickEditorV2InputType.TEXT,
            name: 'firstName',
            placeholder: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_FIRST_NAME',
            description: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_FIRST_NAME_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.contactOfContact.visibleMandatoryKey,
              field: 'firstName'
            },
            value: {
              get: () => contactOfContactModel.firstName,
              set: () => {}
            },
            validators: {
              required: () => true
            }
          }, {
            type: QuickEditorV2InputType.TEXT,
            name: 'lastName',
            placeholder: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_LAST_NAME',
            description: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_LAST_NAME_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.contactOfContact.visibleMandatoryKey,
              field: 'lastName'
            },
            value: {
              get: () => contactOfContactModel.lastName,
              set: () => {}
            }
          }, {
            type: QuickEditorV2InputType.SELECT_SINGLE,
            name: 'gender',
            placeholder: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_GENDER',
            description: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_GENDER_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.contactOfContact.visibleMandatoryKey,
              field: 'gender'
            },
            value: {
              get: () => contactOfContactModel.gender,
              set: () => {}
            },
            options: (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
          }, {
            type: QuickEditorV2InputType.SELECT_SINGLE,
            name: 'occupation',
            placeholder: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_OCCUPATION',
            description: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_OCCUPATION_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.contactOfContact.visibleMandatoryKey,
              field: 'occupation'
            },
            value: {
              get: () => contactOfContactModel.occupation,
              set: () => {}
            },
            options: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.occupation as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              contactOfContactModel.occupation
            )
          }, {
            type: QuickEditorV2InputType.ASYNC_VALIDATOR_TEXT,
            name: 'visualId',
            placeholder: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VISUAL_ID',
            description: this.personAndRelatedHelperService.i18nService.instant(
              'LNG_CASE_FIELD_LABEL_VISUAL_ID_DESCRIPTION',
              contactOfContactVisualIDMask
            ),
            visibleMandatory: {
              key: this.personAndRelatedHelperService.contactOfContact.visibleMandatoryKey,
              field: 'visualId'
            },
            value: {
              get: () => contactOfContactModel.visualId,
              set: (value) => {
                contactOfContactModel.visualId = value;
              }
            },
            suffixIconButtons: [
              {
                icon: 'refresh',
                tooltip: 'LNG_PAGE_ACTION_REFRESH_VISUAL_ID_DESCRIPTION',
                clickAction: (input) => {
                  // generate
                  contactOfContactModel.visualId = this.personAndRelatedHelperService.contactOfContact.generateContactOfContactIDMask(this.selectedOutbreak.contactOfContactIdMask);

                  // mark as dirty
                  input.control?.markAsDirty();
                }
              }
            ],
            validators: {
              async: new Observable((observer) => {
                // construct cache key
                const cacheKey: string = 'CCC_' + this.selectedOutbreak.id +
                  contactOfContactVisualIDMask.mask +
                  contactOfContactModel.visualId +
                  (
                    contactOfContactModel.id ?
                      contactOfContactModel.id :
                      ''
                  );

                // get data from cache or execute validator
                TimerCache.run(
                  cacheKey,
                  this.personAndRelatedHelperService.contactOfContact.contactsOfContactsDataService.checkContactOfContactVisualIDValidity(
                    this.selectedOutbreak.id,
                    contactOfContactVisualIDMask.mask,
                    contactOfContactModel.visualId,
                    contactOfContactModel.id
                  )
                ).subscribe((isValid: boolean | IGeneralAsyncValidatorResponse) => {
                  observer.next(isValid);
                  observer.complete();
                });
              })
            }
          }
        ]
      }, {
        label: 'LNG_PAGE_MODIFY_CONTACT_OF_CONTACT_TAB_INFECTION_TITLE',
        inputs: [
          {
            type: QuickEditorV2InputType.DATE,
            name: 'dateOfReporting',
            placeholder: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING',
            description: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.contactOfContact.visibleMandatoryKey,
              field: 'dateOfReporting'
            },
            value: {
              get: () => contactOfContactModel.dateOfReporting,
              set: () => {}
            },
            maxDate: today,
            validators: {
              required: () => true,
              dateSameOrBefore: () => [
                today
              ]
            }
          }, {
            type: QuickEditorV2InputType.SELECT_SINGLE,
            name: 'riskLevel',
            placeholder: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_LEVEL',
            description: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_LEVEL_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.contactOfContact.visibleMandatoryKey,
              field: 'riskLevel'
            },
            value: {
              get: () => contactOfContactModel.riskLevel,
              set: () => {}
            },
            options: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              contactOfContactModel.riskLevel
            )
          }, {
            type: QuickEditorV2InputType.TEXTAREA,
            name: 'riskReason',
            placeholder: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_REASON',
            description: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_REASON_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.contactOfContact.visibleMandatoryKey,
              field: 'riskReason'
            },
            value: {
              get: () => contactOfContactModel.riskReason,
              set: () => {}
            }
          }
        ]
      }
    ]);
  }

  /**
   * Update quick editor definitions - relationship
   */
  private retrieveQuickInputRelationshipDefinition(relationship: RelationshipModel): IQuickEditorV2Section<QuickEditorV2InputToVisibleMandatoryConf>[] {
    // init
    const today = Constants.getCurrentDate();

    // generate definition
    return [
      {
        label: 'LNG_COMMON_LABEL_DETAILS',
        inputs: [
          {
            type: QuickEditorV2InputType.DATE,
            name: 'contactDate',
            placeholder: 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE',
            description: 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.relationship.visibleMandatoryKey,
              field: 'contactDate'
            },
            value: {
              get: () => relationship.contactDate,
              set: () => {}
            },
            maxDate: today,
            validators: {
              required: () => true,
              dateSameOrBefore: () => [
                today
              ]
            }
          }, {
            type: QuickEditorV2InputType.TOGGLE_CHECKBOX,
            name: 'contactDateEstimated',
            placeholder: 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_ESTIMATED',
            description: 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_ESTIMATED_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.relationship.visibleMandatoryKey,
              field: 'contactDateEstimated'
            },
            value: {
              get: () => relationship.contactDateEstimated,
              set: () => {}
            }
          }, {
            type: QuickEditorV2InputType.SELECT_SINGLE,
            name: 'certaintyLevelId',
            placeholder: 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL',
            description: 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.relationship.visibleMandatoryKey,
              field: 'certaintyLevelId'
            },
            value: {
              get: () => relationship.certaintyLevelId,
              set: () => {}
            },
            options: (this.activatedRoute.snapshot.data.certaintyLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            validators: {
              required: () => true
            }
          }, {
            type: QuickEditorV2InputType.SELECT_SINGLE,
            name: 'exposureTypeId',
            placeholder: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE',
            description: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.relationship.visibleMandatoryKey,
              field: 'exposureTypeId'
            },
            value: {
              get: () => relationship.exposureTypeId,
              set: () => {}
            },
            options: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.exposureType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              relationship.exposureTypeId
            )
          }, {
            type: QuickEditorV2InputType.SELECT_SINGLE,
            name: 'exposureFrequencyId',
            placeholder: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY',
            description: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.relationship.visibleMandatoryKey,
              field: 'exposureFrequencyId'
            },
            value: {
              get: () => relationship.exposureFrequencyId,
              set: () => {}
            },
            options: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.exposureFrequency as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              relationship.exposureFrequencyId
            )
          }, {
            type: QuickEditorV2InputType.SELECT_SINGLE,
            name: 'exposureDurationId',
            placeholder: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION',
            description: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.relationship.visibleMandatoryKey,
              field: 'exposureDurationId'
            },
            value: {
              get: () => relationship.exposureDurationId,
              set: () => {}
            },
            options: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.exposureDuration as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              relationship.exposureDurationId
            )
          }, {
            type: QuickEditorV2InputType.SELECT_SINGLE,
            name: 'socialRelationshipTypeId',
            placeholder: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION',
            description: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.relationship.visibleMandatoryKey,
              field: 'socialRelationshipTypeId'
            },
            value: {
              get: () => relationship.socialRelationshipTypeId,
              set: () => {}
            },
            options: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.contextOfTransmission as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              relationship.socialRelationshipTypeId
            )
          }, {
            type: QuickEditorV2InputType.SELECT_SINGLE,
            name: 'clusterId',
            placeholder: 'LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER',
            description: 'LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.relationship.visibleMandatoryKey,
              field: 'clusterId'
            },
            value: {
              get: () => relationship.clusterId,
              set: () => {}
            },
            options: [],
            optionsLoad: (finished) => {
              // retrieve only what is needed
              const qb: RequestQueryBuilder = new RequestQueryBuilder();
              qb.fields(
                'id',
                'name'
              );

              // sort them
              qb.sort
                .by('name', RequestSortDirection.ASC);

              // retrieve clusters
              this.clusterDataService
                .getClusterList(
                  this.selectedOutbreak.id,
                  qb
                )
                .pipe(
                  catchError((err) => {
                    this.personAndRelatedHelperService.toastV2Service.error(err);
                    return throwError(err);
                  })
                )
                .subscribe((clusters) => {
                  finished(clusters.map((cluster) => ({
                    label: cluster.name,
                    value: cluster.id
                  })));
                });
            }
          }, {
            type: QuickEditorV2InputType.TEXT,
            name: 'socialRelationshipDetail',
            placeholder: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP',
            description: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATIONSHIP_DESCRIPTION',
            visibleMandatory: {
              key: this.personAndRelatedHelperService.relationship.visibleMandatoryKey,
              field: 'socialRelationshipDetail'
            },
            value: {
              get: () => relationship.socialRelationshipDetail,
              set: () => {}
            }
          }
        ]
      }
    ];
  }

  /**
   * Retrieve quick editor definition
   */
  private retrieveQuickInputDefinition(
    item: CaseModel | ContactModel | EventModel | ContactOfContactModel | RelationshipModel
  ): IQuickEditorV2Section<QuickEditorV2InputToVisibleMandatoryConf>[] {
    // generate sections
    let sections: IQuickEditorV2Section<QuickEditorV2InputToVisibleMandatoryConf>[];
    if (item instanceof RelationshipModel) {
      sections = this.retrieveQuickInputRelationshipDefinition(item as RelationshipModel);
    } else {
      switch (item.type) {
        case EntityType.CASE:
          sections = this.retrieveQuickInputCaseDefinition(item as CaseModel);
          break;

        case EntityType.CONTACT:
          sections = this.retrieveQuickInputContactDefinition(item as ContactModel);
          break;

        case EntityType.EVENT:
          sections = this.retrieveQuickInputEventDefinition(item as EventModel);
          break;

        case EntityType.CONTACT_OF_CONTACT:
          sections = this.retrieveQuickInputContactOfContactDefinition(item as ContactOfContactModel);
          break;
      }
    }

    // finished
    return sections;
  }

  /**
   * Retrieve quick editor handlers
   */
  retrieveQuickInputHandlers(
    item: CaseModel | ContactModel | EventModel | ContactOfContactModel | RelationshipModel
  ): IQuickEditorV2Handlers<CaseModel | ContactModel | EventModel | ContactOfContactModel | RelationshipModel, QuickEditorV2InputToVisibleMandatoryConf> {
    // do we already have definitions ?
    if (this._quickEditorDefinition?.id === item.id) {
      return this._quickEditorDefinition.handlers;
    }

    // initialize
    if (item instanceof RelationshipModel) {
      // relationship
      const sourcePerson = _.find(this.selectedRelationship.persons, (person) => person.source === true);
      this._quickEditorDefinition = {
        id: item.id,
        handlers: {
          record$: this.personAndRelatedHelperService.relationship.relationshipDataService.getEntityRelationship(
            this.selectedOutbreak.id,
            sourcePerson.type,
            sourcePerson.id,
            item.id
          ),
          definitions: (data) => {
            return this.retrieveQuickInputDefinition(data);
          }
        }
      };
    } else {
      // case / contact / contact of contact / event
      this._quickEditorDefinition = {
        id: item.id,
        handlers: {
          record$: this.entityDataService.getEntity(
            item.type,
            this.selectedOutbreak.id,
            item.id
          ),
          definitions: (data) => {
            return this.retrieveQuickInputDefinition(data);
          }
        }
      };
    }

    // finished
    return this._quickEditorDefinition.handlers;
  }
}
