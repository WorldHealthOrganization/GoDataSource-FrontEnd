import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { Observable, Subscriber } from 'rxjs';
import { DialogAnswer, DialogAnswerButton } from '../dialog/dialog.component';
import { DialogService } from '../../../core/services/helper/dialog.service';
import { GenericDataService } from '../../../core/services/data/generic.data.service';
import { SortableListBase } from '../../xt-forms/core/sortable-list-base';
import { CdkDragDrop, CdkDragStart, moveItemInArray } from '@angular/cdk/drag-drop';

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

    // list of map types
    outbreakMapServerTypesList$: Observable<any[]>;

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
}
