import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SnackbarHelperService {

    errorSubject: Subject<any> = new Subject<any>();
    snackbarsOpenedSubject: Subject<boolean> = new Subject<boolean>();

    constructor() {

    }
}
