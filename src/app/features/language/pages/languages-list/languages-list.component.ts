import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { LanguageDataService } from '../../../../core/services/data/language.data.service';
import { LanguageModel } from '../../../../core/models/language.model';
import { DialogAnswer, DialogAnswerButton, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { catchError, share } from 'rxjs/operators';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-languages-list',
  templateUrl: './languages-list.component.html'
})
export class LanguagesListComponent
  extends ListComponent
  implements OnInit, OnDestroy {

  // breadcrumbs
  // breadcrumbs: BreadcrumbItemModel[] = [
  //   new BreadcrumbItemModel('LNG_PAGE_LIST_LANGUAGES_TITLE', '.', true)
  // ];

  // constants
  LanguageModel = LanguageModel;

  // list of existing languages
  languagesList$: Observable<LanguageModel[]>;
  languagesListCount$: Observable<IBasicCount>;

  recordActions: HoverRowAction[] = [
    // View Language
    new HoverRowAction({
      icon: 'visibility',
      iconTooltip: 'LNG_PAGE_LIST_LANGUAGES_ACTION_VIEW_LANGUAGE',
      linkGenerator: (item: LanguageModel): string[] => {
        return ['/languages', item.id, 'view'];
      },
      visible: (): boolean => {
        return LanguageModel.canView(this.authUser);
      }
    }),

    // Modify Language
    new HoverRowAction({
      icon: 'settings',
      iconTooltip: 'LNG_PAGE_LIST_LANGUAGES_ACTION_MODIFY_LANGUAGE',
      linkGenerator: (item: LanguageModel): string[] => {
        return ['/languages', item.id, 'modify'];
      },
      visible: (item: LanguageModel): boolean => {
        return !item.readOnly &&
                    LanguageModel.canModify(this.authUser);
      }
    }),

    // Other actions
    new HoverRowAction({
      type: HoverRowActionType.MENU,
      icon: 'moreVertical',
      menuOptions: [
        // Delete Language
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_LANGUAGES_ACTION_DELETE_LANGUAGE',
          click: (item: LanguageModel) => {
            this.deleteLanguage(item);
          },
          visible: (item: LanguageModel): boolean => {
            return !item.readOnly &&
                            LanguageModel.canDelete(this.authUser);
          },
          class: 'mat-menu-item-delete'
        }),

        // Divider
        new HoverRowAction({
          type: HoverRowActionType.DIVIDER,
          visible: (item: LanguageModel): boolean => {
            // visible only if at least one of the previous...
            return !item.readOnly &&
                            LanguageModel.canDelete(this.authUser);
          }
        }),

        // Export Language Tokens
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_LANGUAGES_ACTION_EXPORT_TOKENS',
          click: (item: LanguageModel) => {
            this.downloadLanguage(item);
          },
          visible: (): boolean => {
            return LanguageModel.canExportTokens(this.authUser);
          }
        }),

        // import Language Tokens
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_LANGUAGES_ACTION_IMPORT_TOKENS',
          click: (item: LanguageModel) => {
            this.router.navigate(['/import-export-data', 'language-data', item.id, 'import-tokens']);
          },
          visible: (): boolean => {
            return LanguageModel.canImportTokens(this.authUser);
          },
          class: 'mat-menu-item-delete'
        })
      ]
    })
  ];

  /**
     * Constructor
     */
  constructor(
    protected listHelperService: ListHelperService,
    private router: Router,
    private languageDataService: LanguageDataService,
    private toastV2Service: ToastV2Service,
    private dialogService: DialogService
  ) {
    super(listHelperService);
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    // initialize pagination
    this.initPaginator();

    // ...and re-load the list when the Selected Outbreak is changed
    this.needsRefreshList(true);
  }

  /**
     * Release resources
     */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();
  }

  /**
   * Initialize Side Table Columns
   */
  protected initializeTableColumns(): void {}

  /**
   * Initialize table infos
   */
  protected initializeTableInfos(): void {}

  /**
   * Initialize Table Advanced Filters
   */
  protected initializeTableAdvancedFilters(): void {}

  /**
   * Initialize table quick actions
   */
  protected initializeQuickActions(): void {}

  /**
   * Initialize table group actions
   */
  protected initializeGroupActions(): void {}

  /**
   * Initialize table add action
   */
  protected initializeAddAction(): void {}

  /**
   * Initialize table grouped data
   */
  protected initializeGroupedData(): void {}

  /**
     * Table columns
     */
  tableHeaderColumns(): string[] {
    return [
      'name'
    ];
  }

  /**
   * Initialize breadcrumbs
   */
  initializeBreadcrumbs(): void {
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [];
  }

  /**
   * Re(load) the Languages list
   */
  refreshList() {
    // retrieve the list of Languages
    this.languagesList$ = this.languageDataService
      .getLanguagesList(this.queryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        })
      );
  }

  /**
     * Get total number of items, based on the applied filters
     */
  refreshListCount() {
    // remove paginator from query builder
    const countQueryBuilder = _.cloneDeep(this.queryBuilder);
    countQueryBuilder.paginator.clear();
    countQueryBuilder.sort.clear();
    this.languagesListCount$ = this.languageDataService
      .getLanguagesCount(countQueryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        }),
        share()
      );
  }

  /**
     * Delete language
     * @param {LanguageModel} language
     */
  deleteLanguage(language: LanguageModel) {
    // show confirm dialog
    this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_LANGUAGE', language)
      .subscribe((answer: DialogAnswer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          // delete language
          // this.showLoadingDialog();
          this.languageDataService
            .deleteLanguage(language.id)
            .pipe(
              catchError((err) => {
                // this.closeLoadingDialog();
                this.toastV2Service.error(err);
                return throwError(err);
              })
            )
            .subscribe(() => {
              // this.closeLoadingDialog();

              this.toastV2Service.success('LNG_PAGE_LIST_LANGUAGES_ACTION_DELETE_SUCCESS_MESSAGE');

              // reload data
              this.needsRefreshList(true);
            });
        }
      });
  }

  /**
     * Download Language
     * @param language
     */
  downloadLanguage(language: LanguageModel) {
    // display export dialog
    this.dialogService.showExportDialog({
      message: 'LNG_PAGE_LIST_LANGUAGES_ACTION_EXPORT_TOKENS_DIALOG_TITLE',
      url: `languages/${language.id}/language-tokens/export`,
      fileName: language.name,
      fileType: ExportDataExtension.XLSX
      // exportStart: () => { this.showLoadingDialog(); },
      // exportFinished: () => { this.closeLoadingDialog(); }
    });
  }
}
