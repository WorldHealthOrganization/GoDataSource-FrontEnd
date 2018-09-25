import { Component, EventEmitter, Input, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSidenav } from '@angular/material';
import { VisibleColumnModel } from './model';
import { NgForm } from '@angular/forms';
import { UserModel, UserSettings } from '../../../core/models/user.model';
import * as _ from 'lodash';
import { AuthDataService } from '../../../core/services/data/auth.data.service';
import { FormHelperService } from '../../../core/services/helper/form-helper.service';
import { SnackbarService } from '../../../core/services/helper/snackbar.service';

@Component({
    selector: 'app-side-columns',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './side-columns.component.html',
    styleUrls: ['./side-columns.component.less']
})
export class SideColumnsComponent {
    // table columns
    displayColumns: VisibleColumnModel[] = [];
    private _tableColumns: VisibleColumnModel[] = [];
    @Input() set tableColumns(tableColumns: VisibleColumnModel[]) {
        // table columns
        this._tableColumns = tableColumns;

        // determine what checkboxes should be displayed
        this.displayColumns = [];
        _.each(this.tableColumns, (column: VisibleColumnModel) => {
            if (!column.required) {
                this.displayColumns.push(column);
            }
        });

        // initialize visible columns
        this.initializeTableColumns();
    }
    get tableColumns(): VisibleColumnModel[] {
        return this._tableColumns;
    }

    // where should settings be saved...
    private _tableColumnsUserSettingsKey: UserSettings;
    @Input() set tableColumnsUserSettingsKey(tableColumnsUserSettingsKey: UserSettings) {
        // change settings value
        this._tableColumnsUserSettingsKey = tableColumnsUserSettingsKey;

        // initialize visible columns
        this.initializeTableColumns();
    }
    get tableColumnsUserSettingsKey(): UserSettings {
        return this._tableColumnsUserSettingsKey;
    }

    // visible table columns
    visibleTableColumns: string[] = [];

    // Side Nav
    @ViewChild('sideNav') sideNav: MatSidenav;

    // authenticated user
    authUser: UserModel;

    // visible column event handler
    @Output() visibleColumnsChanged = new EventEmitter<string[]>();

    /**
     * Constructor
     */
    constructor(
        private authDataService: AuthDataService,
        private formHelper: FormHelperService,
        private snackbarService: SnackbarService
    ) {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // initialize data
        this.initializeTableColumns();
    }

    /**
     * Close Side Nav
     */
    closeSideNav() {
        this.sideNav.close();
    }

    /**
     * Open Side Nav
     */
    openSideNav() {
        this.sideNav.open();
    }

    /**
     * Initialize Table Columns
     */
    initializeTableColumns() {
        // get use saved settings
        const settings = this.authUser.getSettings(this.tableColumnsUserSettingsKey);

        // set visible values
        // we shouldn't have empty arrays..no columns to display...
        if (!_.isEmpty(settings)) {
            _.each(this.tableColumns, (column: VisibleColumnModel) => {
                if (!column.required) {
                    column.visible = _.indexOf(settings, column.field) > -1;
                }
            });
        }

        // initialize visible data columns
        this.initializeVisibleTableColumns();
    }

    /**
     * Initialize Visible Table Columns
     */
    initializeVisibleTableColumns() {
        // construct visible table columns
        this.visibleTableColumns = [];
        _.each(this.tableColumns, (column: VisibleColumnModel) => {
            if (
                column.required ||
                column.visible
            ) {
                this.visibleTableColumns.push(column.field);
            }
        });

        // emit table columns changed
        this.visibleColumnsChanged.emit(this.visibleTableColumns);
    }

    /**
     * Apply
     */
    apply(form: NgForm) {
        // get fields
        const fields: any = this.formHelper.getFields(form);

        // retrieve visible fields
        const columns = _.get(
            fields,
            'select.columns',
            {}
        );

        // no visible columns ?
        if (_.isEmpty(_.filter(columns, (value) => value))) {
            this.snackbarService.showError('LNG_SIDE_COLUMNS_ERROR_NO_COLUMN_SELECTED');
            return;
        }

        // set fields visibility
        _.each(this.tableColumns, (column: VisibleColumnModel) => {
            column.visible = !!columns[column.field];
        });

        // initialize visible data columns
        this.initializeVisibleTableColumns();

        // save visible columns
        this.authDataService.updateSettingsForCurrentUser(
            this.tableColumnsUserSettingsKey,
            this.visibleTableColumns
        ).subscribe();

        // close side nav
        this.closeSideNav();
    }
}
