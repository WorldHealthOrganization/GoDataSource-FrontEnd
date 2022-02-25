import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { AppFormIconButtonV2 } from '../../../shared/forms-v2/core/app-form-icon-button-v2';
import { UserModel } from '../../models/user.model';
import { AuthDataService } from '../../services/data/auth.data.service';
import { OutbreakDataService } from '../../services/data/outbreak.data.service';
import { OutbreakModel } from '../../models/outbreak.model';
import { LabelValuePairModel } from '../../../shared/forms-v2/core/label-value-pair.model';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { SnackbarService } from '../../services/helper/snackbar.service';
import { DialogService } from '../../services/helper/dialog.service';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
  selector: 'app-topnav',
  templateUrl: './topnav.component.html',
  styleUrls: ['./topnav.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TopnavComponent implements OnInit, OnDestroy {
  // global search
  globalSearchValue: string;
  globalSearchPrefixButtons: AppFormIconButtonV2[] = [
    new AppFormIconButtonV2({
      icon: 'help'
    })
  ];
  globalSearchSuffixButtons: AppFormIconButtonV2[] = [
    new AppFormIconButtonV2({
      icon: 'search',
      clickAction: () => {
        this.globalSearch();
      }
    })
  ];

  // constants
  OutbreakModel = OutbreakModel;

  // authenticated user
  authUser: UserModel;

  // selected Outbreak
  selectedOutbreak: OutbreakModel = new OutbreakModel();

  // subscription
  getSelectedOutbreakSubject: Subscription;

  // outbreak list
  outbreakListOptions: LabelValuePairModel[] = [];

  /**
   * Constructor
   */
  constructor(
    private outbreakDataService: OutbreakDataService,
    private authDataService: AuthDataService,
    private snackbarService: SnackbarService,
    private dialogService: DialogService
  ) {}

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
        }
      });
  }

  /**
   * Component destroyed
   */
  ngOnDestroy(): void {
    if (this.getSelectedOutbreakSubject) {
      this.getSelectedOutbreakSubject.unsubscribe();
      this.getSelectedOutbreakSubject = null;
    }
  }

  /**
   * Refresh outbreak list
   */
  refreshOutbreaksList() {
    // we don't have access to outbreaks ?
    if (!OutbreakModel.canView(this.authUser)) {
      return;
    }

    // outbreak data
    this.outbreakDataService
      .getOutbreaksListReduced()
      .subscribe((outbreaksList) => {
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
          this.outbreakListOptions.push(new LabelValuePairModel({
            label: outbreak.name,
            value: outbreak.id,
            icon: icon,
            data: outbreak
          }));
        });
      });
  }

  /**
   * Change the selected Outbreak across the application
   */
  selectOutbreak(outbreakId: string) {
    // retrieve outbreak data since we have only truncated data here
    // #TODO
    const loadingDialog = this.dialogService.showLoadingDialog();
    this.outbreakDataService
      .getOutbreak(outbreakId)
      .pipe(
        catchError((err) => {
          this.snackbarService.showApiError(err);
          loadingDialog.close();
          return throwError(err);
        })
      )
      .subscribe((outbreakData) => {
        // set selected outbreak
        this.selectedOutbreak = outbreakData;

        // hide loading dialog
        loadingDialog.close();

        // cache the selected Outbreak
        this.outbreakDataService.setSelectedOutbreak(this.selectedOutbreak);
      });
  }

  /**
   * Global search
   */
  globalSearch(): void {
    console.log('global search by ', this.globalSearchValue);
  }
}
