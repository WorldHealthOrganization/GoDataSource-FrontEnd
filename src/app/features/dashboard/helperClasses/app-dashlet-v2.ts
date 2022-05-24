import { Subscription } from 'rxjs';
import { IDashletValue } from './dashlet-value';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';
import { Moment } from '../../../core/helperClasses/x-moment';
import { Directive, Input } from '@angular/core';
import { AuthDataService } from '../../../core/services/data/auth.data.service';
import { UserModel } from '../../../core/models/user.model';

/**
 * Dashlet
 */
@Directive()
export abstract class AppDashletV2 {
  // used to filter dashlets
  @Input() globalFilterDate: string | Moment;
  @Input() globalFilterLocationId: string;
  @Input() globalFilterClassificationId: string[];

  // title
  title: string;

  // dashlet values
  values: IDashletValue[];

  // selected outbreak
  protected selectedOutbreak: OutbreakModel;
  private _selectedOutbreakSubscription: Subscription;

  // authenticated user
  protected authUser: UserModel;

  /**
   * Initialize
   */
  constructor(
    authDataService: AuthDataService,
    outbreakDataService: OutbreakDataService
  ) {
    // get user
    this.authUser = authDataService.getAuthenticatedUser();

    // listen for outbreak selection
    this._selectedOutbreakSubscription = outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        // ignore empty selection for now, no need to take in account ...de-selection
        if (!selectedOutbreak) {
          return;
        }

        // if same outbreak then don't trigger change
        if (
          this.selectedOutbreak &&
          this.selectedOutbreak.id === selectedOutbreak.id
        ) {
          return;
        }

        // select outbreak
        this.selectedOutbreak = selectedOutbreak;

        // trigger outbreak selection changed
        // - wait for binding
        setTimeout(() => {
          // init dashlet
          this.initializeDashlet();
        });
      });
  }

  /**
   * Release resources
   */
  onDestroy(): void {
    // selected outbreak
    if (this._selectedOutbreakSubscription) {
      this._selectedOutbreakSubscription.unsubscribe();
      this._selectedOutbreakSubscription = undefined;
    }
  }

  /**
   * Initialize dashlet
   */
  protected abstract initializeDashlet(): void;
}
