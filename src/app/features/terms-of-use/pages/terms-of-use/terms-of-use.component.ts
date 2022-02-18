import { Component } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';

@Component({
  selector: 'app-terms-of-use',
  templateUrl: './terms-of-use.component.html'
})
export class TermsOfUseComponent {
  // breadcrumbs
  breadcrumbs: BreadcrumbItemModel[] = [
    new BreadcrumbItemModel('LNG_PAGE_TERMS_OF_USE_TITLE', '.')
  ];
}
