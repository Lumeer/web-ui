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

import {ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {DashboardTab, defaultDashboardTabs, TabType} from '../../../../core/model/dashboard-tab';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {generateId} from '../../../utils/resource.utils';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';

@Component({
  selector: 'tabs-settings-content',
  templateUrl: './tabs-settings-content.component.html',
  styleUrls: ['./tabs-settings-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsSettingsContentComponent implements OnInit, OnChanges {
  @Input()
  public savedTabs: DashboardTab[];

  public tabs$ = new BehaviorSubject<DashboardTab[]>(defaultDashboardTabs);
  public selectedTabId$ = new BehaviorSubject<string>(null);

  public selectedTab$: Observable<DashboardTab>;

  constructor() {}

  public ngOnInit() {
    this.selectedTab$ = combineLatest([this.tabs$, this.selectedTabId$]).pipe(
      map(([tabs, selectedId]) => tabs?.find(tab => tab.id === selectedId))
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.savedTabs) {
      this.setTabs(this.addDefaultTabsIfNotPresent(this.savedTabs));
    }
  }

  private addDefaultTabsIfNotPresent(savedTabs: DashboardTab[]): DashboardTab[] {
    const tabs = [...(savedTabs || [])];
    for (let i = defaultDashboardTabs.length - 1; i >= 0; i--) {
      const defaultTab = defaultDashboardTabs[i];
      if (!tabs.some(tab => tab.id === defaultTab.id)) {
        tabs.splice(0, 0, defaultTab);
      }
    }
    return tabs;
  }

  public trackByTab(index: number, tab: DashboardTab): string {
    return tab.id;
  }

  public removeTab(index: number) {
    const tabs = [...this.tabs$.value];
    tabs.splice(index, 1);
    this.setTabs(tabs);
  }

  public toggleHiddenTab(index: number) {
    const tabs = [...this.tabs$.value];
    const tab = tabs[index];
    tabs[index] = {...tab, hidden: !tab.hidden};
    this.setTabs(tabs);
  }

  public selectTab(tab: DashboardTab) {
    this.selectedTabId$.next(tab.id);
  }

  private setTabs(tabs: DashboardTab[], selectId?: string) {
    this.tabs$.next(tabs);
    const selectedTabId = this.selectedTabId$.value;
    if (selectId) {
      this.selectedTabId$.next(selectId);
    } else if (selectedTabId) {
      const selectedTab = tabs.find(tab => tab.id === selectedTabId);
      if (!selectedTab) {
        this.selectedTabId$.next(tabs[0].id);
      }
    }
  }

  public onSelectedTabChange(tab: DashboardTab) {
    const index = this.tabs$.value.findIndex(t => t.id === tab.id);
    const tabs = [...this.tabs$.value];
    tabs[index] = tab;
    this.setTabs(tabs);
  }

  public addTab() {
    const tabs = [...this.tabs$.value];
    const newTab = this.createNewTab();
    tabs.push(newTab);
    this.setTabs(tabs, newTab.id);
  }

  private createNewTab(): DashboardTab {
    const title = $localize`:@@search.tabs.settings.dialog.tab.newName:Custom Tab`;
    return {id: generateId(), type: TabType.Custom, title};
  }

  public tagDropped(event: CdkDragDrop<DashboardTab, any>) {
    const tabs = [...this.tabs$.value];
    moveItemInArray(tabs, event.previousIndex, event.currentIndex);
    this.setTabs(tabs);
  }
}
