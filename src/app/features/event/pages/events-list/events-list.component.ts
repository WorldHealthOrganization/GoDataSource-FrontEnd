import { Component, OnDestroy, OnInit } from '@angular/core';
import { Params, Router } from '@angular/router';
import * as _ from 'lodash';
import { Observable, throwError } from 'rxjs';
import { Subscription } from 'rxjs/internal/Subscription';
import { catchError, share, takeUntil, tap } from 'rxjs/operators';

import { ListComponent } from '../../../../core/helperClasses/list-component';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder/request-query-builder';
import { moment } from '../../../../core/helperClasses/x-moment';
import { AddressModel } from '../../../../core/models/address.model';
import { ApplyListFilter, Constants } from '../../../../core/models/constants';
import { ContactModel } from '../../../../core/models/contact.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { EntityType } from '../../../../core/models/entity-type';
import { EventModel } from '../../../../core/models/event.model';
import {
  ExportFieldsGroupModelNameEnum,
  IExportFieldsGroupRequired,
} from '../../../../core/models/export-fields-group.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { EventDataService } from '../../../../core/services/data/event.data.service';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { EntityHelperService } from '../../../../core/services/helper/entity-helper.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import {
  ExportDataMethod,
  IV2ExportDataConfigGroupsRequired,
} from '../../../../core/services/helper/models/dialog-v2.model';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { DialogAnswerButton, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import {
  IV2BottomDialogConfigButtonType,
} from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { IV2BreadcrumbAction } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import {
  V2SideDialogConfigInputType,
} from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';


@Component({
  selector: 'app-events-list',
  templateUrl: './events-list.component.html',
})
export class EventsListComponent
  extends ListComponent
  implements OnInit, OnDestroy
{
  // breadcrumbs
  // breadcrumbs: BreadcrumbItemModel[] = [
  //   new BreadcrumbItemModel('LNG_PAGE_LIST_EVENTS_TITLE', '.', true)
  // ];

  // constants
  EventModel = EventModel;
  RelationshipModel = RelationshipModel;
  OutbreakModel = OutbreakModel;
  UserModel = UserModel;

  // FIXME: should be deleted if it's not sent as input to app-list-table-v2
  // address model needed for filters
  filterAddressModel: AddressModel = new AddressModel({
    geoLocationAccurate: null,
  });

  // FIXME: should be deleted if it's not sent as input to app-list-table-v2
  filterAddressParentLocationIds: string[] = [];

  // FIXME: should be deleted if it's not sent as input to app-list-table-v2
  // user list
  userList$: Observable<UserModel[]>;

  // list of export fields groups
  fieldsGroupList: LabelValuePair[];

  // field groups
  private eventFieldGroups: ILabelValuePairModel[];
  fieldsGroupListRequired: IExportFieldsGroupRequired;

  // list of export fields groups
  relationshipFieldGroups: LabelValuePair[];
  eventRelationshipFieldGroups: ILabelValuePairModel[];
  relationshipFieldGroupsRequires: IV2ExportDataConfigGroupsRequired;

  // list of existing events
  eventsList$: Observable<EventModel[]>;

  // FIXME: should be deleted if it's not sent as input to app-list-table-v2
  yesNoOptionsList$: Observable<any>;

  // provide constants to template
  Constants = Constants;
  EntityType = EntityType;
  UserSettings = UserSettings;

  outbreakSubscriber: Subscription;

  allowedExportTypes: ExportDataExtension[] = [
    ExportDataExtension.CSV,
    ExportDataExtension.XLS,
    ExportDataExtension.XLSX,
    ExportDataExtension.JSON,
    ExportDataExtension.ODS,
    ExportDataExtension.PDF,
  ];

  exportEventsUrl: string;
  eventsDataExportFileName: string = moment().format('YYYY-MM-DD');

  // event anonymize fields
  private eventAnonymizeFields: ILabelValuePairModel[] = [
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_ID', value: 'id' },
    { label: 'LNG_EVENT_FIELD_LABEL_NAME', value: 'name' },
    { label: 'LNG_EVENT_FIELD_LABEL_DATE', value: 'date' },
    { label: 'LNG_EVENT_FIELD_LABEL_DESCRIPTION', value: 'description' },
    { label: 'LNG_EVENT_FIELD_LABEL_ADDRESS', value: 'address' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_AT', value: 'createdAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_BY', value: 'createdBy' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_AT', value: 'updatedAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_BY', value: 'updatedBy' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED', value: 'deleted' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED_AT', value: 'deletedAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_ON', value: 'createdOn' },
    { label: 'LNG_ENTITY_FIELD_LABEL_TYPE', value: 'type' },
    {
      label: 'LNG_EVENT_FIELD_LABEL_NUMBER_OF_EXPOSURES',
      value: 'numberOfExposures',
    },
    {
      label: 'LNG_EVENT_FIELD_LABEL_NUMBER_OF_CONTACTS',
      value: 'numberOfContacts',
    },
    {
      label: 'LNG_EVENT_FIELD_LABEL_DATE_OF_REPORTING',
      value: 'dateOfReporting',
    },
    {
      label: 'LNG_EVENT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
      value: 'isDateOfReportingApproximate',
    },
    {
      label: 'LNG_EVENT_FIELD_LABEL_RESPONSIBLE_USER_ID',
      value: 'responsibleUserId',
    },
  ];

  anonymizeFields: LabelValuePair[] = [
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_ID', 'id'),
    new LabelValuePair('LNG_EVENT_FIELD_LABEL_NAME', 'name'),
    new LabelValuePair('LNG_EVENT_FIELD_LABEL_DATE', 'date'),
    new LabelValuePair('LNG_EVENT_FIELD_LABEL_DESCRIPTION', 'description'),
    new LabelValuePair('LNG_EVENT_FIELD_LABEL_ADDRESS', 'address'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_CREATED_AT', 'createdAt'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_CREATED_BY', 'createdBy'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_AT', 'updatedAt'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_BY', 'updatedBy'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_DELETED', 'deleted'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_DELETED_AT', 'deletedAt'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_CREATED_ON', 'createdOn'),
    new LabelValuePair('LNG_ENTITY_FIELD_LABEL_TYPE', 'type'),
    new LabelValuePair(
      'LNG_EVENT_FIELD_LABEL_NUMBER_OF_EXPOSURES',
      'numberOfExposures'
    ),
    new LabelValuePair(
      'LNG_EVENT_FIELD_LABEL_NUMBER_OF_CONTACTS',
      'numberOfContacts'
    ),
    new LabelValuePair(
      'LNG_EVENT_FIELD_LABEL_DATE_OF_REPORTING',
      'dateOfReporting'
    ),
    new LabelValuePair(
      'LNG_EVENT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
      'isDateOfReportingApproximate'
    ),
    new LabelValuePair(
      'LNG_EVENT_FIELD_LABEL_RESPONSIBLE_USER_ID',
      'responsibleUserId'
    ),
  ];

  // relationship anonymize fields
  relationshipAnonymizeFields: LabelValuePair[] = [
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_ID', 'id'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_SOURCE', 'sourcePerson'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_TARGET', 'targetPerson'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_DATE_OF_FIRST_CONTACT', 'dateOfFirstContact'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE', 'contactDate'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_ESTIMATED', 'contactDateEstimated'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL', 'certaintyLevelId'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE', 'exposureTypeId'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY', 'exposureFrequencyId'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION', 'exposureDurationId'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_RELATION', 'socialRelationshipTypeId'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_RELATION_DETAIL', 'socialRelationshipDetail'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER', 'clusterId'),
    new LabelValuePair('LNG_RELATIONSHIP_FIELD_LABEL_COMMENT', 'comment'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_CREATED_AT', 'createdAt'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_CREATED_BY', 'createdBy'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_AT', 'updatedAt'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_BY', 'updatedBy'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_DELETED', 'deleted'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_DELETED_AT', 'deletedAt'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_CREATED_ON', 'createdOn')
  ];

  eventRelationshipAnonymizeFields: ILabelValuePairModel[] = [
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_ID',  value: 'id'},
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_SOURCE', value:  'sourcePerson'},
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_TARGET', value:  'targetPerson'},
    { label:
      'LNG_RELATIONSHIP_FIELD_LABEL_DATE_OF_FIRST_CONTACT', value:
      'dateOfFirstContact'
    },
    { label:
      'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE', value:
      'contactDate'
    },
    { label:
      'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_ESTIMATED', value:
      'contactDateEstimated'
    },
    { label:
      'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL', value:
      'certaintyLevelId'
    },
    { label:
      'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE', value:
      'exposureTypeId'
    },
    { label:
      'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY', value:
      'exposureFrequencyId'
    },
    { label:
      'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION', value:
      'exposureDurationId'
    },
    { label:
      'LNG_RELATIONSHIP_FIELD_LABEL_RELATION', value:
      'socialRelationshipTypeId'
    },
    { label:
      'LNG_RELATIONSHIP_FIELD_LABEL_RELATION_DETAIL', value:
      'socialRelationshipDetail'
    },
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER', value:  'clusterId'},
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_COMMENT', value:  'comment'},
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_AT', value:  'createdAt'},
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_BY', value:  'createdBy'},
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_AT', value:  'updatedAt'},
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_BY', value:  'updatedBy'},
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED', value:  'deleted'},
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED_AT', value:  'deletedAt'},
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_ON', value:  'createdOn'},
  ];

  recordActions: HoverRowAction[] = [
    // View Event
    new HoverRowAction({
      icon: 'visibility',
      iconTooltip: 'LNG_PAGE_LIST_EVENTS_ACTION_VIEW_EVENT',
      linkGenerator: (item: EventModel): string[] => {
        return ['/events', item.id, 'view'];
      },
      visible: (item: EventModel): boolean => {
        return !item.deleted && EventModel.canView(this.authUser);
      },
    }),

    // Modify Event
    new HoverRowAction({
      icon: 'settings',
      iconTooltip: 'LNG_PAGE_LIST_EVENTS_ACTION_MODIFY_EVENT',
      linkGenerator: (item: EventModel): string[] => {
        return ['/events', item.id, 'modify'];
      },
      visible: (item: EventModel): boolean => {
        return (
          !item.deleted &&
          this.authUser &&
          this.selectedOutbreak &&
          this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
          EventModel.canModify(this.authUser)
        );
      },
    }),

    // Other actions
    new HoverRowAction({
      type: HoverRowActionType.MENU,
      icon: 'moreVertical',
      menuOptions: [
        // Delete Event
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_EVENTS_ACTION_DELETE_EVENT',
          click: (item: EventModel) => {
            this.deleteEvent(item);
          },
          visible: (item: EventModel): boolean => {
            return (
              !item.deleted &&
              this.authUser &&
              this.selectedOutbreak &&
              this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
              EventModel.canDelete(this.authUser)
            );
          },
          class: 'mat-menu-item-delete',
        }),

        // Divider
        new HoverRowAction({
          type: HoverRowActionType.DIVIDER,
          visible: (item: EventModel): boolean => {
            // visible only if at least one of the previous...
            return (
              !item.deleted &&
              this.authUser &&
              this.selectedOutbreak &&
              this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
              EventModel.canDelete(this.authUser)
            );
          },
        }),

        // Add Contact to Event
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_ACTION_ADD_CONTACT',
          click: (item: EventModel) => {
            this.router.navigate(['/contacts', 'create'], {
              queryParams: {
                entityType: EntityType.EVENT,
                entityId: item.id,
              },
            });
          },
          visible: (item: EventModel): boolean => {
            return (
              !item.deleted &&
              this.authUser &&
              this.selectedOutbreak &&
              this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
              ContactModel.canCreate(this.authUser) &&
              EventModel.canCreateContact(this.authUser)
            );
          },
        }),

        // Bulk add contacts to event
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_ACTION_BULK_ADD_CONTACTS',
          click: (item: EventModel) => {
            this.router.navigate(['/contacts', 'create-bulk'], {
              queryParams: {
                entityType: EntityType.EVENT,
                entityId: item.id,
              },
            });
          },
          visible: (item: EventModel): boolean => {
            return (
              !item.deleted &&
              this.authUser &&
              this.selectedOutbreak &&
              this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
              ContactModel.canBulkCreate(this.authUser) &&
              EventModel.canBulkCreateContact(this.authUser)
            );
          },
        }),

        // Divider
        new HoverRowAction({
          type: HoverRowActionType.DIVIDER,
          visible: (item: EventModel): boolean => {
            // visible only if at least one of the previous...
            return (
              !item.deleted &&
              this.authUser &&
              this.selectedOutbreak &&
              this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
              ((ContactModel.canCreate(this.authUser) &&
                EventModel.canCreateContact(this.authUser)) ||
                (ContactModel.canBulkCreate(this.authUser) &&
                  EventModel.canBulkCreateContact(this.authUser)))
            );
          },
        }),

        // See event contacts..
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_ACTION_SEE_EXPOSURES_FROM',
          click: (item: EventModel) => {
            this.router.navigate([
              '/relationships',
              EntityType.EVENT,
              item.id,
              'contacts',
            ]);
          },
          visible: (item: EventModel): boolean => {
            return (
              !item.deleted &&
              RelationshipModel.canList(this.authUser) &&
              EventModel.canListRelationshipContacts(this.authUser)
            );
          },
        }),

        // See event exposures
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_ACTION_SEE_EXPOSURES_TO',
          click: (item: EventModel) => {
            this.router.navigate([
              '/relationships',
              EntityType.EVENT,
              item.id,
              'exposures',
            ]);
          },
          visible: (item: EventModel): boolean => {
            return (
              !item.deleted &&
              RelationshipModel.canList(this.authUser) &&
              EventModel.canListRelationshipExposures(this.authUser)
            );
          },
        }),

        // Restore a deleted event
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_EVENTS_ACTION_RESTORE_EVENT',
          click: (item: EventModel) => {
            this.restoreEvent(item);
          },
          visible: (item: EventModel): boolean => {
            return (
              item.deleted &&
              this.authUser &&
              this.selectedOutbreak &&
              this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
              EventModel.canRestore(this.authUser)
            );
          },
          class: 'mat-menu-item-restore',
        }),
      ],
    }),
  ];

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private router: Router,
    private eventDataService: EventDataService,
    private outbreakDataService: OutbreakDataService,
    private toastV2Service: ToastV2Service,
    private dialogService: DialogService,
    private genericDataService: GenericDataService,
    private i18nService: I18nService,
    private userDataService: UserDataService,
    private redirectService: RedirectService,
    private entityHelperService: EntityHelperService,
    private dialogV2Service: DialogV2Service
  ) {
    super(listHelperService);
  }

  /**
   * Component initialized
   */
  ngOnInit() {
    // add page title
    this.eventsDataExportFileName =
      this.i18nService.instant('LNG_PAGE_LIST_EVENTS_TITLE') +
      ' - ' +
      this.eventsDataExportFileName;

    this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();

    // retrieve users
    this.userList$ = this.userDataService.getUsersListSorted().pipe(share());

    // subscribe to the Selected Outbreak
    this.outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        this.selectedOutbreak = selectedOutbreak;

        // export cases url
        this.exportEventsUrl = null;
        if (this.selectedOutbreak && this.selectedOutbreak.id) {
          this.exportEventsUrl = `/outbreaks/${this.selectedOutbreak.id}/events/export`;
        }

        // initialize pagination
        this.initPaginator();
        // ...and re-load the list when the Selected Outbreak is changed
        this.needsRefreshList(true);
      });

    // retrieve the list of export fields groups for model
    this.outbreakDataService
      .getExportFieldsGroups(ExportFieldsGroupModelNameEnum.EVENT)
      .subscribe((fieldsGroupList) => {
        this.eventFieldGroups = fieldsGroupList.options.map((item) => ({
          label: item.name,
          value: item.name,
        }));

        this.fieldsGroupListRequired = fieldsGroupList.toRequiredList();
      });

    // retrieve the list of export fields groups for relationships
    this.outbreakDataService
      .getExportFieldsGroups(ExportFieldsGroupModelNameEnum.RELATIONSHIP)
      .subscribe((fieldsGroupList) => {
        this.eventRelationshipFieldGroups = fieldsGroupList.options.map((item) => ({
          label: item.name,
          value: item.name
        }));

        this.relationshipFieldGroupsRequires =
          fieldsGroupList.toRequiredList();
      });

    // initialize Side Table Columns
    this.initializeTableColumns();

    this.initTableColumns();

    this.initQuickActions();

    this.initializeAddAction();
  }

  /**
   * Release resources
   */
  ngOnDestroy() {
    // release parent resources
    super.ngOnDestroy();

    // outbreak subscriber
    if (this.outbreakSubscriber) {
      this.outbreakSubscriber.unsubscribe();
      this.outbreakSubscriber = null;
    }
  }

  initTableColumns(): void {
    this.tableColumns = [
      {
        field: 'name',
        label: 'LNG_EVENT_FIELD_LABEL_NAME',
        pinned: IV2ColumnPinned.LEFT,
      },
      {
        field: 'date',
        label: 'LNG_EVENT_FIELD_LABEL_DATE',
        format: {
          type: V2ColumnFormat.DATE,
        },
      },
      {
        field: 'description',
        label: 'LNG_EVENT_FIELD_LABEL_DESCRIPTION',
      },
      {
        field: 'phoneNumber',
        label: 'LNG_EVENT_FIELD_LABEL_PHONE_NUMBER',
        notVisible: true,
      },
      {
        field: 'address.emailAddress',
        label: 'LNG_EVENT_FIELD_LABEL_EMAIL',
        notVisible: true,
      },
      {
        field: 'responsibleUserId',
        label: 'LNG_EVENT_FIELD_LABEL_RESPONSIBLE_USER_ID',
        notVisible: true,
        exclude: (): boolean => {
          return !UserModel.canList(this.authUser);
        },
        link: (data) => {
          return data.responsibleUserId
            ? `/users/${data.responsibleUserId}/view`
            : undefined;
        },
      },
    ];

    // number of contacts & exposures columns should be visible only on pages where we have relationships
    // for cases without relationships we don't need these columns
    if (
      this.appliedListFilter !==
      Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_RELATIONSHIPS
    ) {
      this.tableColumns.push(
        {
          field: 'numberOfContacts',
          label: 'LNG_EVENT_FIELD_LABEL_NUMBER_OF_CONTACTS',
          format: {
            type: V2ColumnFormat.BUTTON,
          },
          cssCellClass: 'gd-cell-button',
          buttonLabel: (item) =>
            (item.numberOfContacts || '').toLocaleString('en'),
          color: 'text',
          click: (item) => {
            // if we do not have contacts return
            if (item.numberOfContacts < 1) {
              return;
            }

            // display dialog
            this.entityHelperService.contacts(this.selectedOutbreak, item);
          },
          disabled: (data) =>
            !RelationshipModel.canList(this.authUser) ||
            !data.canListRelationshipContacts(this.authUser),
        },
        {
          field: 'numberOfExposures',
          label: 'LNG_EVENT_FIELD_LABEL_NUMBER_OF_EXPOSURES',
          format: {
            type: V2ColumnFormat.BUTTON,
          },
          cssCellClass: 'gd-cell-button',
          buttonLabel: (item) =>
            (item.numberOfExposures || '').toLocaleString('en'),
          color: 'text',
          click: (item) => {
            // if we do not have exposures return
            if (item.numberOfExposures < 1) {
              return;
            }

            // display dialog
            this.entityHelperService.exposures(this.selectedOutbreak, item);
          },
          disabled: (data) =>
            !RelationshipModel.canList(this.authUser) ||
            !data.canListRelationshipExposures(this.authUser),
        }
      );
    }

    this.tableColumns.push(
      {
        field: 'deleted',
        label: 'LNG_EVENT_FIELD_LABEL_DELETED',
      },
      {
        field: 'createdBy',
        label: 'LNG_EVENT_FIELD_LABEL_CREATED_BY',
        notVisible: true,
        format: {
          type: V2ColumnFormat.BOOLEAN,
        },
      },
      {
        field: 'createdAt',
        label: 'LNG_EVENT_FIELD_LABEL_CREATED_AT',
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATETIME,
        },
      },
      {
        field: 'updatedBy',
        label: 'LNG_EVENT_FIELD_LABEL_UPDATED_BY',
        notVisible: true,
        format: {
          type: 'updatedByUser.name',
        },
        link: (data) => {
          return data.updatedBy ? `/users/${data.updatedBy}/view` : undefined;
        },
      },
      {
        field: 'updatedAt',
        label: 'LNG_EVENT_FIELD_LABEL_UPDATED_AT',
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATETIME,
        },
      },
      {
        field: 'location',
        label: 'LNG_ADDRESS_FIELD_LABEL_LOCATION',
        notVisible: true,
        format: {
          type: 'mainAddress.location.name',
        },
        link: (data) => {
          return data.mainAddress?.location?.name
            ? `/locations/${data.mainAddress.location.id}/view`
            : undefined;
        },
      },
      {
        field: 'address.addressLine1',
        label: 'LNG_ADDRESS_FIELD_LABEL_ADDRESS_LINE_1',
        notVisible: true,
        format: {
          type: 'mainAddress.addressLine1',
        },
      },
      {
        field: 'address.city',
        label: 'LNG_ADDRESS_FIELD_LABEL_CITY',
        notVisible: true,
        format: {
          type: 'mainAddress.city',
        },
      },
      {
        field: 'addresses.geoLocation.lat',
        label: 'LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LAT',
        notVisible: true,
        format: {
          type: 'mainAddress.geoLocation.lat',
        },
      },
      {
        field: 'addresses.geoLocation.lng',
        label: 'LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LNG',
        notVisible: true,
        format: {
          type: 'mainAddress.geoLocation.lng',
        },
      },
      {
        field: 'addresses.postalCode',
        label: 'LNG_ADDRESS_FIELD_LABEL_POSTAL_CODE',
        notVisible: true,
        format: {
          type: 'mainAddress.postalCode',
        },
      },
      {
        field: 'addresses.geoLocationAccurate',
        label: 'LNG_ADDRESS_FIELD_LABEL_ADDRESS_GEO_LOCATION_ACCURATE',
        notVisible: true,
        format: {
          type: V2ColumnFormat.BOOLEAN,
          field: 'mainAddress.geoLocationAccurate',
        },
      },

      // actions
      {
        field: 'actions',
        label: 'LNG_COMMON_LABEL_ACTIONS',
        pinned: IV2ColumnPinned.RIGHT,
        notResizable: true,
        cssCellClass: 'gd-cell-no-focus',
        format: {
          type: V2ColumnFormat.ACTIONS,
        },
        actions: [
          // View Event
          {
            type: V2ActionType.ICON,
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_CASES_ACTION_VIEW_CASE',
            action: {
              link: (data: EventModel): string[] => {
                return ['/events', data.id, 'view'];
              },
            },
            visible: (item: EventModel): boolean => {
              return !item.deleted && EventModel.canView(this.authUser);
            },
          },

          // Modify Case
          {
            type: V2ActionType.ICON,
            icon: 'edit',
            iconTooltip: 'LNG_PAGE_LIST_CASES_ACTION_MODIFY_CASE',
            action: {
              link: (item: EventModel): string[] => {
                return ['/events', item.id, 'modify'];
              },
            },
            visible: (item: EventModel): boolean => {
              return (
                !item.deleted &&
                this.selectedOutbreakIsActive &&
                EventModel.canModify(this.authUser)
              );
            },
          },

          // Other actions
          {
            type: V2ActionType.MENU,
            icon: 'more_horiz',
            menuOptions: [
              // Delete Event
              {
                label: 'LNG_PAGE_LIST_EVENTS_ACTION_DELETE_EVENT',
                cssClasses: 'gd-list-table-actions-action-menu-warning',
                action: {
                  click: (item: EventModel): void => {
                    // data
                    const message: {
                      get: string;
                      data?: {
                        name: string;
                      };
                    } = {
                      get: '',
                    };

                    // determine what we need to delete
                    this.dialogV2Service
                      .showConfirmDialog({
                        config: {
                          title: {
                            get: () => 'LNG_COMMON_LABEL_DELETE',
                            data: () => ({
                              name: item.name,
                            }),
                          },
                          message: {
                            get: () => message.get,
                            data: () => message.data,
                          },
                        },
                        initialized: (handler) => {
                          // display loading
                          handler.loading.show();

                          // set message data
                          message.data = {
                            name: item.name,
                          };

                          // determine message label
                          message.get = 'LNG_DIALOG_CONFIRM_DELETE_EVENT';

                          // hide loading
                          handler.loading.hide();
                        },
                      })
                      .subscribe((response) => {
                        // canceled ?
                        if (
                          response.button.type ===
                          IV2BottomDialogConfigButtonType.CANCEL
                        ) {
                          // finished
                          return;
                        }

                        // show loading
                        const loading =
                          this.dialogV2Service.showLoadingDialog();

                        // delete event
                        this.eventDataService
                          .deleteEvent(this.selectedOutbreak.id, item.id)
                          .pipe(
                            catchError((err) => {
                              this.toastV2Service.error(err);
                              return throwError(err);
                            })
                          )
                          .subscribe(() => {
                            this.toastV2Service.success(
                              'LNG_PAGE_LIST_EVENTS_ACTION_DELETE_SUCCESS_MESSAGE'
                            );

                            // hide loading
                            loading.close();

                            // reload data
                            this.needsRefreshList(true);
                          });
                      });
                  },
                },
                visible: (item: EventModel): boolean => {
                  return (
                    !item.deleted &&
                    this.selectedOutbreakIsActive &&
                    EventModel.canDelete(this.authUser)
                  );
                },
              },

              // Divider
              {
                visible: (item: EventModel): boolean => {
                  // visible only if at least one of the first two items is visible
                  return (
                    !item.deleted &&
                    this.selectedOutbreakIsActive &&
                    EventModel.canDelete(this.authUser)
                  );
                },
              },

              // Add Contact to Event
              {
                label: 'LNG_PAGE_ACTION_ADD_CONTACT',
                action: {
                  link: (): string[] => {
                    return ['/contacts', 'create'];
                  },
                  linkQueryParams: (item: EventModel): Params => {
                    return {
                      entityType: EntityType.EVENT,
                      entityId: item.id,
                    };
                  },
                },
                visible: (item: EventModel): boolean => {
                  return (
                    !item.deleted &&
                    this.selectedOutbreakIsActive &&
                    ContactModel.canCreate(this.authUser) &&
                    EventModel.canCreateContact(this.authUser)
                  );
                },
              },

              // Bulk add contacts to case
              {
                label: 'LNG_PAGE_ACTION_BULK_ADD_CONTACTS',
                action: {
                  link: (): string[] => {
                    return ['/contacts', 'create-bulk'];
                  },
                  linkQueryParams: (item: EventModel): Params => {
                    return {
                      entityType: EntityType.EVENT,
                      entityId: item.id,
                    };
                  },
                },
                visible: (item: EventModel): boolean => {
                  return (
                    !item.deleted &&
                    this.selectedOutbreakIsActive &&
                    ContactModel.canBulkCreate(this.authUser) &&
                    EventModel.canBulkCreateContact(this.authUser)
                  );
                },
              },

              // Divider
              {
                visible: (item: EventModel): boolean => {
                  // visible only if at least one of the previous two items is visible
                  return (
                    !item.deleted &&
                    this.selectedOutbreakIsActive &&
                    ((ContactModel.canCreate(this.authUser) &&
                      EventModel.canCreateContact(this.authUser)) ||
                      (ContactModel.canBulkCreate(this.authUser) &&
                        EventModel.canBulkCreateContact(this.authUser)))
                  );
                },
              },

              // See event contacts
              {
                label: 'LNG_PAGE_ACTION_SEE_EXPOSURES_FROM',
                action: {
                  link: (item: EventModel): string[] => {
                    return [
                      '/relationships',
                      EntityType.EVENT,
                      item.id,
                      'contacts',
                    ];
                  },
                },
                visible: (item: EventModel): boolean => {
                  return (
                    !item.deleted &&
                    RelationshipModel.canList(this.authUser) &&
                    EventModel.canListRelationshipContacts(this.authUser)
                  );
                },
              },

              // See event exposures
              {
                label: 'LNG_PAGE_ACTION_SEE_EXPOSURES_TO',
                action: {
                  link: (item: EventModel): string[] => {
                    return [
                      '/relationships',
                      EntityType.EVENT,
                      item.id,
                      'exposures',
                    ];
                  },
                },
                visible: (item: EventModel): boolean => {
                  return (
                    !item.deleted &&
                    RelationshipModel.canList(this.authUser) &&
                    EventModel.canListRelationshipExposures(this.authUser)
                  );
                },
              },

              // Restore a deleted event
              {
                label: 'LNG_PAGE_LIST_EVENTS_ACTION_RESTORE_EVENT',
                cssClasses: 'gd-list-table-actions-action-menu-warning',
                action: {
                  click: (item: EventModel) => {
                    // show confirm dialog to confirm the action
                    this.dialogV2Service
                      .showConfirmDialog({
                        config: {
                          title: {
                            get: () => 'LNG_COMMON_LABEL_RESTORE',
                            data: () => item as any,
                          },
                          message: {
                            get: () => 'LNG_DIALOG_CONFIRM_RESTORE_EVENT',
                            data: () => item as any,
                          },
                        },
                      })
                      .subscribe((response) => {
                        // canceled ?
                        if (
                          response.button.type ===
                          IV2BottomDialogConfigButtonType.CANCEL
                        ) {
                          // finished
                          return;
                        }

                        // show loading
                        const loading =
                          this.dialogV2Service.showLoadingDialog();

                        // convert
                        this.eventDataService
                          .restoreEvent(this.selectedOutbreak.id, item.id)
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
                            this.toastV2Service.success(
                              'LNG_PAGE_LIST_EVENTS_ACTION_RESTORE_SUCCESS_MESSAGE'
                            );

                            // hide loading
                            loading.close();

                            // reload data
                            this.needsRefreshList(true);
                          });
                      });
                  },
                },
                visible: (item: EventModel): boolean => {
                  return (
                    item.deleted &&
                    this.selectedOutbreakIsActive &&
                    EventModel.canRestore(this.authUser)
                  );
                },
              },
            ],
          },
        ],
      }
    );
  }

  initQuickActions(): void {
    this.quickActions = {
      type: V2ActionType.MENU,
      label: 'LNG_COMMON_BUTTON_QUICK_ACTIONS',
      visible: (): boolean => {
        return (
          EventModel.canListPersonsWithoutRelationships(this.authUser) ||
          EventModel.canExport(this.authUser) ||
          EventModel.canImport(this.authUser) ||
          EventModel.canExportRelationships(this.authUser)
        );
      },
      menuOptions: [
        // No relationships
        {
          label: 'LNG_PAGE_LIST_EVENTS_ACTION_NO_RELATIONSHIPS_BUTTON',
          action: this.redirectService.linkAndQueryParams(['/events'], {
            applyListFilter:
              Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_RELATIONSHIPS,
          }),
          visible: (): boolean => {
            return (
              EventModel.canListPersonsWithoutRelationships(this.authUser) &&
              this.appliedListFilter !==
                Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_RELATIONSHIPS
            );
          },
        },

        // Divider
        {
          visible: (): boolean => {
            return (
              EventModel.canListPersonsWithoutRelationships(this.authUser) &&
              this.appliedListFilter !==
                Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_RELATIONSHIPS
            );
          },
        },

        // Export events
        {
          label: 'LNG_PAGE_LIST_EVENTS_EXPORT_BUTTON',
          action: {
            click: () => {
              this.dialogV2Service.showExportData({
                title: {
                  get: () => 'LNG_PAGE_LIST_EVENTS_EXPORT_TITLE',
                },
                export: {
                  url: `/outbreaks/${this.selectedOutbreak.id}/events/export`,
                  async: true,
                  method: ExportDataMethod.GET,
                  fileName: `${this.i18nService.instant(
                    'LNG_PAGE_LIST_EVENTS_TITLE'
                  )} - ${moment().format('YYYY-MM-DD')}`,
                  queryBuilder: this.queryBuilder,
                  allow: {
                    types: [
                      ExportDataExtension.CSV,
                      ExportDataExtension.XLS,
                      ExportDataExtension.XLSX,
                      ExportDataExtension.JSON,
                      ExportDataExtension.ODS,
                      ExportDataExtension.PDF,
                    ],
                    encrypt: true,
                    anonymize: {
                      fields: this.eventAnonymizeFields,
                    },
                    groups: {
                      fields: this.eventFieldGroups,
                      required: this.fieldsGroupListRequired,
                    },
                    dbColumns: true,
                    dbValues: true,
                    jsonReplaceUndefinedWithNull: true,
                    questionnaireVariables: true,
                  },
                  inputs: {
                    append: [
                      {
                        type: V2SideDialogConfigInputType.CHECKBOX,
                        placeholder:
                          'LNG_PAGE_LIST_EVENTS_EXPORT_CONTACT_INFORMATION',
                        tooltip:
                          'LNG_PAGE_LIST_EVENTS_EXPORT_CONTACT_INFORMATION_DESCRIPTION',
                        name: 'includeContactFields',
                        checked: false,
                      },
                    ],
                  },
                },
              });
            },
          },
          visible: (): boolean => {
            return EventModel.canExport(this.authUser);
          },
        },

        // Import events
        {
          label: 'LNG_PAGE_LIST_EVENTS_IMPORT_BUTTON',
          action: {
            link: () => ['/import-export-data', 'event-data', 'import'],
          },
          visible: (): boolean => {
            return (
              this.selectedOutbreakIsActive &&
              EventModel.canImport(this.authUser)
            );
          },
        },

        // Divider
        {
          visible: (): boolean => {
            return (
              EventModel.canExport(this.authUser) ||
              EventModel.canImport(this.authUser)
            );
          },
        },


        // Export relationships
        {
          label: 'LNG_PAGE_LIST_EVENTS_ACTION_EXPORT_EVENTS_RELATIONSHIPS',
          action: {
            click: () => {
              // construct filter by case query builder
              const qb = new RequestQueryBuilder();

              // retrieve only relationships that have at least one persons as desired type
              qb.filter.byEquality(
                'persons.type',
                EntityType.EVENT
              );

              // merge out query builder
              const personsQb = qb.addChildQueryBuilder('person');
              personsQb.merge(this.queryBuilder);

              // remove pagination
              personsQb.paginator.clear();

              // attach condition only if not empty
              if (!personsQb.filter.isEmpty()) {
                // filter only cases
                personsQb.filter.byEquality(
                  'type',
                  EntityType.EVENT
                );
              }

              // export
              this.dialogV2Service.showExportData({
                title: {
                  get: () => 'LNG_PAGE_LIST_EVENT_EXPORT_RELATIONSHIPS_TITLE'
                },
                export: {
                  url: `/outbreaks/${this.selectedOutbreak.id}/relationships/export`,
                  async: true,
                  method: ExportDataMethod.GET,
                  fileName: `${this.i18nService.instant('LNG_PAGE_LIST_EVENTS_EXPORT_RELATIONSHIP_FILE_NAME')} - ${moment().format('YYYY-MM-DD')}`,
                  queryBuilder: qb,
                  allow: {
                    types: [
                      ExportDataExtension.CSV,
                      ExportDataExtension.XLS,
                      ExportDataExtension.XLSX,
                      ExportDataExtension.JSON,
                      ExportDataExtension.ODS,
                      ExportDataExtension.PDF
                    ],
                    encrypt: true,
                    anonymize: {
                      fields: this.eventRelationshipAnonymizeFields
                    },
                    groups: {
                      fields: this.eventRelationshipFieldGroups,
                      required: this.relationshipFieldGroupsRequires
                    },
                    dbColumns: true,
                    dbValues: true,
                    jsonReplaceUndefinedWithNull: true
                  }
                }
              });
            }
          },
          visible: (): boolean => {
            return EventModel.canExportRelationships(this.authUser);
          }
        },

        // Import relationships
        {
          label: 'LNG_PAGE_LIST_EVENTS_ACTION_IMPORT_EVENTS_RELATIONSHIPS',
          action: {
            click: () => {
              this.goToRelationshipImportPage();
            }
          },
          visible: (): boolean => {
            return OutbreakModel.canImportRelationship(this.authUser) &&
                this.selectedOutbreakIsActive;
          }
        }
      ],
    };
  }

  /**
   * Initialize add action
   */
  initializeAddAction(): void {
    this.addAction = {
      type: V2ActionType.ICON_LABEL,
      label: 'LNG_COMMON_BUTTON_ADD',
      icon: 'add_circle_outline',
      action: {
        link: (): string[] => ['/events', 'create']
      },
      visible: (): boolean => {
        return EventModel.canCreate(this.authUser);
      }
    };
  }

  // FIXME: should be deleted if it's not used anymore
  /**
   * Initialize Side Table Columns
   */
  initializeTableColumns() {
    // default table columns
    // this.tableColumns = [
    //   new VisibleColumnModel({
    //     field: 'checkbox',
    //     required: true,
    //     excludeFromSave: true
    //   }),
    //   new VisibleColumnModel({
    //     field: 'name',
    //     label: 'LNG_EVENT_FIELD_LABEL_NAME'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'date',
    //     label: 'LNG_EVENT_FIELD_LABEL_DATE'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'description',
    //     label: 'LNG_EVENT_FIELD_LABEL_DESCRIPTION'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'phoneNumber',
    //     label: 'LNG_EVENT_FIELD_LABEL_PHONE_NUMBER',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'address.emailAddress',
    //     label: 'LNG_EVENT_FIELD_LABEL_EMAIL',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'responsibleUserId',
    //     label: 'LNG_EVENT_FIELD_LABEL_RESPONSIBLE_USER_ID',
    //     visible: false,
    //     excludeFromDisplay: (): boolean => {
    //       return !UserModel.canList(this.authUser);
    //     }
    //   })
    // ];
    //
    // // number of contacts & exposures columns should be visible only on pages where we have relationships
    // // for cases without relationships we don't need these columns
    // if (this.appliedListFilter !== Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_RELATIONSHIPS) {
    //   this.tableColumns.push(
    //     new VisibleColumnModel({
    //       field: 'numberOfContacts',
    //       label: 'LNG_EVENT_FIELD_LABEL_NUMBER_OF_CONTACTS',
    //       visible: false
    //     }),
    //     new VisibleColumnModel({
    //       field: 'numberOfExposures',
    //       label: 'LNG_EVENT_FIELD_LABEL_NUMBER_OF_EXPOSURES',
    //       visible: false
    //     })
    //   );
    // }
    //
    // // rest of columns :)
    // this.tableColumns.push(
    //   new VisibleColumnModel({
    //     field: 'deleted',
    //     label: 'LNG_EVENT_FIELD_LABEL_DELETED'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'createdBy',
    //     label: 'LNG_EVENT_FIELD_LABEL_CREATED_BY',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'createdAt',
    //     label: 'LNG_EVENT_FIELD_LABEL_CREATED_AT',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'updatedBy',
    //     label: 'LNG_EVENT_FIELD_LABEL_UPDATED_BY',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'updatedAt',
    //     label: 'LNG_EVENT_FIELD_LABEL_UPDATED_AT',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'location',
    //     label: 'LNG_ADDRESS_FIELD_LABEL_LOCATION',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'address.addressLine1',
    //     label: 'LNG_ADDRESS_FIELD_LABEL_ADDRESS_LINE_1',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'address.city',
    //     label: 'LNG_ADDRESS_FIELD_LABEL_CITY',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'address.geoLocation.lat',
    //     label: 'LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LAT',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'address.geoLocation.lng',
    //     label: 'LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LNG',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'address.postalCode',
    //     label: 'LNG_ADDRESS_FIELD_LABEL_POSTAL_CODE',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'address.geoLocationAccurate',
    //     label: 'LNG_ADDRESS_FIELD_LABEL_ADDRESS_GEO_LOCATION_ACCURATE',
    //     visible: false
    //   })
    // );
  }

  /**
   * Initialize breadcrumbs
   */
  initializeBreadcrumbs(): void {
    // determine if cases page should be linkable
    let eventsAction: IV2BreadcrumbAction = null;

    // if we have an applied filter then we need to add breadcrumb
    if (
      this.appliedListFilter === ApplyListFilter.EVENTS_WITHOUT_RELATIONSHIPS
    ) {
      // since we need to send user to the same page we need to do some hacks...
      const redirect = this.redirectService.linkAndQueryParams(['/events']);
      eventsAction = {
        link: redirect.link(),
        linkQueryParams: redirect.linkQueryParams(),
      };
    }

    // set breadcrumbs
    this.breadcrumbs = [
      {
        label: 'LNG_COMMON_LABEL_HOME',
        action: {
          link: DashboardModel.canViewDashboard(this.authUser)
            ? ['/dashboard']
            : ['/version'],
        },
      },
      {
        label: 'LNG_PAGE_LIST_EVENTS_TITLE',
        action: eventsAction,
      },
    ];

    // if we have an applied filter then we need to add breadcrumb
    if (
      this.appliedListFilter === ApplyListFilter.CASES_WITHOUT_RELATIONSHIPS
    ) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_DASHBOARD_EVENTS_WITHOUT_RELATIONSHIPS',
        action: null,
      });
    }
  }

  // FIXME: should be deleted if it's not used anymore
  /**
   * Fields retrieved from api to reduce payload size
   */
  refreshListFields(): string[] {
    return [];
  }

  // FIXME: should be deleted if it's not used anymore
  /**
   * Re(load) the Events list
   */
  refreshList(finishCallback: (records: any[]) => void) {
    if (this.selectedOutbreak) {
      // retrieve created user & modified user information
      this.queryBuilder.include('createdByUser', true);
      this.queryBuilder.include('updatedByUser', true);

      // retrieve responsible user information
      this.queryBuilder.include('responsibleUser', true);

      // retrieve location list
      this.queryBuilder.include('location', true);

      // retrieve the list of Events
      this.eventsList$ = this.eventDataService
        .getEventsList(this.selectedOutbreak.id, this.queryBuilder)
        .pipe(
          catchError((err) => {
            this.toastV2Service.error(err);
            finishCallback([]);
            return throwError(err);
          }),
          tap(this.checkEmptyList.bind(this)),
          tap((data: any[]) => {
            finishCallback(data);
          }),

          // should be the last pipe
          takeUntil(this.destroyed$)
        );
    } else {
      finishCallback([]);
    }
  }

  // FIXME: should be deleted if it's not used anymore
  /**
   * Get total number of items, based on the applied filters
   */
  refreshListCount(applyHasMoreLimit?: boolean) {
    if (this.selectedOutbreak) {
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
        countQueryBuilder.flag('applyHasMoreLimit', true);
      }

      // count
      this.eventDataService
        .getEventsCount(this.selectedOutbreak.id, countQueryBuilder)
        .pipe(
          catchError((err) => {
            this.toastV2Service.error(err);
            return throwError(err);
          }),
          // should be the last pipe
          takeUntil(this.destroyed$)
        )
        .subscribe((response) => {
          this.pageCount = response;
        });
    }
  }

  /**
   * Delete specific event from outbreak
   * @param {EventModel} event
   */
  deleteEvent(event: EventModel) {
    // show confirm dialog
    this.dialogService
      .showConfirm('LNG_DIALOG_CONFIRM_DELETE_EVENT', event)
      .subscribe((answer: DialogAnswer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          // delete contact
          this.eventDataService
            .deleteEvent(this.selectedOutbreak.id, event.id)
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err);
                return throwError(err);
              })
            )
            .subscribe(() => {
              this.toastV2Service.success(
                'LNG_PAGE_LIST_EVENTS_ACTION_DELETE_SUCCESS_MESSAGE'
              );

              // reload data
              this.needsRefreshList(true);
            });
        }
      });
  }

  /**
   * Restore an deleted event
   * @param eventModel
   */
  restoreEvent(eventModel: EventModel) {
    // show confirm dialog to confirm the action
    this.dialogService
      .showConfirm(
        'LNG_DIALOG_CONFIRM_RESTORE_EVENT',
        new EventModel(eventModel)
      )
      .subscribe((answer: DialogAnswer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          this.eventDataService
            .restoreEvent(this.selectedOutbreak.id, eventModel.id)
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err);
                return throwError(err);
              })
            )
            .subscribe(() => {
              this.toastV2Service.success(
                'LNG_PAGE_LIST_EVENTS_ACTION_RESTORE_SUCCESS_MESSAGE'
              );
              // reload data
              this.needsRefreshList(true);
            });
        }
      });
  }

  // FIXME: should be deleted if not used anymore
  /**
   * Export selected events
   */
  exportSelectedEvents() {
    // get list of selected ids
    const selectedRecords: false | string[] = this.validateCheckedRecords();
    if (!selectedRecords) {
      return;
    }

    // construct query builder
    const qb = new RequestQueryBuilder();
    qb.filter.bySelect('id', selectedRecords, true, null);

    // display export dialog
    this.dialogService.showExportDialog({
      // required
      message: 'LNG_PAGE_LIST_EVENTS_EXPORT_TITLE',
      url: this.exportEventsUrl,
      fileName: this.eventsDataExportFileName,

      // configure
      isAsyncExport: true,
      displayUseDbColumns: true,
      displayJsonReplaceUndefinedWithNull: true,
      // exportProgress: (data) => { this.showExportProgress(data); },

      // optional
      allowedExportTypes: this.allowedExportTypes,
      queryBuilder: qb,
      displayEncrypt: true,
      displayAnonymize: true,
      displayFieldsGroupList: true,
      displayUseQuestionVariable: false,
      anonymizeFields: this.anonymizeFields,
      fieldsGroupList: this.fieldsGroupList,
      fieldsGroupListRequired: this.fieldsGroupListRequired,
      exportStart: () => {
        this.showLoadingDialog();
      },
      exportFinished: () => {
        this.closeLoadingDialog();
      },
    });
  }

  // FIXME: should be deleted if it's not used anymore
  /**
   * Export relationships for selected events
   */
  exportSelectedEventsRelationship() {
    // get list of selected ids
    const selectedRecords: false | string[] = this.validateCheckedRecords();
    if (!selectedRecords) {
      return;
    }

    // construct query builder
    const qb = new RequestQueryBuilder();
    const personsQb = qb.addChildQueryBuilder('person');

    // id
    personsQb.filter.bySelect('id', selectedRecords, true, null);

    // type
    personsQb.filter.byEquality('type', EntityType.EVENT);

    // display export dialog
    this.dialogService.showExportDialog({
      // required
      message: 'LNG_PAGE_LIST_EVENTS_EXPORT_RELATIONSHIPS_TITLE',
      url: `/outbreaks/${this.selectedOutbreak.id}/relationships/export`,
      fileName: this.i18nService.instant(
        'LNG_PAGE_LIST_EVENTS_EXPORT_RELATIONSHIP_FILE_NAME'
      ),

      // configure
      isAsyncExport: true,
      displayUseDbColumns: true,
      displayJsonReplaceUndefinedWithNull: true,
      // exportProgress: (data) => { this.showExportProgress(data); },

      // optional
      queryBuilder: qb,
      displayEncrypt: true,
      displayAnonymize: true,
      displayFieldsGroupList: true,
      allowedExportTypes: this.allowedExportTypes,
      anonymizeFields: this.relationshipAnonymizeFields,
      fieldsGroupList: this.relationshipFieldGroups,
      fieldsGroupListRequired: this.relationshipFieldGroupsRequires,
      exportStart: () => {
        this.showLoadingDialog();
      },
      exportFinished: () => {
        this.closeLoadingDialog();
      },
    });
  }

  /**
   * Export Event Relationships
   */
  exportFilteredEventsRelationships() {
    // construct filter by case query builder
    const qb = new RequestQueryBuilder();
    const personsQb = qb.addChildQueryBuilder('person');

    // retrieve only relationships that have at least one persons as desired type
    qb.filter.byEquality('persons.type', EntityType.EVENT);

    // merge out query builder
    personsQb.merge(this.queryBuilder);

    // remove pagination
    personsQb.paginator.clear();

    // attach condition only if not empty
    if (!personsQb.filter.isEmpty()) {
      // filter only events
      personsQb.filter.byEquality('type', EntityType.EVENT);
    }

    // display export dialog
    this.dialogService.showExportDialog({
      // required
      message: 'LNG_PAGE_LIST_EVENTS_EXPORT_RELATIONSHIPS_TITLE',
      url: `/outbreaks/${this.selectedOutbreak.id}/relationships/export`,
      fileName: this.i18nService.instant(
        'LNG_PAGE_LIST_EVENTS_EXPORT_RELATIONSHIP_FILE_NAME'
      ),

      // configure
      isAsyncExport: true,
      displayUseDbColumns: true,
      displayJsonReplaceUndefinedWithNull: true,
      // exportProgress: (data) => { this.showExportProgress(data); },

      // optional
      queryBuilder: qb,
      displayEncrypt: true,
      displayAnonymize: true,
      displayFieldsGroupList: true,
      allowedExportTypes: this.allowedExportTypes,
      anonymizeFields: this.relationshipAnonymizeFields,
      fieldsGroupList: this.relationshipFieldGroups,
      fieldsGroupListRequired: this.relationshipFieldGroupsRequires,
      exportStart: () => {
        this.showLoadingDialog();
      },
      exportFinished: () => {
        this.closeLoadingDialog();
      },
    });
  }

  // FIXME: should be deleted if it's not used anymore
  /**
   * Display contacts popup
   */
  displayContacts(entity: EventModel) {
    // if we do not have contacts return
    if (entity.numberOfContacts < 1) {
      return;
    }

    // display dialog
    // this.entityHelperService.displayContacts(
    //   this.selectedOutbreak.id,
    //   entity
    // );
  }

  // FIXME: should be deleted if it's not used anymore
  /**
   * Display exposures popup
   */
  displayExposures(entity: EventModel) {
    // if we do not have any exposure return
    if (entity.numberOfExposures < 1) {
      return;
    }

    // display dialog
    // this.entityHelperService.displayExposures(
    //   this.selectedOutbreak.id,
    //   entity
    // );
  }

  /**
   * Navigate to Events without relationships
   */
  navigateToEventsWithoutRelationships() {
    this.redirectService.to(['/events'], {
      applyListFilter: Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_RELATIONSHIPS,
    });
  }

  /**
   * Redirect to import relationship page
   */
  goToRelationshipImportPage() {
    this.router.navigate(['/import-export-data', 'relationships', 'import'], {
      queryParams: {
        from: Constants.APP_PAGE.EVENTS.value,
      },
    });
  }
}
