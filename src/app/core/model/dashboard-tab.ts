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

import {RowLayoutType} from '../../shared/layout/row-layout/row-layout';
import {AllowedPermissions} from './allowed-permissions';

export interface DashboardTab {
  id?: string;
  correlationId?: string;
  title?: string;
  type?: TabType;
  hidden?: boolean;
  rows?: DashboardRow[];

  hintTitle?: string;
  hintContent?: string;
}

export interface DashboardRow {
  id: string;
  cells: DashboardCell[];
}

export type DashboardLayoutType = RowLayoutType;

export interface DashboardCell {
  id: string;
  span: number;
  type?: DashboardCellType;
  config?: DashboardCellConfig;
  actions?: DashboardAction[];
  title?: string;
}

export type DashboardCellConfig = DashboardViewCellConfig | DashboardImageCellConfig;

export enum DashboardCellType {
  View = 'view',
  Image = 'image',
  Notes = 'notes',
}

export interface DashboardViewCellConfig {
  viewId?: string;
}

export interface DashboardImageCellConfig {
  url?: string;
  scale?: DashboardImageScaleType;
}

export enum DashboardImageScaleType {
  Fit = 'fit',
  Crop = 'crop',
}

export const defaultDashboardImageScaleType = DashboardImageScaleType.Fit;

export interface DashboardAction {
  type: DashboardActionType;
  config: DashboardActionConfig;
}

export enum DashboardActionType {
  ViewButton = 'viewButton',
}

export type DashboardActionConfig = DashboardViewButtonConfig;

export interface DashboardViewButtonConfig {
  icon: string;
  color: string;
  viewId?: string;
}

export enum TabType {
  All = 'all',
  Tasks = 'tasks',
  Views = 'views',
  Tables = 'tables',
  Custom = 'custom',
}

export function isDashboardTabDefault(tab: DashboardTab): boolean {
  return tab && defaultDashboardTabs.some(t => t.id === tab.id);
}

const defaultDashboardTabs: DashboardTab[] = [
  {id: TabType.All, title: $localize`:@@all:All`, type: TabType.All},
  {id: TabType.Tasks, title: $localize`:@@tasks:Tasks`, type: TabType.Tasks},
  {id: TabType.Views, title: $localize`:@@views:Views`, type: TabType.Views},
  {id: TabType.Tables, title: $localize`:@@collections:Tables`, type: TabType.Tables},
];

export function filterDefaultDashboardTabs(
  permissions: AllowedPermissions,
  collectionsCount: number,
  viewsCount: number
): DashboardTab[] {
  const tabs = [
    {id: TabType.All, title: $localize`:@@all:All`, type: TabType.All},
    {
      id: TabType.Tasks,
      title: $localize`:@@tasks:Tasks`,
      type: TabType.Tasks,
      hintTitle: $localize`:@@tasks:Tasks`,
      hintContent: $localize`:@@hint.tasks.content:All tasks assigned to you are visible on this tab. Note that these are tasks related to currently selected project. View task details, mark them as completed, or create new tasks.`,
    },
  ];

  if (permissions?.roles?.CollectionContribute || collectionsCount > 0) {
    tabs.push({
      id: TabType.Tables,
      title: $localize`:@@collections:Tables`,
      type: TabType.Tables,
      hintTitle: $localize`:@@collections:Tables`,
      hintContent: $localize`:@@hint.tables.content:Tables are the foundation of the entire application. They represent the raw data that is stored in Lumeer. You can quickly create a new table, rename or change the icon of an existing one as well as import a whole table from a CSV file. On hover, you can quickly check the number of records in the table or mark it as your favorite one. Similar to tasks, favorite tables will always be displayed first.`,
    });
  }
  if (permissions?.roles?.ViewContribute || viewsCount > 0) {
    tabs.push({
      id: TabType.Views,
      title: $localize`:@@views:Views`,
      type: TabType.Views,
      hintTitle: $localize`:@@views:Views`,
      hintContent: $localize`:@@hint.views.content:Views make your work more efficient by presenting you with the very same data in many different visual ways. Use a timeline, kanban board, calendar, and many more depending on your current job duty. The possibilities are endless and up to your preference!`,
    });
  }

  return tabs;
}
