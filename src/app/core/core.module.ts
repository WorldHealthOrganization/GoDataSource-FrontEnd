// modules
import { NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { RequestInterceptor } from './services/interceptors/request.interceptor';
import { ResponseInterceptor } from './services/interceptors/response.interceptor';

// services
import * as fromCoreServices from './services';

@NgModule({
    imports: [
        HttpClientModule
    ],
    declarations: [],
    providers: [
        fromCoreServices.services,
        {provide: HTTP_INTERCEPTORS, useClass: RequestInterceptor, multi: true},
        {provide: HTTP_INTERCEPTORS, useClass: ResponseInterceptor, multi: true}
    ],
    exports: []
})
export class CoreModule {

}
