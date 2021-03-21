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

import {Injectable} from '@angular/core';
import {ConfigurationService} from '../configuration/configuration.service';

const STORE_KEY = 'last_activity';

@Injectable({
  providedIn: 'root',
})
export class UserActivityService {
  private lastActivity = Date.now();

  constructor(private configurationService: ConfigurationService) {}

  public resetUserInteraction() {
    this.setLastActivity(Date.now());
  }

  public onUserInteraction() {
    this.setLastActivity(Date.now());
  }

  public getLastActivity(): number {
    if (this.configurationService.getConfiguration().publicView) {
      return Date.now();
    }
    if (localStorage.getItem(STORE_KEY)) {
      return parseInt(localStorage.getItem(STORE_KEY), 10);
    }
    return this.lastActivity;
  }

  public getLastActivityBeforeMinutes(): number {
    const lastActivity = this.lastActivity;
    return (Date.now() - lastActivity) / 1000 / 60;
  }

  private setLastActivity(lastActivity: number) {
    if (!this.configurationService.getConfiguration().publicView) {
      // some browsers doesn't support access to localStorage in iframe
      localStorage.setItem(STORE_KEY, lastActivity.toString());
    }
    this.lastActivity = lastActivity;
  }
}
