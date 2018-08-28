import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ImportExportRecordType } from '../../../../core/models/constants';
import { FileItem, FileLikeObject, FileUploader, ParsedResponseHeaders } from 'ng2-file-upload';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { environment } from '../../../../../environments/environment';
import { CacheKey, CacheService } from '../../../../core/services/helper/cache.service';

@Component({
    selector: 'app-import-data',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './import-data.component.html',
    styleUrls: ['./import-data.component.less']
})
export class ImportDataComponent implements OnInit {
    // 'text/csv': [ '.csv' ],
    // 'application/vnd.ms-excel': [ '.xls' ],
    // 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [ '.xlsx' ],
    // 'text/xml': [ '.xml' ],
    // 'application/vnd.oasis.opendocument.spreadsheet': [ '.ods' ],
    // 'application/json': [ '.json' ]
    private _importConfiguration: {
        [ importKey: string ]: {
            mimes: string[],
            extensions: string[],
            title: string,
            importFileUrl: string,
            listPageUrl: string,
            executeBeforeRedirect?: () => void
        }
    } = {
        [ImportExportRecordType.HIERARCHICAL_LOCATIONS]: {
            mimes: [
                'text/xml',
                'application/json'
            ],
            extensions: [
                '.xml',
                '.json'
            ],
            title: 'LNG_PAGE_IMPORT_DATA_TITLE_LOCATIONS',
            importFileUrl: 'locations/import',
            executeBeforeRedirect: () => {
                this.cacheService.remove(CacheKey.LOCATIONS);
            },
            listPageUrl: '/locations'
        }
    };

    // type of the record that we're importing
    type: ImportExportRecordType;

    // handle upload files
    uploader: FileUploader;

    // file over dropzone
    hasFileOver: boolean = false;

    breadcrumbs: BreadcrumbItemModel[] = [];
    translationData = {};

    displayLoading: boolean = false;
    progress: number = null;

    ImportExportRecordType = ImportExportRecordType;

    /**
     * Allowed mime types
     */
    public get allowedMimeTypes(): string[] {
        return this.type && this._importConfiguration[this.type] ?
            this._importConfiguration[this.type].mimes :
            [];
    }

    /**
     * Allowed extensions
     */
    public get allowedExtensions(): string[] {
        return this.type && this._importConfiguration[this.type] ?
            this._importConfiguration[this.type].extensions :
            [];
    }

    /**
     * Title
     */
    public get title(): string {
        return this.type && this._importConfiguration[this.type] ?
            this._importConfiguration[this.type].title :
            '';
    }

    /**
     * Import file url
     */
    public get importFileUrl(): string {
        return this.type && this._importConfiguration[this.type] ?
            this._importConfiguration[this.type].importFileUrl :
            '';
    }

    /**
     * Constructor
     * @param router
     * @param route
     */
    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        private snackbarService: SnackbarService,
        private authDataService: AuthDataService,
        private cacheService: CacheService
    ) {
        // retrieve type of records that we want to import
        this.route.params
            .subscribe((params: { type: ImportExportRecordType }) => {
                // since we have only two types this should be enough for now
                this.type = params.type;

                // check if type is valid
                if (
                    !Object.values(ImportExportRecordType).includes(this.type) ||
                    !this._importConfiguration[this.type]
                ) {
                    // invalid - redirect
                    this.router.navigate(['/']);
                }

                // configurations
                this.breadcrumbs = [
                    new BreadcrumbItemModel(
                        this.title,
                        '',
                        true
                    )
                ];
                this.translationData = {
                    types: this.allowedExtensions.join(', ')
                };
            });
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // init uploader
        this.uploader = new FileUploader({
            allowedMimeType: this.allowedMimeTypes,
            url: `${environment.apiUrl}/${this.importFileUrl}`,
            authToken: this.authDataService.getAuthToken()
        });

        // don't allow multiple files to be added
        // we could set queueLimit to 1, but we won't be able to replace the file that way
        this.uploader.onAfterAddingAll = (files: any[]) => {
            if (files.length > 1) {
                // display error
                this.snackbarService.showError(
                    'LNG_PAGE_IMPORT_DATA_ERROR_ONLY_ONE_FILE_CAN_BE_ATTACHED',
                    this.translationData
                );

                // remove all items
                this.uploader.clearQueue();
            }
        };

        // don't allow multiple files to be uploaded
        // we could set queueLimit to 1, but we won't be able to replace the file that way
        this.uploader.onAfterAddingFile = () => {
            // check if we need to replace existing item
            if (this.uploader.queue.length > 1) {
                // remove old item
                this.uploader.removeFromQueue(this.uploader.queue[0]);
            }
        };

        // handle errors when trying to upload files
        this.uploader.onWhenAddingFileFailed = (item: FileLikeObject, filter: any) => {
            switch (filter.name) {
                case 'mimeType':
                    // display error
                    this.snackbarService.showError(
                        'LNG_PAGE_IMPORT_DATA_ERROR_FILE_NOT_SUPPORTED',
                        this.translationData
                    );
                    break;
                default:
                    // display error
                    this.snackbarService.showError(
                        'LNG_PAGE_IMPORT_DATA_ERROR_DEFAULT_ATTACH',
                        this.translationData
                    );
            }
        };

        // handle server errors
        this.uploader.onErrorItem = () => {
            // display error
            this.snackbarService.showError(
                'LNG_PAGE_IMPORT_DATA_ERROR_PROCESSING_FILE',
                this.translationData
            );

            // display form
            this.displayLoading = false;
            this.progress = null;
        };

        // handle file upload progress
        this.uploader.onProgressItem = (fileItem: FileItem, progress: any) => {
            this.progress = Math.round(progress);
        };

        // everything went smoothly ?
        this.uploader.onCompleteItem = (item: FileItem, response: string, status: number) => {
            // an error occurred ?
            if (status !== 200) {
                return;
            }

            // display success
            this.snackbarService.showSuccess(
                'LNG_PAGE_IMPORT_DATA_FILE_PROCESSED_SUCCESS_MESSAGE',
                this.translationData
            );

            // cleanup before changing page
            if (this._importConfiguration[this.type].executeBeforeRedirect) {
                this._importConfiguration[this.type].executeBeforeRedirect();
            }

            // redirect to list page
            this.router.navigate([this._importConfiguration[this.type].listPageUrl]);
        };
    }

    /**
     * File hover dropzone
     * @param e
     */
    public hoverDropZone(hasFileOver: boolean) {
        this.hasFileOver = hasFileOver;
    }

    /**
     * Upload file
     */
    public uploadFile() {
        // display loading
        this.displayLoading = true;
        this.progress = 0;

        // start uploading data - upload all not working if an error occurred when trying to upload this file, so we couldn't try again
        this.uploader.queue[0].upload();
    }
}
