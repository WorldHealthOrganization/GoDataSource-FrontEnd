import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { IV2SideDialog, IV2SideDialogConfig, IV2SideDialogResponse, V2SideDialogConfigAction } from '../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';

@Injectable()
export class DialogV2Service {
  // used to show and update side dialog
  private _sideDialogSubject$: Subject<IV2SideDialog> = new Subject<IV2SideDialog>();

  /**
   * Side dialog subject handler
   */
  get sideDialogSubject$(): Subject<IV2SideDialog> {
    return this._sideDialogSubject$;
  }

  /**
   * Show side dialog
   */
  showSideDialog(config: IV2SideDialogConfig): Observable<IV2SideDialogResponse> {
    return new Observable<IV2SideDialogResponse>((observer) => {
      this._sideDialogSubject$.next({
        action: V2SideDialogConfigAction.OPEN,
        config,
        responseSubscriber: observer
      });
    });
  }
}
