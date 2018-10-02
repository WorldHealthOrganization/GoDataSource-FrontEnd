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
    /**
     * Loading data ?
     */
    loading: boolean = false;

    /**
     * Contains all fields that aren't required ( e.g. actions )
     */
    displayColumns: VisibleColumnModel[] = [];

    /**
     * Table columns contains all fields ( including those that are required )
     */
    private _tableColumns: VisibleColumnModel[] = [];
    @Input() set tableColumns(tableColumns: VisibleColumnModel[]) {
        // table columns
        this._tableColumns = tableColumns;

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

    /**
     * Visible table columns ( used to display columns in table )
     */
    visibleTableColumns: string[] = [];

    /**
     * Same as visibleTableColumns, except that this doesn't contains the fields that shouldn't be saved since they can't be used by the server ( e.g. actions )
     */
    visibleSaveTableColumns: string[] = [];

    // Side Nav
    @ViewChild('sideNav') sideNav: MatSidenav;

    // visible column event handler
    @Output() visibleColumnsChanged = new EventEmitter<string[]>();

    /**
     * Constructor
     */
    constructor(
        private authDataService: AuthDataService,
        private formHelper: FormHelperService,
        private snackbarService: SnackbarService
    ) {}

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
        // side nav disabled ?
        if (this.loading) {
            return;
        }

        // show side nav
        this.sideNav.open();

        // initialize data
        this.initializeTableColumns();
    }

    /**
     * Initialize Table Columns
     */
    initializeTableColumns() {
        // get use saved settings
        // get the authenticated user ( every time a new object is created, and since we don't access the contructor again to refresh user data we need to get again the user )
        const authUser: UserModel = this.authDataService.getAuthenticatedUser();
        const settings = authUser.getSettings(this.tableColumnsUserSettingsKey);

        // set visible values
        // we shouldn't have empty arrays..no columns to display...
        // & determine what checkboxes should be displayed
        this.displayColumns = [];
        _.each(this.tableColumns, (column: VisibleColumnModel) => {
            if (!column.required) {
                if (!_.isEmpty(settings)) {
                    column.visible = _.indexOf(settings, column.field) > -1;
                }

                // clone column
                this.displayColumns.push(new VisibleColumnModel(column));
            }
        });

        // initialize visible data columns
        this.initializeVisibleTableColumns();
    }

    /**
     * Initialize Visible Table Columns
     */
    initializeVisibleTableColumns() {
        // construct visible table columns
        this.visibleTableColumns = [];
        this.visibleSaveTableColumns = [];
        _.each(this.tableColumns, (column: VisibleColumnModel) => {
            if (
                column.required ||
                column.visible
            ) {
                // set visible column
                this.visibleTableColumns.push(column.field);

                // set save fields
                if (!column.excludeFromSave) {
                    this.visibleSaveTableColumns.push(column.field);
                }
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
        let columns = _.get(
            fields,
            'select.columns',
            {}
        );

        // no visible columns ?
        if (_.isEmpty(_.filter(columns, (value) => value))) {
            this.snackbarService.showError('LNG_SIDE_COLUMNS_ERROR_NO_COLUMN_SELECTED');
            return;
        }

        // normalize fields
        // replace all sub-level fields with static strings
        const normalizedColumns = {};
        const normalize = (
            value: boolean | {},
            key: string,
            parentKey: string = ''
        ) => {
            if (_.isBoolean(value)) {
                normalizedColumns[parentKey + key] = value;
            } else {
                _.each(value, (childValue, childKey) => {
                    normalize(
                        childValue,
                        childKey,
                        `${parentKey}${key}.`
                    );
                });
            }
        };
        _.each(columns, (value, key) => {
            normalize(
                value,
                key
            );
        });
        columns = normalizedColumns;

        // set fields visibility
        _.each(this.tableColumns, (column: VisibleColumnModel) => {
            column.visible = !!columns[column.field];
        });

        // initialize visible data columns
        this.initializeVisibleTableColumns();

        // save visible columns
        this.loading = true;
        this.authDataService.updateSettingsForCurrentUser(
            this.tableColumnsUserSettingsKey,
            this.visibleSaveTableColumns
        ).subscribe(() => {
            this.loading = false;
        });

        // close side nav
        this.closeSideNav();
    }
}
