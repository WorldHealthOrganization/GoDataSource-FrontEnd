import { Injectable } from '@angular/core';
import { SnackbarService } from './snackbar.service';
import { ListFilterDataService } from '../data/list-filter.data.service';
import { Params } from '@angular/router';
import { Observable } from 'rxjs/internal/Observable';

@Injectable()
export class ListHelperService {
    /**
     * Constructor
     * Used to easily inject services to list-component that is used to extend all list page compoenents
     */
    constructor(
        public snackbarService: SnackbarService,
        public listFilterDataService: ListFilterDataService,
        public queryParams: Observable<Params>
    ) {}
}

