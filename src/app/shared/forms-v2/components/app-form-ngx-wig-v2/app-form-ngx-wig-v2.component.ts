import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  forwardRef,
  Host,
  Input, OnDestroy,
  Optional, Renderer2,
  SkipSelf, ViewChild, ViewEncapsulation
} from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AppFormBaseV2 } from '../../core/app-form-base-v2';
import { BUTTONS, NgxWigComponent } from 'ngx-wig';
import * as _ from 'lodash';
import { AppFormInputV2LibraryButtons } from '../app-form-input-v2/definitions/app-form-input-v2-library-buttons';
import { I18nService } from '../../../../core/services/helper/i18n.service';

@Component({
  selector: 'app-form-ngx-wig-v2',
  templateUrl: './app-form-ngx-wig-v2.component.html',
  styleUrls: ['./app-form-ngx-wig-v2.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AppFormNgxWigV2Component),
    multi: true
  }, {
    provide: BUTTONS,
    multi: true,
    useClass: AppFormInputV2LibraryButtons
  }],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppFormNgxWigV2Component
  extends AppFormBaseV2<string> implements OnDestroy {

  // view only
  @Input() viewOnly: boolean;

  // no value string
  @Input() noValueLabel: string = '—';

  // html listeners
  private _htmlListenerDblClickImg: () => void;
  private _htmlListenerSelectCaretPosition: () => void;

  /**
   * WYSIWYG component
   */
  private _ngxWig: NgxWigComponent;
  @ViewChild('ngxWig', { static: false }) set ngxWig(ngxWig: NgxWigComponent) {
    // keep reference
    this._ngxWig = ngxWig;

    // register component for easy find
    this.addHtmlListeners();
  }
  get ngxWig(): NgxWigComponent {
    return this._ngxWig;
  }

  /**
   * Constructor
   */
  constructor(
    @Optional() @Host() @SkipSelf() protected controlContainer: ControlContainer,
    protected i18nService: I18nService,
    protected changeDetectorRef: ChangeDetectorRef,
    protected renderer2: Renderer2
  ) {
    super(
      controlContainer,
      i18nService,
      changeDetectorRef
    );
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // parent
    super.onDestroy();

    // release html listeners
    this.releaseHtmlListeners();
  }

  /**
   * Release html listener
   */
  private releaseHtmlListeners() {
    // image double click listener
    if (this._htmlListenerDblClickImg) {
      this._htmlListenerDblClickImg();
      this._htmlListenerDblClickImg = null;
    }

    // remember wysiwyg caret position
    if (this._htmlListenerSelectCaretPosition) {
      // listener
      this._htmlListenerSelectCaretPosition();
      this._htmlListenerSelectCaretPosition = null;

      // remove old caret position
      const selectionRange = _.get(
        this.ngxWig,
        AppFormInputV2LibraryButtons.SELECTION_RANGE_PATH
      );
      if (selectionRange) {
        _.unset(
          this.ngxWig,
          AppFormInputV2LibraryButtons.SELECTION_RANGE_PATH
        );
      }
    }
  }

  /**
   * Init html listeners
   */
  private addHtmlListeners() {
    // nothing to do ?
    if (this.viewOnly) {
      return;
    }

    // release listeners
    this.releaseHtmlListeners();

    // there is no point in adding listeners if component is disabled
    if (this.disabled) {
      return;
    }

    // create image double click listener
    this._htmlListenerDblClickImg = this.renderer2.listen(
      this.ngxWig.ngxWigEditable.nativeElement,
      'dblclick',
      (event) => {
        // images
        if (
          !this.disabled &&
          event.target &&
          event.target.classList
        ) {
          // update image
          if (event.target.classList.contains('ngx-wig-img')) {
            AppFormInputV2LibraryButtons.displayImageDialog(
              this.ngxWig,
              event.target
            );
          } else if (event.target.classList.contains('ngx-wig-link')) {
            AppFormInputV2LibraryButtons.displayLinkDialog(
              this.ngxWig,
              event.target
            );
          }
        }
      }
    );

    // remember caret position
    this._htmlListenerSelectCaretPosition = this.renderer2.listen(
      document,
      'selectionchange',
      () => {
        if (
          !this.disabled &&
          this.isComponentChild(document.activeElement)
        ) {
          const selection = window.getSelection();
          if (
            selection.getRangeAt &&
            selection.rangeCount
          ) {
            _.set(
              this.ngxWig,
              AppFormInputV2LibraryButtons.SELECTION_RANGE_PATH,
              selection.getRangeAt(0)
            );
          }
        }
      }
    );
  }

  /**
   * Check if a child is in our component container
   * @param child
   * @returns boolean
   */
  private isComponentChild(child) {
    // search for descendant parent
    let node = child.parentNode;
    while (node != null) {
      // is this the parent node we're looking for ?
      if (
        node.tagName &&
        node.tagName.toLowerCase() === 'app-form-ngx-wig-v2' &&
        node.childNodes.length > 0
      ) {
        // seems to be out component child
        return true;
      }

      // parent node
      node = node.parentNode;
    }

    // not component child
    return false;
  }
}
