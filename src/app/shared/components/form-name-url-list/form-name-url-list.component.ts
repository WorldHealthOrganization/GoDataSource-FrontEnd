import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { Observable, Subscriber } from 'rxjs';
import { DialogAnswer, DialogAnswerButton } from '../dialog/dialog.component';
import { DialogService } from '../../../core/services/helper/dialog.service';
import { GenericDataService } from '../../../core/services/data/generic.data.service';
import { SortableListBase } from '../../xt-forms/core/sortable-list-base';
import { CdkDragDrop, CdkDragStart, moveItemInArray } from '@angular/cdk/drag-drop';
import { Constants } from '../../../core/models/constants';
import { IGeneralAsyncValidatorResponse } from '../../xt-forms/validators/general-async-validator.directive';
import * as _ from 'lodash';
import { LabelValuePair } from '../../../core/models/label-value-pair';

export class NameUrlModel {
    name: string;
    url: string;
}

@Component({
    selector: 'app-form-name-url-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-name-url-list.component.html',
    styleUrls: ['./form-name-url-list.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormNameUrlListComponent,
        multi: true
    }]
})
export class FormNameUrlListComponent
    extends SortableListBase<NameUrlModel>
    implements OnInit {

    // data
    @Input() required: boolean = false;
    @Input() disabled: boolean = false;
    @Input() namePlaceholder: string = '';
    @Input() urlPlaceholder: string = '';
    @Input() typePlaceholder: string = '';
    @Input() nameTooltip: string;
    @Input() urlTooltip: string;
    @Input() typeTooltip: string;
    @Input() componentTitle: string;

    // vector styling
    @Input() styleUrlPlaceholder: string = '';
    @Input() styleUrlTooltip: string;
    @Input() styleUrlSourcePlaceholder: string = '';
    @Input() styleUrlSourceTooltip: string;
    @Input() invalidStyleUrlError: string;
    @Input() invalidStyleUrlResponseError: string;

    // list of map types
    outbreakMapServerTypesList$: Observable<any[]>;

    // constants
    Constants = Constants;

    // used for style url validation
    private styleUrlValidationCache: {
        [url: string]: Observable<boolean | IGeneralAsyncValidatorResponse>
    } = {};

    // style options
    styleOptions: {
        [url: string]: LabelValuePair[]
    } = {};

    /**
     * Constructor
     */
    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private dialogService: DialogService,
        private genericDataService: GenericDataService
    ) {
        super(
            controlContainer,
            validators,
            asyncValidators
        );
    }

    /**
     * Create new item
     */
    protected generateNewItem(): NameUrlModel {
        return new NameUrlModel();
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // outbreak map server types list
        this.outbreakMapServerTypesList$ = this.genericDataService.getOutbreakMapServerTypesList();

        // handle remove item confirmation
        this.deleteConfirm.subscribe((observer: Subscriber<void>) => {
            this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_ITEM')
                .subscribe((answer: DialogAnswer) => {
                    if (answer.button === DialogAnswerButton.Yes) {
                        observer.next();
                    }
                });
        });
    }

    /**
     * Drop item
     */
    dropTable(event: CdkDragDrop<NameUrlModel[]>): void {
        if (this.isInvalidDragEvent) {
            return;
        }

        // disable drag
        this.isInvalidDragEvent = true;
        moveItemInArray(
            this.value,
            event.previousIndex,
            event.currentIndex
        );

        // changed
        this.onChange();
    }

    /**
     * Drag started
     */
    dragStarted(event: CdkDragStart<NameUrlModel>): void {
        if (this.isInvalidDragEvent) {
            document.dispatchEvent(new Event('mouseup'));
        }
    }

    /**
     * Initialize style url validator
     */
    initializeStyleUrlValidator(itemIndex: number): Observable<boolean | IGeneralAsyncValidatorResponse> {
        // determine url
        const url: string = this.values[itemIndex].styleUrl;

        // need to initialize url validation ?
        if (this.styleUrlValidationCache[url] === undefined) {
            this.styleUrlValidationCache[url] = new Observable((finishedObs) => {
                // not a valid url ?
                if (!(/https?:\/\/([\da-z.-]+)\.([a-z.]{2,6})(.*)/i.test(url))) {
                    // not a valid url
                    finishedObs.next({
                        isValid: false,
                        errMsg: this.invalidStyleUrlError
                    });
                    finishedObs.complete();

                    // finished
                    return;
                }

                // try to fetch sources
                fetch(url)
                    .then(r => r.json())
                    .then((glStyle: {
                        sources: {
                            [name: string]: any
                        }
                    }) => {
                        // did we retrieve the response looking to something similar to what we're expecting ?
                        if (
                            !glStyle ||
                            !glStyle.sources ||
                            !_.isObject(glStyle.sources)
                        ) {
                            // not a valid url
                            finishedObs.next({
                                isValid: false,
                                errMsg: this.invalidStyleUrlResponseError
                            });
                            finishedObs.complete();

                            // finished
                            return;
                        }

                        // set style options
                        this.styleOptions[url] = [];
                        Object.keys(glStyle.sources).forEach((source: string) => {
                            this.styleOptions[url].push(new LabelValuePair(
                                source,
                                source
                            ));
                        });

                        // select the first source
                        this.values[itemIndex].styleUrlSource = this.styleOptions[url].length < 1 ?
                            undefined :
                            this.styleOptions[url][0].value;

                        // sources retrieved
                        finishedObs.next(true);
                        finishedObs.complete();
                    })
                    .catch(() => {
                        finishedObs.next({
                            isValid: false,
                            errMsg: this.invalidStyleUrlResponseError
                        });
                        finishedObs.complete();
                    });
            });
        }

        // finished
        return this.styleUrlValidationCache[url];
    }
}
