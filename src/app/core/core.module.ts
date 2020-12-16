// modules
import { NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { RequestInterceptor } from './services/interceptors/request.interceptor';
import { ResponseInterceptor } from './services/interceptors/response.interceptor';

import { SharedModule } from '../shared/shared.module';

// components
import * as fromCoreComponents from './components';

// services
import * as fromCoreServices from './services';

@NgModule({
    imports: [
        HttpClientModule,
        SharedModule
    ],
    declarations: [
        ...fromCoreComponents.components
    ],
    providers: [
        ...fromCoreServices.services,
        {provide: HTTP_INTERCEPTORS, useClass: RequestInterceptor, multi: true},
        {provide: HTTP_INTERCEPTORS, useClass: ResponseInterceptor, multi: true}
    ],
    exports: [
        ...fromCoreComponents.components
    ]
})
export class CoreModule {

}
