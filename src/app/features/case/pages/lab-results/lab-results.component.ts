import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Observable } from 'rxjs/Observable';
import { LabResultDataService } from '../../../../core/services/data/lab-result.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';

@Component({
    selector: 'app-lab-results',
    templateUrl: './lab-results.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['./lab-results.component.less']
})
export class LabResultsComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_LAB_RESULTS_TITLE', ''),
    ];


    constructor() {
    }

    ngOnInit() {

    }

}
