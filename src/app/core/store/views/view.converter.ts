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
import {PermissionsConverter} from '../permissions/permissions.converter';
import {convertPivotConfigDtoToModel} from '../pivots/pivot-config.converter';
import {convertGanttChartDtoConfigToModel} from '../gantt-charts/gantt-chart-config-converter';
import {convertCalendarDtoConfigToModel} from '../calendars/calendar-config-converter';
import {convertKanbanConfigDtoToModel} from '../kanbans/kanban-config.converter';
import {DefaultViewConfigDto} from '../../dto/default-view-config.dto';

export function convertViewDtoToModel(dto: ViewDto): View {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    description: dto.description,
    query: convertQueryDtoToModel(dto.query),
    perspective: perspectivesMap[dto.perspective],
    config: convertViewConfigDtoToModel(perspectivesMap[dto.perspective], dto.config),
    permissions: PermissionsConverter.fromDto(dto.permissions),
    authorRights: dto.authorRights,
    version: dto.version,
    favorite: dto.favorite,
    lastTimeUsed: new Date(dto.lastTimeUsed),
  };
}

export function convertViewModelToDto(model: View): ViewDto {
  return {
    code: model.code,
    name: model.name,
    query: convertQueryModelToDto(model.query),
    perspective: model.perspective,
    config: model.config,
    description: model.description,
  };
}

function convertViewConfigDtoToModel(perspective: Perspective, config: any): ViewConfig {
  switch (perspective) {
    case Perspective.Pivot:
      return {...config, pivot: convertPivotConfigDtoToModel(config && config.pivot)};
    case Perspective.GanttChart:
      return {...config, ganttChart: convertGanttChartDtoConfigToModel(config && config.ganttChart)};
    case Perspective.Calendar:
      return {...config, calendar: convertCalendarDtoConfigToModel(config && config.calendar)};
    case Perspective.Kanban:
      return {...config, kanban: convertKanbanConfigDtoToModel(config && config.kanban)};
    default:
      return config;
  }
}

export function convertDefaultViewConfigDtoToModel(dto: DefaultViewConfigDto): DefaultViewConfig {
  return {...dto, updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : new Date()};
}

export function convertDefaultViewConfigModelToDto(model: DefaultViewConfig): DefaultViewConfigDto {
  return {...model, updatedAt: (model.updatedAt || new Date()).getTime()};
}
