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

import {Perspective, perspectivesMap} from '../../../view/perspectives/perspective';
import {ViewDto} from '../../dto';
import {convertQueryDtoToModel, convertQueryModelToDto} from '../navigation/query/query.converter';
import {DefaultViewConfig, View, ViewConfig} from './view';
import {convertPermissionsDtoToModel, convertPermissionsModelToDto} from '../permissions/permissions.converter';
import {convertPivotConfigDtoToModel} from '../pivots/pivot-config.converter';
import {convertGanttChartDtoConfigToModel} from '../gantt-charts/gantt-chart-config-converter';
import {convertCalendarDtoConfigToModel} from '../calendars/calendar-config-converter';
import {convertKanbanConfigDtoToModel} from '../kanbans/kanban-config.converter';
import {DefaultViewConfigDto} from '../../dto/default-view-config.dto';
import {convertMapDtoConfigToModel} from '../maps/map-config-converter';
import {convertChartDtoConfigToModel} from '../charts/chart-config-converter';
import {RoleType, roleTypesMap} from '../../model/role-type';
import {ViewSettings} from '../view-settings/view-settings';
import {ViewSettingsDto} from '../../dto/view.dto';

export function convertViewDtoToModel(dto: ViewDto): View {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    description: dto.description,
    color: dto.color,
    icon: dto.icon,
    priority: dto.priority,
    query: convertQueryDtoToModel(dto.query),
    additionalQueries: (dto.additionalQueries || []).map(dto => convertQueryDtoToModel(dto)),
    perspective: perspectivesMap[dto.perspective],
    config: convertViewConfigDtoToModel(perspectivesMap[dto.perspective], dto.config),
    settings: convertViewSettingsDtoToModel(dto.settings),
    permissions: convertPermissionsDtoToModel(dto.permissions),
    authorCollectionsRoles: convertViewAuthorRights(dto.authorCollectionsRights),
    authorLinkTypesRoles: convertViewAuthorRights(dto.authorLinkTypesRights),
    version: dto.version,
    favorite: dto.favorite,
    lastTimeUsed: new Date(dto.lastTimeUsed),
    folders: dto.folders,
  };
}

function convertViewAuthorRights(authorRights: Record<string, string[]>): Record<string, RoleType[]> {
  return Object.keys(authorRights || {}).reduce(
    (rights, id) => ({
      ...rights,
      [id]: (authorRights[id] || []).map(role => roleTypesMap[role]).filter(role => !!role),
    }),
    {}
  );
}

function convertViewSettingsDtoToModel(dto: ViewSettingsDto): ViewSettings {
  return {
    ...dto,
    permissions: {
      collections: Object.keys(dto.permissions?.collections).reduce(
        (perms, key) => ({...perms, [key]: convertPermissionsDtoToModel(dto.permissions.collections[key])}),
        {}
      ),
      linkTypes: Object.keys(dto.permissions?.linkTypes).reduce(
        (perms, key) => ({...perms, [key]: convertPermissionsDtoToModel(dto.permissions.linkTypes[key])}),
        {}
      ),
    },
  };
}

export function convertViewModelToDto(model: View): ViewDto {
  return {
    id: model.id,
    code: model.code,
    name: model.name,
    description: model.description,
    color: model.color,
    icon: model.icon,
    priority: model.priority,
    query: convertQueryModelToDto(model.query),
    additionalQueries: (model.additionalQueries || []).map(query => convertQueryModelToDto(query)),
    settings: convertViewSettingsModelToDto(model.settings),
    perspective: model.perspective,
    config: model.config,
    folders: model.folders,
  };
}

function convertViewConfigDtoToModel(perspective: Perspective, config: any): ViewConfig {
  switch (perspective) {
    case Perspective.Pivot:
      return {...config, pivot: convertPivotConfigDtoToModel(config?.pivot)};
    case Perspective.GanttChart:
      return {...config, ganttChart: convertGanttChartDtoConfigToModel(config?.ganttChart)};
    case Perspective.Calendar:
      return {...config, calendar: convertCalendarDtoConfigToModel(config?.calendar)};
    case Perspective.Kanban:
      return {...config, kanban: convertKanbanConfigDtoToModel(config?.kanban)};
    case Perspective.Map:
      return {...config, map: convertMapDtoConfigToModel(config?.map)};
    case Perspective.Chart:
      return {...config, chart: convertChartDtoConfigToModel(config?.chart)};
    default:
      return config;
  }
}

export function convertDefaultViewConfigDtoToModel(dto: DefaultViewConfigDto): DefaultViewConfig {
  return {
    ...dto,
    updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : new Date(),
    perspective: perspectivesMap[dto.perspective],
  };
}

export function convertDefaultViewConfigModelToDto(model: DefaultViewConfig): DefaultViewConfigDto {
  return {...model, updatedAt: (model.updatedAt || new Date()).getTime()};
}

function convertViewSettingsModelToDto(model: ViewSettings): ViewSettingsDto {
  return {
    ...model,
    permissions: {
      collections: Object.keys(model.permissions?.collections).reduce(
        (perms, key) => ({...perms, [key]: convertPermissionsModelToDto(model.permissions.collections[key])}),
        {}
      ),
      linkTypes: Object.keys(model.permissions?.linkTypes).reduce(
        (perms, key) => ({...perms, [key]: convertPermissionsModelToDto(model.permissions.linkTypes[key])}),
        {}
      ),
    },
  };
}
