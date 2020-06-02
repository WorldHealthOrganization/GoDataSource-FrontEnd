import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SnackbarHelperService {

    // Subject to pass error messages to snackbar component
    errorSubject: Subject<any> = new Subject<any>();
    // Subject to pass data from snackbar component to snackbar service for error handling
    snackbarsOpenedSubject: Subject<boolean> = new Subject<boolean>();

    constructor() {}
}
