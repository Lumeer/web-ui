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

import {Injectable, OnDestroy} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Subscription} from 'rxjs';
import {AppState} from '../store/app.state';
import {selectCurrentView} from '../store/views/views.state';
import {View} from '../store/views/view';
import {pairwise, startWith} from 'rxjs/operators';
import {ViewSettingsAction} from '../store/view-settings/view-settings.action';

@Injectable()
export class ViewSettingsService implements OnDestroy {
  private subscriptions = new Subscription();

  constructor(private store$: Store<AppState>) {}

  public init() {
    this.subscriptions.add(this.subscribeToView());
  }

  private subscribeToView(): Subscription {
    return this.store$
      .pipe(select(selectCurrentView), startWith(null as View), pairwise())
      .subscribe(([previousView, currentView]) => this.checkViewSettings(previousView, currentView));
  }

  private checkViewSettings(previousView: View, currentView: View) {
    if (previousView && !currentView) {
      this.store$.dispatch(new ViewSettingsAction.ResetSettings());
    } else if (currentView && (!previousView || previousView.id !== currentView.id)) {
      this.store$.dispatch(new ViewSettingsAction.SetSettings({settings: currentView.settings}));
    }
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
