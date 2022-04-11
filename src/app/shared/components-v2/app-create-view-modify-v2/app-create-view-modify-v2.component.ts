import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CreateViewModifyV2Action } from './models/action.model';

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
  action: CreateViewModifyV2Action;

  /**
   * Constructor
   */
  constructor(
    protected activatedRoute: ActivatedRoute,
    protected changeDetectorRef: ChangeDetectorRef
  ) {
    // retrieve basic data
    this.action = this.activatedRoute.snapshot.data.action;
  }
}
