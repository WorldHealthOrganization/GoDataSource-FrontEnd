import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { IData } from 'billboard.js/src/ChartInternal/data/IData';

if (environment.production) {
  enableProdMode();
}

// disable warnings for now
// #TODO remove once proper fix
({} as IData);

// eslint-disable-next-line no-console
platformBrowserDynamic().bootstrapModule(AppModule).catch((err) => console.log(err));
