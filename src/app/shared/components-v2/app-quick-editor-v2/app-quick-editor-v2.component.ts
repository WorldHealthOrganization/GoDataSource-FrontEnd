import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { IQuickEditorV2Section, QuickEditorV2Input, QuickEditorV2InputType } from './models/input.model';
import { ControlContainer, NgForm } from '@angular/forms';

/**
 * Component
 */
@Component({
  selector: 'app-quick-editor-v2',
  templateUrl: './app-quick-editor-v2.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm } ]
})
export class AppQuickEditorV2Component {
  // inputs
  private _sections: IQuickEditorV2Section<QuickEditorV2Input>[];
  @Input() set sections(sections: IQuickEditorV2Section<QuickEditorV2Input>[]) {
    // set data
    this._sections = sections;

    // update ui
    this.detectChanges();
  }
  get sections(): IQuickEditorV2Section<QuickEditorV2Input>[] {
    return this._sections;
  }

  // constants
  QuickEditorV2InputType = QuickEditorV2InputType;

  /**
   * Constructor
   */
  constructor(
    protected changeDetectorRef: ChangeDetectorRef
  ) {}

  /**
   * Update UI
   */
  private detectChanges(): void {
    this.changeDetectorRef.detectChanges();
  }
}
