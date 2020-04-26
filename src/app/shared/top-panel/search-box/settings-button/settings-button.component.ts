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

import {Component, OnInit, ChangeDetectionStrategy, ElementRef} from '@angular/core';
import {AppState} from '../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {AttributesSettings, ViewSettings} from '../../../../core/store/views/view';
import {Observable} from 'rxjs';
import {selectViewSettings} from '../../../../core/store/views/views.state';
import {tap} from 'rxjs/operators';
import {ViewsAction} from '../../../../core/store/views/views.action';

@Component({
  selector: 'settings-button',
  templateUrl: './settings-button.component.html',
  styleUrls: ['./settings-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsButtonComponent implements OnInit {
  public viewSettings$: Observable<ViewSettings>;
  private viewSettings: ViewSettings;

  constructor(public element: ElementRef, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.viewSettings$ = this.store$.pipe(
      select(selectViewSettings),
      tap(settings => (this.viewSettings = settings))
    );
  }

  public onAttributesSettingsChanged(attributesSettings: AttributesSettings) {
    const changedSettings: ViewSettings = {...this.viewSettings, attributes: attributesSettings};
    this.store$.dispatch(new ViewsAction.SetViewSettings({settings: changedSettings}));
  }
}
