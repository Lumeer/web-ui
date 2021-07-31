/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {ErrorHandler, Injectable} from '@angular/core';
import * as Sentry from '@sentry/browser';
import {ConfigurationService} from '../../configuration/configuration.service';

@Injectable()
export class SentryErrorHandler implements ErrorHandler {
  constructor(private configurationService: ConfigurationService) {
    this.init();
  }

  private init() {
    if (this.configurationService.getConfiguration().sentryDsn) {
      Sentry.init({
        dsn: this.configurationService.getConfiguration().sentryDsn,
        release: this.configurationService.getConfiguration().buildNumber,
        environment: this.configurationService.getConfiguration().name || '',
      });
    }
  }

  public handleError(error: any): void {
    if (/Loading chunk [\d]+ failed/.test(error?.message)) {
      window.location.reload();
      return;
    }

    if (this.configurationService.getConfiguration().sentryDsn) {
      Sentry.captureException(error.originalError || error);
    }

    throw error;
  }
}
