import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { FileItem, FileLikeObject, FileUploader } from 'ng2-file-upload';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-import-data',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './import-data.component.html',
    styleUrls: ['./import-data.component.less']
})
export class ImportDataComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [];

    // mimes
    private _allowedMimeTypes: string[];
    @Input() set allowedMimeTypes(mimes: string[]) {
        this._allowedMimeTypes = mimes;
        if (this.uploader) {
            this.uploader.options.allowedMimeType = this.allowedMimeTypes;
        }
    }
    get allowedMimeTypes(): string[] {
        return this._allowedMimeTypes ? this._allowedMimeTypes : [];
    }

    // extensions
    private _allowedExtensions: string[];
    @Input() set allowedExtensions(extensions: string[]) {
        this._allowedExtensions = extensions;

        this.translationData.types = this.allowedExtensions.join(', ');
    }
    get allowedExtensions(): string[] {
        return this._allowedExtensions ? this._allowedExtensions : [];
    }

    // title
    private _title: string = ''
    @Input() set title(value: string) {
        this._title = value;

        this.breadcrumbs = [
            new BreadcrumbItemModel(
                this.title,
                '',
                true
            )
        ];
    }
    get title(): string {
        return this._title;
    }

    /**
     * Tell system if this doesn't need to go through map step, uploading file is enough
     */
    @Input() isOneStep: boolean = false;

    // handle upload files
    uploader: FileUploader;

    // file over dropzone
    hasFileOver: boolean = false;

    translationData: {
        types?: string
    } = {};

    @Input() displayLoading: boolean = false;
    progress: number = null;

    @Input() importSuccessMessage: string = 'LNG_PAGE_IMPORT_DATA_SUCCESS_MESSAGE';

    // finished - imported data with success
    @Output() finished = new EventEmitter<void>();

    private _importFileUrl: string;
    @Input() set importFileUrl(value: string) {
        this._importFileUrl = value;

        if (this.uploader) {
            this.uploader.options.url = `${environment.apiUrl}/${this.importFileUrl}`;
        }
    }
    get importFileUrl(): string {
        return this._importFileUrl;
    }

    /**
     * Constructor
     * @param router
     * @param route
     */
    constructor(
        private snackbarService: SnackbarService,
        private authDataService: AuthDataService
    ) {}

    /**
     * Component initialized
     */
    ngOnInit() {
        // init uploader
        this.uploader = new FileUploader({
            allowedMimeType: this.allowedMimeTypes,
            authToken: this.authDataService.getAuthToken(),
            url: `${environment.apiUrl}/${this.importFileUrl}`
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

            // we finished with one steppers
            if (this.isOneStep) {
                // display success
                this.snackbarService.showSuccess(
                    this.importSuccessMessage,
                    this.translationData
                );

                // emit finished event - event should handle redirect
                this.finished.emit();
            } else {
                // #TODO
                // this logic will be back on case lab
            }
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
