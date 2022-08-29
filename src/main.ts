import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import * as moment from 'moment';

if (environment.production) {
  enableProdMode();
}

// disable deprecation warnings for now
// #TODO - enable deprecation warning by removing this code once this is addressed in the entire website
(moment as any).suppressDeprecationWarnings = true;

// eslint-disable-next-line no-console
platformBrowserDynamic().bootstrapModule(AppModule).catch(err => console.log(err));
