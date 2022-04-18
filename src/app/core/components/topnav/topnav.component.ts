import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, HostListener, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { IAppFormIconButtonV2 } from '../../../shared/forms-v2/core/app-form-icon-button-v2';
import { UserModel } from '../../models/user.model';
import { AuthDataService } from '../../services/data/auth.data.service';
import { OutbreakDataService } from '../../services/data/outbreak.data.service';
import { OutbreakModel } from '../../models/outbreak.model';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Subscription } from 'rxjs/internal/Subscription';
import { ILabelValuePairModel } from '../../../shared/forms-v2/core/label-value-pair.model';
import { ToastV2Service } from '../../services/helper/toast-v2.service';
import { DialogV2Service } from '../../services/helper/dialog-v2.service';
import {
  IV2SideDialogConfigButtonType,
  IV2SideDialogConfigInputAccordion,
  IV2SideDialogConfigInputSingleDropdown, IV2SideDialogConfigInputText,
  V2SideDialogConfigInputType
} from '../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { v4 as uuid } from 'uuid';
import { IV2LoadingDialogHandler } from '../../../shared/components-v2/app-loading-dialog-v2/models/loading-dialog-v2.model';
import { determineRenderMode, RenderMode } from '../../enums/render-mode.enum';

@Component({
  selector: 'app-topnav',
  templateUrl: './topnav.component.html',
  styleUrls: ['./topnav.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopnavComponent implements OnInit, OnDestroy {
  // selected outbreak dropdown disabled ?
  private static _REFRESH_CALLBACK: () => void;
  private static _UPDATE_CALLBACK: () => void;
  private static _SELECTED_OUTBREAK_DROPDOWN_DISABLED: boolean = false;
  static set SELECTED_OUTBREAK_DROPDOWN_DISABLED(disabled: boolean) {
    // set value
    TopnavComponent._SELECTED_OUTBREAK_DROPDOWN_DISABLED = disabled;

    // trigger update
    if (TopnavComponent._UPDATE_CALLBACK) {
      TopnavComponent._UPDATE_CALLBACK();
    }
  }

  // global search
  globalSearchValue: string;
  globalSearchSuffixButtons: IAppFormIconButtonV2[] = [
    {
      icon: 'search',
      clickAction: () => {
        this.globalSearch();
      }
    }
  ];

  // constants
  OutbreakModel = OutbreakModel;
  ToastV2Service = ToastV2Service;
  RenderMode = RenderMode;

  // authenticated user
  authUser: UserModel;

  // selected Outbreak
  selectedOutbreak: OutbreakModel = new OutbreakModel();
  get selectedOutbreakDisabled(): boolean {
    return TopnavComponent._SELECTED_OUTBREAK_DROPDOWN_DISABLED;
  }

  // subscriptions
  getSelectedOutbreakSubject: Subscription;
  historyChangedSubscription: Subscription;

  // outbreak list
  outbreakListOptions: ILabelValuePairModel[] = [];
  outbreakListOptionsLoading: boolean = false;

  // loading handler
  private loadingHandler: IV2LoadingDialogHandler;

  // render mode
  renderMode: RenderMode = RenderMode.FULL;

  // show main menu
  @Output() showHoverMenu = new EventEmitter<void>();

  /**
   * Refresh outbreak list
   */
  static REFRESH_OUTBREAK_LIST() {
    // trigger update
    if (TopnavComponent._REFRESH_CALLBACK) {
      TopnavComponent._REFRESH_CALLBACK();
    }
  }

  /**
   * Constructor
   */
  constructor(
    private outbreakDataService: OutbreakDataService,
    private authDataService: AuthDataService,
    private toastV2Service: ToastV2Service,
    private dialogV2Service: DialogV2Service,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    // update render mode
    this.updateRenderMode();

    // set update callback
    TopnavComponent._UPDATE_CALLBACK = () => {
      this.changeDetectorRef.detectChanges();
    };

    // set refresh outbreak callback
    TopnavComponent._REFRESH_CALLBACK = () => {
      this.refreshOutbreaksList();
    };
  }

  /**
   * Component initialized
   */
  ngOnInit(): void {
    // get the authenticated user
    // we need to reload data - since component isn't re-rendered
    this.authUser = this.authDataService.getAuthenticatedUser();

    // get the outbreaks list
    this.refreshOutbreaksList();

    // subscribe to the selected outbreak stream
    this.getSelectedOutbreakSubject = this.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((outbreak: OutbreakModel) => {
        if (outbreak) {
          // update the selected outbreak
          this.selectedOutbreak = outbreak;

          // update ui
          this.changeDetectorRef.detectChanges();
        }
      });

    // subscribe to history changes
    this.historyChangedSubscription = this.toastV2Service.historyChanged
      .subscribe(() => {
        // update ui
        this.changeDetectorRef.detectChanges();
      });
  }

  /**
   * Component destroyed
   */
  ngOnDestroy(): void {
    // release subscription
    if (this.getSelectedOutbreakSubject) {
      this.getSelectedOutbreakSubject.unsubscribe();
      this.getSelectedOutbreakSubject = null;
    }

    // release subscription
    if (this.historyChangedSubscription) {
      this.historyChangedSubscription.unsubscribe();
      this.historyChangedSubscription = null;
    }

    // close loading handler
    this.hideLoading();
  }

  /**
   * Refresh outbreak list
   */
  refreshOutbreaksList() {
    // we don't have access to outbreaks ?
    if (!OutbreakModel.canView(this.authUser)) {
      return;
    }

    // display loading while retrieving outbreaks
    this.outbreakListOptionsLoading = true;
    this.changeDetectorRef.detectChanges();

    // outbreak data
    this.outbreakDataService
      .getOutbreaksListReduced()
      .subscribe((outbreaksList) => {
        // prepare outbreaks
        this.outbreakListOptions = [];
        outbreaksList.forEach((outbreak: OutbreakModel) => {
          // add outbreak details
          outbreak.details = outbreak.name + (outbreak.description ? `: ${outbreak.description}` : '');

          // active outbreak ?
          let icon: string;
          if (outbreak.id === this.authUser.activeOutbreakId) {
            icon = 'check_circle';
          }

          // add to outbreak list of items
          this.outbreakListOptions.push({
            label: outbreak.name,
            value: outbreak.id,
            icon: icon,
            data: outbreak
          });
        });

        // finished
        this.outbreakListOptionsLoading = false;

        // update ui
        this.changeDetectorRef.detectChanges();
      });
  }

  /**
   * Show loading
   */
  showLoading(): void {
    // already visible ?
    if (this.loadingHandler) {
      return;
    }

    // show
    this.loadingHandler = this.dialogV2Service.showLoadingDialog();
  }

  /**
   * Hide loading
   */
  hideLoading(): void {
    // close loading handler
    if (this.loadingHandler) {
      this.loadingHandler.close();
      this.loadingHandler = undefined;
    }
  }

  /**
   * Change the selected Outbreak across the application
   */
  selectOutbreak(outbreakId: string) {
    // show loading
    this.showLoading();

    // update ui
    this.changeDetectorRef.detectChanges();

    // retrieve outbreak data since we have only truncated data here
    this.outbreakDataService
      .getOutbreak(outbreakId)
      .pipe(
        catchError((err) => {
          // error
          this.toastV2Service.error(err);

          // hide loading
          this.hideLoading();

          // send it further
          return throwError(err);
        })
      )
      .subscribe((outbreakData) => {
        // cache the selected Outbreak
        // - no need to change our local variables here, they will be updated by the getSelectedOutbreakSubject listener
        this.outbreakDataService.setSelectedOutbreak(outbreakData);

        // hide loading
        this.hideLoading();
      });
  }

  /**
   * Global search
   */
  globalSearch(): void {
    // console.log('global search by ', this.globalSearchValue);
  }

  /**
   * Display history
   */
  displayHistory(): void {
    // construct list of history items
    const parent: IV2SideDialogConfigInputAccordion = {
      type: V2SideDialogConfigInputType.ACCORDION,
      placeholder: '',
      name: 'errors',
      panels: []
    };
    ToastV2Service.HISTORY.data.forEach((item) => {
      // attach accordion
      parent.panels.push({
        type: V2SideDialogConfigInputType.ACCORDION_PANEL,
        name: `errors-${uuid()}`,
        placeholder: item.title,
        cssClasses: 'gd-type-error',
        iconButton: {
          icon: 'close',
          color: 'warn',
          data: item,
          click: (_dialogData, handler, iconButton) => {
            // remove history item
            this.toastV2Service.removeHistory(iconButton.data.id);

            // remove input item
            const panelIndex = parent.panels.findIndex((panel) => panel.iconButton === iconButton);
            parent.panels.splice(panelIndex, 1);

            // nothing to see anymore ?
            if (parent.panels.length < 1) {
              // hide
              handler.hide();

              // finished
              return;
            }

            // update ui
            handler.detectChanges();
          }
        },
        inputs: !item.details || !item.details.trim() ? [] : [{
          type: V2SideDialogConfigInputType.HTML,
          name: `errors-long-${uuid()}`,
          placeholder: item.details
        }]
      });
    });

    // display dialog
    this.dialogV2Service
      .showSideDialog({
        title: {
          get: () => 'LNG_COMMON_LABEL_HISTORY_TITLE'
        },
        width: '60rem',
        bottomButtons: [{
          type: IV2SideDialogConfigButtonType.OTHER,
          label: 'LNG_MULTIPLE_SNACKBAR_BUTTON_CLOSE_ALL',
          color: 'warn'
        }, {
          type: IV2SideDialogConfigButtonType.CANCEL,
          label: 'LNG_COMMON_BUTTON_CANCEL',
          color: 'text'
        }],
        inputs: [parent]
      })
      .subscribe((response) => {
        // cancelled ?
        if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
          // finished
          return;
        }

        // clear all
        this.toastV2Service.clearHistory();

        // close popup
        response.handler.hide();
      });
  }

  /**
   * Update website render mode
   */
  @HostListener('window:resize')
  private updateRenderMode(): void {
    // determine render mode
    const renderMode = determineRenderMode();

    // same as before ?
    if (renderMode === this.renderMode) {
      return;
    }

    // must update
    this.renderMode = renderMode;
  }

  /**
   * Change outbreak
   */
  mobileChangeOutbreak(): void {
    this.dialogV2Service
      .showSideDialog({
        title: {
          get: () => 'LNG_LAYOUT_SELECTED_OUTBREAK_LABEL'
        },
        width: '38rem',
        hideInputFilter: true,
        inputs: [{
          type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
          name: 'selectedOutbreak',
          placeholder: 'LNG_LAYOUT_SELECTED_OUTBREAK_LABEL',
          options: this.outbreakListOptions,
          value: this.selectedOutbreak?.id,
          validators: {
            required: () => true
          }
        }],
        bottomButtons: [{
          type: IV2SideDialogConfigButtonType.OTHER,
          label: 'LNG_COMMON_BUTTON_APPLY',
          color: 'primary',
          key: 'apply',
          disabled: (data, handler): boolean => {
            return !handler.form || handler.form.invalid ||
              (data.map.selectedOutbreak as IV2SideDialogConfigInputSingleDropdown).value === this.selectedOutbreak?.id;
          }
        }, {
          type: IV2SideDialogConfigButtonType.CANCEL,
          label: 'LNG_COMMON_BUTTON_CANCEL',
          color: 'text'
        }]
      })
      .subscribe((response) => {
        // cancelled ?
        if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
          // finished
          return;
        }

        // change outbreak
        this.selectOutbreak((response.data.map.selectedOutbreak as IV2SideDialogConfigInputSingleDropdown).value);

        // close dialog
        response.handler.hide();
      });
  }

  /**
   * Global search
   */
  mobileGlobalSearch(): void {
    this.dialogV2Service
      .showSideDialog({
        title: {
          get: () => 'LNG_COMMON_LABEL_SEARCH'
        },
        width: '38rem',
        hideInputFilter: true,
        inputs: [{
          type: V2SideDialogConfigInputType.TEXT,
          name: 'search',
          placeholder: 'LNG_COMMON_LABEL_SEARCH',
          value: this.globalSearchValue,
          validators: {
            required: () => true
          }
        }],
        bottomButtons: [{
          type: IV2SideDialogConfigButtonType.OTHER,
          label: 'LNG_COMMON_BUTTON_APPLY',
          color: 'primary',
          key: 'apply',
          disabled: (_data, handler): boolean => {
            return !handler.form || handler.form.invalid;
          }
        }, {
          type: IV2SideDialogConfigButtonType.CANCEL,
          label: 'LNG_COMMON_BUTTON_CANCEL',
          color: 'text'
        }]
      })
      .subscribe((response) => {
        // cancelled ?
        if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
          // finished
          return;
        }

        // search
        this.globalSearchValue = (response.data.map.search as IV2SideDialogConfigInputText).value;
        this.globalSearch();

        // close dialog
        response.handler.hide();
      });
  }

  /**
   * Show main menu
   */
  showMainMenu(): void {
    this.showHoverMenu.emit();
  }
}
