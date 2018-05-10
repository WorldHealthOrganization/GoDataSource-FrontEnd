// modules
import { NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { HttpInterceptorService } from './services/helper/http-interceptor.service';

// services
import * as fromCoreServices from './services';

@NgModule({
    imports: [
        HttpClientModule
    ],
    declarations: [],
    providers: [
        fromCoreServices.services
    ],
    exports: []
})
export class CoreModule {
    static forRoot() {
        return {
            ngModule: CoreModule,
            providers: [
                { provide: HTTP_INTERCEPTORS, useClass: HttpInterceptorService, multi: true }
            ]
        };
    }
}
