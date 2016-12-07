///<reference path="tsd.d.ts"/>

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app.module';
require('./styles/basic.scss');

const platform = platformBrowserDynamic();
platform.bootstrapModule(AppModule);
