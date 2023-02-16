import { ChangeDetectionStrategy, Component, EventEmitter, Injectable, Input, OnDestroy, Output } from '@angular/core';
import { IBasicCount } from '../../../core/models/basic-count.interface';
import { MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { Subscription } from 'rxjs';
import { DecimalPipe } from '@angular/common';

@Injectable()
class CustomMatPaginatorIntl
  extends MatPaginatorIntl
  implements OnDestroy {

  // language handler
  languageSubscription: Subscription;

  /**
   * Constructor
   */
  constructor(
    private i18nService: I18nService,
    private parentComponent: MatPaginatorExtendedComponent,
    private decimalPipe: DecimalPipe
  ) {
    // base
    super();

    // initial translation
    this.updateTranslations();

    // subscribe to language change
    this.refreshLanguageTokens();
  }

  /**
   * Destroyed
   */
  ngOnDestroy() {
    // stop refresh language tokens
    this.releaseLanguageListener();
  }

  /**
   *  Subscribe to language change
   */
  private refreshLanguageTokens() {
    // stop refresh language tokens
    this.releaseLanguageListener();

    // attach event
    this.languageSubscription = this.i18nService.languageChangedEvent
      .subscribe(() => {
        this.updateTranslations();
      });
  }

  /**
   * Release language listener
   */
  private releaseLanguageListener() {
    // release language listener
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
      this.languageSubscription = null;
    }
  }

  /**
   * Update translations
   */
  private updateTranslations(): void {
    this.itemsPerPageLabel = this.i18nService.instant('LNG_COMMON_LABEL_PAGINATOR_ITEMS_PER_PAGE');
    this.firstPageLabel = this.i18nService.instant('LNG_COMMON_LABEL_PAGINATOR_FIRST_PAGE');
    this.lastPageLabel = this.i18nService.instant('LNG_COMMON_LABEL_PAGINATOR_LAST_PAGE');
    this.nextPageLabel = this.i18nService.instant('LNG_COMMON_LABEL_PAGINATOR_NEXT_PAGE');
    this.previousPageLabel = this.i18nService.instant('LNG_COMMON_LABEL_PAGINATOR_PREVIOUS_PAGE');
  }

  /**
   * Overwrite what is rendered in paginator
   */
  getRangeLabel = (
    page: number,
    pageSize: number,
    length: number
  ): string => {
    // determine start & end
    let start: number = 0, end: number = 0;
    if (length > 0) {
      start = (page * pageSize) + 1;
      end = Math.min(
        (page + 1) * pageSize,
        length
      );
    }

    // determine the label that we need to display
    let pageLabel: string;
    if (start === end) {
      pageLabel = `${start}`;
    } else {
      pageLabel = `${start} ${this.i18nService.instant('LNG_COMMON_LABEL_PAGINATOR_RANGE_PAGE_START_END')} ${end}`;
    }

    // no need to display all range ?
    if (this.parentComponent.shortRange) {
      return pageLabel;
    }

    // range label
    return this.parentComponent.countData?.hasMore ?
      this.i18nService.instant(
        'LNG_COMMON_LABEL_PAGINATOR_RANGE', {
          pageLabel,
          length: this.decimalPipe.transform(length),
          beforeLength: this.i18nService.instant('LNG_COMMON_LABEL_PAGINATOR_COUNT_BEFORE_LENGTH'),
          afterLength: this.i18nService.instant('LNG_COMMON_LABEL_PAGINATOR_COUNT_AFTER_LENGTH')
        }
      ) :
      this.i18nService.instant(
        'LNG_COMMON_LABEL_PAGINATOR_RANGE', {
          pageLabel,
          length: this.decimalPipe.transform(length),
          beforeLength: '',
          afterLength: this.i18nService.instant('LNG_COMMON_LABEL_PAGINATOR_COUNT_AFTER_LENGTH')
        }
      );
  };
}

@Component({
  selector: 'app-mat-paginator-extended',
  templateUrl: './mat-paginator-extended.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    DecimalPipe,
    {
      provide: MatPaginatorIntl,
      useClass: CustomMatPaginatorIntl,
      deps: [
        I18nService,
        MatPaginatorExtendedComponent,
        DecimalPipe
      ]
    }
  ]
})
export class MatPaginatorExtendedComponent {
  // data
  @Input() countData: IBasicCount;
  @Input() pageIndex: number;
  @Input() pageSize: number;
  @Input() pageSizeOptions: number[];
  @Input() hidePageSize: boolean;
  @Input() shortRange: boolean;

  // disabled
  @Input() disabled: boolean = false;

  // events
  @Output() page: EventEmitter<PageEvent> = new EventEmitter<PageEvent>();
}
