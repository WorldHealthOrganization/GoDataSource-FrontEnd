import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnDestroy, ViewChild, OnInit, Renderer2 } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { ElementBase } from '../../xt-forms/core';
import { BUTTONS, NgxWigComponent } from 'ngx-wig';
import { NgxWigCustomLibraryButtons, TButtonExtended } from './definitions/ngx-wig-custom-library-buttons';
import * as _ from 'lodash';
import { Subscription } from 'rxjs/internal/Subscription';
import { I18nService } from '../../../core/services/helper/i18n.service';

@Component({
    selector: 'app-form-ngx-wig',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-ngx-wig.component.html',
    styleUrls: ['./form-ngx-wig.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormNgxWigComponent,
        multi: true
    }, {
        provide: BUTTONS,
        multi: true,
        useClass: NgxWigCustomLibraryButtons
    }]
})
export class FormNgxWigComponent extends ElementBase<string> implements OnInit, OnDestroy {
    // component id
    static identifier: number = 0;
    public readonly identifier = `form-ngx-wig-${FormNgxWigComponent.identifier++}`;

    // html listeners
    private htmlListenerDblClickImg: () => void;
    private htmlListenerSelectCaretPosition: () => void;
    private languageListener: Subscription;

    // input
    @Input() buttons: string;
    @Input() name: string;
    @Input() disabled: boolean;

    /**
     * WYSIWYG component
     */
    private _ngxWig: NgxWigComponent;
    @ViewChild('ngxWig') set ngxWig(ngxWig: NgxWigComponent) {
        // keep reference
        this._ngxWig = ngxWig;

        // register component for easy find
        this.addHtmlListeners();
    }
    get ngxWig(): NgxWigComponent {
        return this._ngxWig;
    }

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private renderer2: Renderer2,
        private i18nService: I18nService
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    /**
     * Init
     */
    ngOnInit(): void {
        // language listener
        this.addLanguageListener();
    }

    /**
     * Release data
     */
    ngOnDestroy(): void {
        // release html listeners
        this.releaseHtmlListeners();

        // release language listener
        this.releaseLanguageListener();
    }

    /**
     * Release html listener
     */
    private releaseHtmlListeners() {
        // image double click listener
        if (this.htmlListenerDblClickImg) {
            this.htmlListenerDblClickImg();
            this.htmlListenerDblClickImg = null;
        }

        // remember wysiwyg caret position
        if (this.htmlListenerSelectCaretPosition) {
            // listener
            this.htmlListenerSelectCaretPosition();
            this.htmlListenerSelectCaretPosition = null;

            // remove old caret position
            const selectionRange = _.get(
                this.ngxWig,
                NgxWigCustomLibraryButtons.SELECTION_RANGE_PATH
            );
            if (selectionRange) {
                _.unset(
                    this.ngxWig,
                    NgxWigCustomLibraryButtons.SELECTION_RANGE_PATH
                );
            }
        }
    }

    /**
     * Init html listeners
     */
    private addHtmlListeners() {
        // release listeners
        this.releaseHtmlListeners();

        // there is no point in adding listeners if component is disabled
        if (this.disabled) {
            return;
        }

        // create image double click listener
        this.htmlListenerDblClickImg = this.renderer2.listen(
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
                        NgxWigCustomLibraryButtons.displayImageDialog(
                            this.ngxWig,
                            event.target
                        );
                    } else if (event.target.classList.contains('ngx-wig-link')) {
                        NgxWigCustomLibraryButtons.displayLinkDialog(
                            this.ngxWig,
                            event.target
                        );
                    }
                }
            }
        );

        // remember caret position
        this.htmlListenerSelectCaretPosition = this.renderer2.listen(
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
                            NgxWigCustomLibraryButtons.SELECTION_RANGE_PATH,
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
                node.tagName.toLowerCase() === 'app-form-ngx-wig' &&
                node.childNodes.length > 0 &&
                node.childNodes[0].getAttribute('id') === this.identifier
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

    /**
     * Init language listener
     */
    private addLanguageListener() {
        // update tokens on translate
        this.languageListener = this.i18nService.languageChangedEvent
            .subscribe(() => {
                // update buttons translations
                // hack to force library translation refresh
                if (this.ngxWig) {
                    _.each((this.ngxWig as any)._ngWigToolbarService._buttonLibrary, (button: TButtonExtended) => {
                        button.refreshTranslation();
                    });

                    // reset buttons list
                    this.ngxWig.ngOnInit();
                }
            });
    }

    /**
     * Release language listener
     */
    private releaseLanguageListener() {
        if (this.languageListener) {
            this.languageListener.unsubscribe();
            this.languageListener = null;
        }
    }
}
