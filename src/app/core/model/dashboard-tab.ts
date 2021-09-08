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

export interface DashboardTab {
  id?: string;
  title?: string;
  type?: TabType;
  hidden?: boolean;
}

export enum TabType {
  All = 'all',
  Tasks = 'tasks',
  Views = 'views',
  Tables = 'tables',
  Custom = 'custom',
}

export const defaultDashboardTabs = [
  {id: TabType.All, title: $localize`:@@search.tab.all:All`, type: TabType.All},
  {id: TabType.Tasks, title: $localize`:@@search.tab.tasks:Tasks`, type: TabType.Tasks},
  {id: TabType.Views, title: $localize`:@@search.tab.views:Views`, type: TabType.Views},
  {id: TabType.Tables, title: $localize`:@@search.tab.collections:Tables`, type: TabType.Tables},
]

export function isDashboardTabDefault(tab: DashboardTab): boolean {
  return tab && defaultDashboardTabs.some(t => t.id === tab.id);
}
