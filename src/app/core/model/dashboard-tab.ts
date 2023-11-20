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
    {id: TabType.Tasks, title: $localize`:@@tasks:Tasks`, type: TabType.Tasks},
  ];

  if (permissions?.roles?.CollectionContribute || collectionsCount > 0) {
    tabs.push({id: TabType.Tables, title: $localize`:@@collections:Tables`, type: TabType.Tables});
  }
  if (permissions?.roles?.ViewContribute || viewsCount > 0) {
    tabs.push({id: TabType.Views, title: $localize`:@@views:Views`, type: TabType.Views});
  }

  return tabs;
}
