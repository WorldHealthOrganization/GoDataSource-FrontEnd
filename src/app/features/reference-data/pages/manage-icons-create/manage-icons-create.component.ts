import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { NgForm } from '@angular/forms';
import { IconModel } from '../../../../core/models/icon.model';
import { FileItem, FileLikeObject, FileUploader } from 'ng2-file-upload';
import { environment } from '../../../../../environments/environment';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { UserModel } from '../../../../core/models/user.model';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { IV2ActionIconLabel, V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';

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
  styleUrls: ['./manage-icons-create.component.scss']
})
export class ManageIconsCreateComponent extends ConfirmOnFormChanges implements OnInit {
  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[] = [];

  @ViewChild('form', { static: true }) form: NgForm;

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

  // action
  actionButton: IV2ActionIconLabel;

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
    protected activatedRoute: ActivatedRoute,
    private authDataService: AuthDataService,
    private formHelper: FormHelperService,
    private toastV2Service: ToastV2Service,
    private router: Router
  ) {
    // parent
    super();

    // retrieve data
    this.category = this.activatedRoute.snapshot.data.category;
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

    // action button
    this.actionButton = {
      type: V2ActionType.ICON_LABEL,
      icon: '',
      label: 'LNG_COMMON_BUTTON_SAVE',
      action: {
        click: () => {
          this.createNewIcon(this.form);
        }
      },
      disable: () => {
        return this.displayLoading;
      }
    };

    // breadcrumbs
    this.initializeBreadcrumbs();
  }

  /**
     * Initialize breadcrumbs
     */
  initializeBreadcrumbs() {
    // reset
    this.breadcrumbs = [{
      label: 'LNG_COMMON_LABEL_HOME',
      action: {
        link: DashboardModel.canViewDashboard(this.authUser) ?
          ['/dashboard'] :
          ['/account/my-profile']
      }
    }];

    // add reference categories list breadcrumb only if we have permission
    if (ReferenceDataCategoryModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE',
        action: {
          link: ['/reference-data']
        }
      });
    }

    // add cluster list breadcrumb only if we have permission
    if (IconModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_REFERENCE_DATA_MANAGE_ICONS_LIST_TITLE',
        action: {
          link: ['/reference-data/manage-icons/list'],
          linkQueryParams: {
            categoryId: this.category ? this.category.id : undefined
          }
        }
      });
    }

    // add category
    if (
      this.category &&
      ReferenceDataEntryModel.canList(this.authUser)
    ) {
      this.breadcrumbs.push({
        label: this.category.name,
        action: {
          link: [`/reference-data/${this.category.id}`],
          linkQueryParams: {
            categoryId: this.category ? this.category.id : undefined
          }
        }
      });
    }

    // current page
    this.breadcrumbs.push({
      label: 'LNG_PAGE_REFERENCE_DATA_MANAGE_ICONS_CREATE_TITLE',
      action: null
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
    this.toastV2Service.error(
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
      url: `${environment.apiUrl}/icons`,
      headers: [{
        name: 'platform',
        value: 'WEB'
      }]
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
    this.uploader.onWhenAddingFileFailed = (_item: FileLikeObject, filter: any) => {
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
    this.uploader.onProgressItem = (_fileItem: FileItem, progress: any) => {
      this.progress = Math.round(progress);
    };

    // everything went smoothly ?
    this.uploader.onCompleteItem = (_item: FileItem, _response: string, status: number) => {
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
      this.toastV2Service.error('LNG_PAGE_REFERENCE_DATA_MANAGE_ICONS_CREATE_WARNING_IMG_REQUIRED');
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
