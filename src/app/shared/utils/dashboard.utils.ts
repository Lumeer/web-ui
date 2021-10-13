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

import {DashboardCell, DashboardTab, defaultDashboardTabs} from '../../core/model/dashboard-tab';
import {View} from '../../core/store/views/view';
import {Perspective} from '../../view/perspectives/perspective';
import {searchTabsMap} from '../../core/store/navigation/search-tab';
import {removeAccentFromString} from '@lumeer/data-filters';

export function isViewValidForDashboard(view: View): boolean {
  return !!view?.config?.search?.dashboard;
}

export function filterValidDashboardCells(cells: DashboardCell[]): DashboardCell[] {
  return (cells || []).filter(cell => isDashboardCellValid(cell));
}

export function isDashboardCellValid(cell: DashboardCell): boolean {
  return !!cell?.span;
}

export function findRealDashboardCellIndexByValidIndex(cells: DashboardCell[], index: number): number {
  // inside template invalid cells are skipped

  let currentIndex = 0;
  for (let i = 0; i < (cells || []).length; i++) {
    if (isDashboardCellValid(cells[i])) {
      if (currentIndex === index) {
        return i;
      }

      currentIndex++;
    }
  }

  return -1;
}

export function addDefaultDashboardTabsIfNotPresent(savedTabs: DashboardTab[]): DashboardTab[] {
  const tabs = [...(savedTabs || [])];
  for (let i = defaultDashboardTabs.length - 1; i >= 0; i--) {
    const defaultTab = defaultDashboardTabs[i];
    if (!tabs.some(tab => tab.id === defaultTab.id)) {
      tabs.splice(0, 0, defaultTab);
    }
  }
  return tabs;
}

export function createDashboardTabId(title: string, usedIds: Set<string>) {
  const baseId = removeAccentFromString(title, true)
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .replace(/ +/g, '-')
    .trim();

  const separator = baseId.endsWith('-') ? '' : '-';
  let currentId = baseId;
  let num = 1;
  while (usedIds.has(currentId)) {
    currentId = `${baseId}${separator}${num++}`;
  }
  return currentId;
}

export function isViewDisplayableInDashboard(view: View): boolean {
  switch (view.perspective) {
    case Perspective.Search:
      const searchTab = searchTabsMap[view.config?.search?.searchTab || ''];
      return !!searchTab;
    default:
      return true;
  }
}
