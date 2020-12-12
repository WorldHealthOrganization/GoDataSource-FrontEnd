import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { NgForm } from '@angular/forms';
import { IconModel } from '../../../../core/models/icon.model';
import { FileItem, FileLikeObject, FileUploader } from 'ng2-file-upload';
import { environment } from '../../../../../environments/environment';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { UserModel } from '../../../../core/models/user.model';

export enum IconExtension {
    PNG = '.png',
    JPG = '.jpg',
    JPEG = '.jpeg',
    BMP = '.bmp'
}

@Component({
    selector: 'app-manage-icons-create',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './manage-icons-create.component.html',
    styleUrls: ['./manage-icons-create.component.less']
})
export class ManageIconsCreateComponent extends ConfirmOnFormChanges implements OnInit {
    // Breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // Extension mapped to mimes
    private allowedMimeTypes: string[] = [];
    private allowedMimeTypesMap = {
        [IconExtension.PNG]: 'image/png',
        [IconExtension.JPG]: 'image/jpeg',
        [IconExtension.JPEG]: 'image/jpeg',
        [IconExtension.BMP]: 'image/bmp'
    };

    // Category Name
    category: ReferenceDataCategoryModel;

    // Icon Model
    icon: IconModel = new IconModel();

    // File uploader
    uploader: FileUploader;

    // Allowed extensions
    _allowedExtensions: string[];
    set allowedExtensions(allowedExtensions: string[]) {
        // extensions
        this._allowedExtensions = allowedExtensions;
        this.translationData.types = this.allowedExtensions.join(', ');

        // mimes
        this.allowedMimeTypes = this.allowedExtensions.map((extension: string): string => {
            return this.allowedMimeTypesMap[extension] ?
                this.allowedMimeTypesMap[extension] :
                extension;
        });
    }
    get allowedExtensions(): string[] {
        return this._allowedExtensions;
    }

    // Variables sent to translation pipe
    translationData: {
        types?: string
    } = {};

    // Cursor is over drag-drop file zone
    hasFileOver: boolean = false;

    // Percent displayed when uploading a file
    progress: number = null;

    // Display spinner when True, otherwise display the form
    displayLoading: boolean = false;

    // authenticated user
    authUser: UserModel;

    /**
     * Constructor
     */
    constructor(
        protected route: ActivatedRoute,
        private referenceDataDataService: ReferenceDataDataService,
        private authDataService: AuthDataService,
        private formHelper: FormHelperService,
        private snackbarService: SnackbarService,
        private router: Router
    ) {
        super();
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // extensions
        this.allowedExtensions = [
            IconExtension.PNG,
            IconExtension.JPG,
            IconExtension.JPEG,
            IconExtension.BMP
        ];

        // initialize uploader
        this.configureUploader();

        // get the query params
        this.route.queryParams
            .subscribe((params: { categoryId?: string }) => {
                // retrieve Reference Data Category info
                if (!params.categoryId) {
                    // update breadcrumbs
                    this.initializeBreadcrumbs();
                } else {
                    this.retrieveCategory(params.categoryId);
                }
            });
    }

    /**
     * Initialize breadcrumbs
     */
    initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // add reference categories list breadcrumb only if we have permission
        if (ReferenceDataCategoryModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE', '/reference-data')
            );
        }

        // add cluster list breadcrumb only if we have permission
        if (IconModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    'LNG_PAGE_REFERENCE_DATA_MANAGE_ICONS_LIST_TITLE',
                    '/reference-data/manage-icons/list',
                    false, {
                        categoryId: this.category ? this.category.id : undefined
                    }
                )
            );
        }

        // add category
        if (
            this.category &&
            ReferenceDataEntryModel.canList(this.authUser)
        ) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    this.category.name,
                    `/reference-data/${this.category.id}`,
                    false,
                    {},
                    this.category
                )
            );
        }

        // add manage icons breadcrumb
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                'LNG_PAGE_REFERENCE_DATA_MANAGE_ICONS_CREATE_TITLE',
                '',
                true
            )
        );
    }

    /**
     * Retrieve category
     * @param categoryId
     */
    retrieveCategory(categoryId: string) {
        this.referenceDataDataService
            .getReferenceDataByCategory(categoryId)
            .subscribe((category: ReferenceDataCategoryModel) => {
                // set category
                this.category = category;

                // update breadcrumbs
                this.initializeBreadcrumbs();
            });
    }

    /**
     * File hover dropzone
     * @param hasFileOver
     */
    public hoverDropZone(hasFileOver: boolean) {
        this.hasFileOver = hasFileOver;
    }

    /**
     * Display error
     * @param messageToken
     * @param hideLoading
     */
    private displayError(
        messageToken: string,
        hideLoading: boolean = false
    ) {
        // display toast
        this.snackbarService.showError(
            messageToken,
            this.translationData
        );

        // hide loading
        if (hideLoading) {
            // display form
            this.displayLoading = false;
            this.progress = null;
        }
    }

    /**
     * Initialize uploader
     */
    configureUploader() {
        // init
        this.uploader = new FileUploader({
            allowedMimeType: this.allowedMimeTypes,
            authToken: this.authDataService.getAuthToken(),
            url: `${environment.apiUrl}/icons`
        });

        // don't allow multiple files to be added
        // we could set queueLimit to 1, but we won't be able to replace the file that way
        this.uploader.onAfterAddingAll = (files: any[]) => {
            if (files.length > 1) {
                // display error
                this.displayError('LNG_PAGE_REFERENCE_DATA_MANAGE_ICONS_CREATE_ERROR_ONLY_ONE_FILE_CAN_BE_ATTACHED');

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
                    this.displayError('LNG_PAGE_REFERENCE_DATA_MANAGE_ICONS_CREATE_ERROR_FILE_NOT_SUPPORTED');
                    break;
                default:
                    // display error
                    this.displayError('LNG_PAGE_REFERENCE_DATA_MANAGE_ICONS_CREATE_ERROR_DEFAULT_ATTACH');
            }
        };

        // handle server errors
        this.uploader.onErrorItem = () => {
            // display error
            this.displayError(
                'LNG_PAGE_REFERENCE_DATA_MANAGE_ICONS_CREATE_ERROR_PROCESSING_FILE',
                true
            );
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

            // redirect to list page
            this.disableDirtyConfirm();
            this.router.navigate(
                ['/reference-data', 'manage-icons', 'list'], {
                    queryParams: {
                        categoryId: this.category ? this.category.id : undefined
                    }
                }
            );
        };
    }

    /**
     * Create new Icon
     * @param form
     */
    createNewIcon(form: NgForm) {
        // validate form
        if (!this.formHelper.validateForm(form)) {
            // invalid form
            return;
        }

        // check if a file was attached
        if (
            !this.uploader ||
            this.uploader.queue.length < 1
        ) {
            this.snackbarService.showError('LNG_PAGE_REFERENCE_DATA_MANAGE_ICONS_CREATE_WARNING_IMG_REQUIRED');
            return;
        }

        // attach dirty fields
        const dirtyFields: any = this.formHelper.getDirtyFields(form);
        this.uploader.options.additionalParameter = dirtyFields;

        // set upload key
        this.uploader.queue[0].alias = 'icon';

        // initialize upload spinner
        this.displayLoading = true;
        this.progress = 0;

        // start uploading data
        this.uploader.queue[0].upload();
    }
}
