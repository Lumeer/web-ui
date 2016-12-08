///<reference path="tsd.d.ts"/>

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app.module';
import {KeycloakService} from './services/keycloak.service';
require('./styles/basic.scss');

KeycloakService.init()
  .then(() => {
    const platform = platformBrowserDynamic();
    platform.bootstrapModule(AppModule);
  });
