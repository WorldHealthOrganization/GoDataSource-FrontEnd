import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input } from '@angular/core';
import { CreateViewModifyV2Action } from './models/action.model';
import { ICreateViewModifyV2, CreateViewModifyV2TabInputType, ICreateViewModifyV2Tab, ICreateViewModifyV2TabInputList, CreateViewModifyV2MenuType } from './models/tab.model';
import { IV2Breadcrumb } from '../app-breadcrumb-v2/models/breadcrumb.model';
import { DialogV2Service } from '../../../core/services/helper/dialog-v2.service';
import { IV2BottomDialogConfigButtonType } from '../app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { NgForm } from '@angular/forms';
import { ILabelValuePairModel } from '../../forms-v2/core/label-value-pair.model';
import { Constants } from '../../../core/models/constants';
import { AddressModel } from '../../../core/models/address.model';
import { ILocation } from '../../forms-v2/core/app-form-location-base-v2';
import { FormHelperService } from '../../../core/services/helper/form-helper.service';

/**
 * Component
 */
@Component({
  selector: 'app-create-view-modify-v2',
  templateUrl: './app-create-view-modify-v2.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppCreateViewModifyV2Component {
  // page type
  // - determined from route data
  @Input() action: CreateViewModifyV2Action;
  get isCreate(): boolean {
    return this.action === CreateViewModifyV2Action.CREATE;
  }
  get isView(): boolean {
    return this.action === CreateViewModifyV2Action.VIEW;
  }
  get isModify(): boolean {
    return this.action === CreateViewModifyV2Action.MODIFY;
  }

  // loading item data ?
  @Input() loadingItemData: boolean;

  // breadcrumbs
  @Input() breadcrumbs: IV2Breadcrumb[];

  // title
  @Input() pageTitle: string;
  @Input() pageTitleData: {
    [key: string]: string
  };

  // tabs to render
  @Input() tabData: ICreateViewModifyV2;

  // age - dob options
  ageDOBOptions: ILabelValuePairModel[] = [
    {
      label: 'LNG_ENTITY_FIELD_LABEL_AGE',
      value: true
    }, {
      label: 'LNG_ENTITY_FIELD_LABEL_DOB',
      value: false
    }
  ];
  ageTypeOptions: ILabelValuePairModel[] = [
    {
      label: 'LNG_AGE_FIELD_LABEL_YEARS',
      value: true
    }, {
      label: 'LNG_AGE_FIELD_LABEL_MONTHS',
      value: false
    }
  ];

  // constants
  CreateViewModifyV2TabInputType = CreateViewModifyV2TabInputType;
  Constants = Constants;
  CreateViewModifyV2MenuType = CreateViewModifyV2MenuType;
  FormHelperService = FormHelperService;

  /**
   * Constructor
   */
  constructor(
    protected elementRef: ElementRef,
    protected changeDetectorRef: ChangeDetectorRef,
    protected dialogV2Service: DialogV2Service,
    protected formHelper: FormHelperService
  ) {}

  /**
   * Should update height of table
   */
  resizeTable(): void {
    // local variables
    let margins;

    // determine top part used space
    let topHeight: number = 0;
    const top = this.elementRef.nativeElement.querySelector('.gd-create-view-modify-top');
    if (top) {
      // add height
      topHeight += top.offsetHeight;

      // get top margins
      margins = getComputedStyle(top);
      if (margins) {
        // top margin
        if (margins.marginTop) {
          topHeight += parseInt(margins.marginTop, 10);
        }

        // bottom margin
        if (margins.marginBottom) {
          topHeight += parseInt(margins.marginBottom, 10);
        }
      }
    }

    // set table height
    const table = this.elementRef.nativeElement.querySelector('.gd-create-view-modify-bottom');
    if (table) {
      // set main table height - mat card
      table.style.height = `calc(100% - ${topHeight}px)`;
    }
  }

  /**
   * Add new item to list
   */
  addListItem(input: ICreateViewModifyV2TabInputList): void {
    // add new item to list
    input.items.push(input.definition.add.newItem());

    // trigger items changed
    if (input.itemsChanged) {
      input.itemsChanged(input);
    }
  }

  /**
   * Remove item from list
   */
  removeListItem(
    input: ICreateViewModifyV2TabInputList,
    itemIndex: number
  ): void {
    // delete method
    const deleteItem = () => {
      // remove item
      input.items.splice(itemIndex, 1);

      // trigger items changed
      if (input.itemsChanged) {
        input.itemsChanged(input);
      }

      // re-render ui
      this.changeDetectorRef.detectChanges();

      // needed to update mat tab label warnings
      if (this.isModify) {
        this.changeDetectorRef.markForCheck();
      }
    };

    // ask for confirmation
    this.dialogV2Service.showConfirmDialog({
      config: {
        title: {
          get: () => 'LNG_PAGE_ACTION_DELETE'
        },
        message: {
          get: () => input.definition.remove.confirmLabel
        }
      }
    }).subscribe((response) => {
      // canceled ?
      if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
        // finished
        return;
      }

      // remove item
      deleteItem();
    });
  }

  /**
   * Update form
   */
  updateForm(
    tab: ICreateViewModifyV2Tab,
    form: NgForm
  ): void {
    tab.form = form;
  }

  /**
   * Address location changed
   */
  addressLocationChanged(
    address: AddressModel,
    locationInfo: ILocation
  ): void {
    // should we copy location lat & lng ?
    if (
      locationInfo &&
      locationInfo.geoLocation &&
      locationInfo.geoLocation.lat &&
      locationInfo.geoLocation.lng
    ) {
      this.dialogV2Service
        .showConfirmDialog({
          config: {
            title: {
              get: () => 'LNG_DIALOG_CONFIRM_REPLACE_GEOLOCATION'
            },
            message: {
              get: () => 'LNG_DIALOG_CONFIRM_REPLACE_GEOLOCATION'
            }
          }
        })
        .subscribe((response) => {
          // canceled ?
          if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
            // finished
            return;
          }

          // change location lat & lng
          address.geoLocation.lat = locationInfo.geoLocation.lat;
          address.geoLocation.lng = locationInfo.geoLocation.lng;

          // update ui
          this.changeDetectorRef.detectChanges();
        });
    }
  }

  /**
   * Create item
   */
  create(): void {
    // determine form data
    const forms: NgForm[] = this.tabData.tabs.map((tab) => tab.form).filter((item) => !!item);
    const fieldData = this.formHelper.mergeFields(forms);
    console.log(fieldData);
  }
}
