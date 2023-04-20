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
import {select, Store} from '@ngrx/store';
import {selectCurrentUser} from '../store/users/users.state';
import {AppState} from '../store/app.state';
import {filter, throttleTime} from 'rxjs/operators';
import {User} from '../store/users/user';
import {ConfigurationService} from '../../configuration/configuration.service';
import {languageCodeMap} from '../model/language';
import {NavigationAction} from '../store/navigation/navigation.action';
import {AuthService} from '../../auth/auth.service';

@Injectable()
export class CurrentUserCheckService {
  constructor(
    private store$: Store<AppState>,
    private configurationService: ConfigurationService,
    private authService: AuthService
  ) {}

  public init(): Promise<boolean> {
    this.store$
      .pipe(
        select(selectCurrentUser),
        filter(currentUser => !!currentUser),
        throttleTime(1000)
      )
      .subscribe(currentUser => this.checkUserLanguage(currentUser));

    return Promise.resolve(true);
  }

  private checkUserLanguage(user: User) {
    if (this.authService.isCurrentPathOutsideApp()) {
      return;
    }

    const language = languageCodeMap[user.language];
    if (language && language !== this.configurationService.getConfiguration().locale) {
      this.store$.dispatch(new NavigationAction.RedirectToLanguage({language}));
    }
  }
}
