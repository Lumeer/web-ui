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

import {Component, OnInit, ChangeDetectionStrategy, ElementRef, Input, OnDestroy} from '@angular/core';
import {AppState} from '../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {AttributesSettings, DataSettings, ViewSettings} from '../../../../core/store/views/view';
import {Observable, Subscription} from 'rxjs';
import {tap} from 'rxjs/operators';
import {selectViewSettings, selectViewSettingsId} from '../../../../core/store/view-settings/view-settings.state';
import {ViewSettingsAction} from '../../../../core/store/view-settings/view-settings.action';

@Component({
  selector: 'settings-button',
  templateUrl: './settings-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsButtonComponent implements OnInit, OnDestroy {
  @Input()
  public showAttributes: boolean;

  public viewSettings$: Observable<ViewSettings>;
  private viewSettings: ViewSettings;
  private subscriptions = new Subscription();
  private settingsId: string;

  constructor(public element: ElementRef, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.viewSettings$ = this.store$.pipe(
      select(selectViewSettings),
      tap(settings => (this.viewSettings = settings))
    );
    this.subscriptions.add(this.store$.pipe(select(selectViewSettingsId)).subscribe(id => (this.settingsId = id)));
  }

  public onAttributesSettingsChanged(attributesSettings: AttributesSettings) {
    const changedSettings: ViewSettings = {...this.viewSettings, attributes: attributesSettings};
    this.store$.dispatch(new ViewSettingsAction.SetSettings({settingsId: this.settingsId, settings: changedSettings}));
  }

  public onDataSettingsChanged(dataSettings: DataSettings) {
    const changedSettings: ViewSettings = {...this.viewSettings, data: dataSettings};
    this.store$.dispatch(new ViewSettingsAction.SetSettings({settingsId: this.settingsId, settings: changedSettings}));
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
