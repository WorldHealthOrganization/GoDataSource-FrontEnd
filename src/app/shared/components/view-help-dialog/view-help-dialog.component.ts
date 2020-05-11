import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Observable } from 'rxjs';
import { HelpItemModel } from '../../../core/models/help-item.model';
import { ListComponent } from '../../../core/helperClasses/list-component';
import { SnackbarService } from '../../../core/services/helper/snackbar.service';
import { catchError, tap } from 'rxjs/operators';
import { HelpDataService } from '../../../core/services/data/help.data.service';
import * as _ from 'lodash';
import { HelpCategoryModel } from '../../../core/models/help-category.model';
import { DialogAnswer, DialogAnswerButton } from '../dialog/dialog.component';
import { DialogService } from '../../../core/services/helper/dialog.service';
import { ViewHelpDetailsData, ViewHelpDetailsDialogComponent } from '../view-help-details-dialog/view-help-details-dialog.component';
import { HoverRowAction } from '../hover-row-actions/hover-row-actions.component';
import { throwError } from 'rxjs/internal/observable/throwError';
import { ListHelperService } from '../../../core/services/helper/list-helper.service';

export class ViewHelpData {
    helpItemsIds: string[];

    constructor(data?: {
        helpItemsIds?: string[]
    }) {
        if (data) {
            Object.assign(
                this,
                data
            );
        }
    }
}

@Component({
    selector: 'app-view-help-dialog',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './view-help-dialog.component.html',
    styleUrls: ['./view-help-dialog.component.less']
})
export class ViewHelpDialogComponent extends ListComponent {
    // default settings for this type of dialog
    static DEFAULT_CONFIG = {
        autoFocus: false,
        closeOnNavigation: true,
        disableClose: false,
        hasBackdrop: true,
        data: undefined,
        panelClass: 'dialog-view-help',
        width: '90%',
        maxWidth: '90%',
        height: '95vh'
    };

    searchedTerm: string;
    helpItemsList$: Observable<HelpItemModel[]>;
    helpCategoriesList$: Observable<HelpCategoryModel[]>;

    fixedTableColumns: string[] = [
        'title',
        'categoryId'
    ];

    recordActions: HoverRowAction[] = [
        // View Case
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_ACTION_VIEW',
            click: (item: HelpItemModel) => {
                this.viewHelpItemDetails(item);
            }
        })
    ];

    /**
     * Constructor
     */
    constructor(
        protected listHelperService: ListHelperService,
        public dialogRef: MatDialogRef<ViewHelpDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ViewHelpData,
        private snackbarService: SnackbarService,
        private helpDataService: HelpDataService,
        private dialogService: DialogService
    ) {
        super(listHelperService);

        // retrieve help categories
        this.helpCategoriesList$ = this.helpDataService.getHelpCategoryList();

        // ...and re-load the list
        this.needsRefreshList(true);
    }

    /**
     * Re(load) the items list
     */
    refreshList(finishCallback: (records: any[]) => void) {
        // make sure we retrieve only approved help items
        this.queryBuilder.filter.where({
            approved: true
        }, true);

        // do we need to retrieve only items related to a specific page ?
        if (!_.isEmpty(this.data.helpItemsIds)) {
            this.queryBuilder.filter.where({
            id: {
                inq: this.data.helpItemsIds
            }}, true);
        } else {
            this.queryBuilder.filter.remove('id');
        }

        // retrieve the list of items
        if (_.isEmpty(this.searchedTerm)) {
            this.helpItemsList$ = this.helpDataService.getHelpItemsList(this.queryBuilder);
        } else {
            this.helpItemsList$ = this.helpDataService.getHelpItemsListSearch(this.queryBuilder, this.searchedTerm);
        }

        // check for empty list
        this.helpItemsList$ = this.helpItemsList$
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    finishCallback([]);
                    return throwError(err);
                }),
                tap(this.checkEmptyList.bind(this)),
                tap((data: any[]) => {
                    finishCallback(data);
                })
            );
    }

    /**
     * Filter the list by a text field
     * @param {string} value
     */
    filterByTextFieldHelpSearch(value: string) {
        // refresh list
        this.searchedTerm = value;
        this.needsRefreshList();
    }

    /**
     * View details
     * @param item
     */
    viewHelpItemDetails(item: HelpItemModel) {
        // close dialog
        this.dialogRef.close();

        // display more info dialog
        this.dialogService.showCustomDialog(
            ViewHelpDetailsDialogComponent,
            {
                ...ViewHelpDetailsDialogComponent.DEFAULT_CONFIG,
                ...{
                    data: new ViewHelpDetailsData({
                        categoryId: item.categoryId,
                        itemId: item.id
                    })
                }
            }
        );
    }

    /**
     * Close Dialog
     */
    closeDialog() {
        this.dialogRef.close(new DialogAnswer(
            DialogAnswerButton.Cancel
        ));
    }
}
