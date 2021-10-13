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

import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  EventEmitter,
} from '@angular/core';
import {moveItemInArray} from '@angular/cdk/drag-drop';
import {DashboardTab, defaultDashboardTabs, TabType} from '../../../../core/model/dashboard-tab';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {distinctUntilChanged, map} from 'rxjs/operators';
import {generateId} from '../../../utils/resource.utils';
import {View} from '../../../../core/store/views/view';
import {SelectItemModel} from '../../../select/select-item/select-item.model';
import {createViewSelectItems} from '../../../../core/store/views/view.utils';

@Component({
  selector: 'tabs-settings-content',
  templateUrl: './tabs-settings-content.component.html',
  styleUrls: ['./tabs-settings-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsSettingsContentComponent implements OnInit, OnChanges {
  @Input()
  public savedTabs: DashboardTab[];

  @Input()
  public initialTab: string;

  @Input()
  public selectedView: View;

  @Input()
  public editable: boolean;

  @Input()
  public dashboardViews: View[];

  @Output()
  public selectView = new EventEmitter<string>();

  @Output()
  public copySelectedView = new EventEmitter();

  public tabs$ = new BehaviorSubject<DashboardTab[]>(defaultDashboardTabs);
  public selectedTabId$ = new BehaviorSubject<string>(null);
  public draggedTabIdSubject$ = new BehaviorSubject(null);
  public dragging$ = new BehaviorSubject(false);

  public draggedTabId$ = this.draggedTabIdSubject$.pipe(distinctUntilChanged());
  public selectedTab$: Observable<DashboardTab>;
  public tabsAreValid$: Observable<boolean>;

  public draggedTab: DashboardTab;
  public viewSelectItems: SelectItemModel[];

  public ngOnInit() {
    this.selectedTabId$.next(this.initialTab);
    this.selectedTab$ = combineLatest([this.tabs$, this.selectedTabId$]).pipe(
      map(([tabs, selectedId]) => tabs?.find(tab => isTabSelected(tab, selectedId)))
    );
    this.tabsAreValid$ = this.tabs$.pipe(map(tabs => tabs.some(tab => tab.type === TabType.Custom || !tab.hidden)));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.savedTabs) {
      this.setTabs(this.savedTabs);
    }
    if (changes.dashboardViews) {
      this.viewSelectItems = createViewSelectItems(this.dashboardViews);
    }
  }

  public trackByTab(index: number, tab: DashboardTab): string {
    return tab.id || tab.correlationId;
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
    this.selectedTabId$.next(tabSelectValue(tab));
  }

  private setTabs(tabs: DashboardTab[], selectId?: string) {
    this.tabs$.next(tabs);
    const selectedTabId = this.selectedTabId$.value;
    if (selectId) {
      this.selectedTabId$.next(selectId);
    } else {
      const selectedTab = tabs.find(tab => isTabSelected(tab, selectedTabId));
      if (!selectedTab) {
        this.selectTab(tabs[0]);
      }
    }
  }

  public onSelectedTabChange(tab: DashboardTab) {
    const index = this.tabs$.value.findIndex(t => tabSelectValue(t) === tabSelectValue(tab));
    const tabs = [...this.tabs$.value];
    tabs[index] = tab;
    this.setTabs(tabs);
  }

  public addTab() {
    const tabs = [...this.tabs$.value];
    const newTab = this.createNewTab();
    tabs.push(newTab);
    this.setTabs(tabs, newTab.correlationId);
  }

  private createNewTab(): DashboardTab {
    const title = $localize`:@@search.tabs.settings.dialog.tab.newName:Custom Tab`;
    return {correlationId: generateId(), type: TabType.Custom, title};
  }

  public onDragStart(tab: DashboardTab) {
    this.draggedTab = tab;
    this.dragging$.next(true);
    this.draggedTabIdSubject$.next(null);
  }

  public onDragEnd() {
    this.draggedTab = null;
    this.dragging$.next(false);
    this.draggedTabIdSubject$.next(null);
  }

  public onDrop(tab: DashboardTab) {
    if (this.draggedTab) {
      const previousIndex = this.tabs$.value.findIndex(t => t.id === this.draggedTab.id);
      const currentIndex = this.tabs$.value.findIndex(t => t.id === tab.id);
      const tabs = [...this.tabs$.value];
      moveItemInArray(tabs, previousIndex, currentIndex);
      this.setTabs(tabs);
    }
  }

  public onDragEnter(tab: DashboardTab) {
    this.draggedTabIdSubject$.next(tab.id);
  }

  public onDragLeave(tab: DashboardTab) {
    if (this.draggedTabIdSubject$.value === tab.id) {
      this.draggedTabIdSubject$.next(null);
    }
  }
}

export function tabSelectValue(tab: DashboardTab): string {
  return tab?.id ? tab.id : tab?.correlationId ? tab.correlationId : null;
}

export function isTabSelected(tab: DashboardTab, selectedValue: string): boolean {
  return selectedValue && tabSelectValue(tab) === selectedValue;
}
