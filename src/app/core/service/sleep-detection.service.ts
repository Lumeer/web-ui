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

import {Store} from '@ngrx/store';

import {AuthService} from '../../auth/auth.service';
import {ConfigurationService} from '../../configuration/configuration.service';
import {AppState} from '../store/app.state';
import {ProjectsAction} from '../store/projects/projects.action';
import {UsersAction} from '../store/users/users.action';

@Injectable({
  providedIn: 'root',
})
export class SleepDetectionService {
  constructor(
    private store$: Store<AppState>,
    private authService: AuthService,
    private configurationService: ConfigurationService
  ) {
    if (this.configurationService.getConfiguration().auth) {
      this.setupWorker();
    }
  }

  private setupWorker() {
    const worker = new Worker('sleep-detection.js');
    worker.onmessage = event => {
      if (event.data.type === 'wakeup' && this.shouldRefreshWorkspace()) {
        this.syncData(event.data.elapsedMs);
      }
    };
  }

  private syncData(elapsedMs: number) {
    this.store$.dispatch(new ProjectsAction.RefreshWorkspace());

    this.store$.dispatch(
      new UsersAction.LogEvent({event: `Refreshing workspace after ${this.readableElapsedTime(elapsedMs)} inactivity`})
    );
  }

  private readableElapsedTime(elapsedMs: number): string {
    const elapsedMinutes = Math.round(elapsedMs / 1000 / 60);
    if (elapsedMinutes > 120) {
      const hours = Math.floor(elapsedMinutes / 60);
      const minutes = elapsedMinutes - hours * 60;
      return minutes > 0 ? `${hours} hours and ${minutes} minutes` : `${hours} hours`;
    }
    return `${elapsedMinutes} minutes`;
  }

  private shouldRefreshWorkspace(): boolean {
    if (this.authService.isCurrentPathOutsideApp()) {
      return false;
    }
    return this.authService.isAuthenticated() || this.authService.hasRefreshToken();
  }
}
