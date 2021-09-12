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

import {Component, ChangeDetectionStrategy, ViewChild, OnInit} from '@angular/core';
import {DialogType} from '../dialog-type';
import {BehaviorSubject, Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {DashboardTab} from '../../../core/model/dashboard-tab';
import {TabsSettingsContentComponent} from './content/tabs-settings-content.component';
import {selectDefaultViewConfig} from '../../../core/store/views/views.state';
import {DEFAULT_PERSPECTIVE_ID, Perspective} from '../../../view/perspectives/perspective';
import {map} from 'rxjs/operators';
import {ViewsAction} from '../../../core/store/views/views.action';
import {createDashboardTabId} from '../../utils/dashboard.utils';

@Component({
  selector: 'tabs-settings-modal',
  templateUrl: './tabs-settings-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsSettingsModalComponent implements OnInit {
  @ViewChild(TabsSettingsContentComponent)
  public content: TabsSettingsContentComponent;

  public readonly dialogType = DialogType;
  private readonly searchId = DEFAULT_PERSPECTIVE_ID;

  public performingAction$ = new BehaviorSubject(false);
  public tabs$: Observable<DashboardTab[]>;

  constructor(private store$: Store<AppState>, private bsModalRef: BsModalRef) {}

  public ngOnInit() {
    this.tabs$ = this.store$.pipe(
      select(selectDefaultViewConfig(Perspective.Search, this.searchId)),
      map(defaultView => defaultView?.config?.search?.dashboard?.tabs)
    );
  }

  public onSubmit() {
    this.performingAction$.next(true);

    this.store$.dispatch(
      new ViewsAction.SetDashboard({
        dashboard: {tabs: this.assignTabsIds(this.content.tabs$.value)},
        onSuccess: () => this.hideDialog(),
        onFailure: () => this.performingAction$.next(false),
      })
    );
  }

  private assignTabsIds(tabs: DashboardTab[]): DashboardTab[] {
    const tabIds = new Set<string>();
    const assignedTabs: DashboardTab[] = [];
    for (const tab of tabs) {
      if (tab.id) {
        tabIds.add(tab.id);
        assignedTabs.push(tab);
      } else {
        const newId = createDashboardTabId(tab.title, tabIds);
        tabIds.add(newId);
        assignedTabs.push({...tab, id: newId, correlationId: undefined});
      }
    }
    return assignedTabs;
  }

  public hideDialog() {
    this.bsModalRef.hide();
  }
}
