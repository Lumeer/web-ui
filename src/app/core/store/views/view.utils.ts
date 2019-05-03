/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {isCalendarConfigChanged} from '../../../view/perspectives/calendar/util/calendar-util';
import {isGanttConfigChanged} from '../../../view/perspectives/gantt-chart/util/gantt-chart-util';
import {Perspective} from '../../../view/perspectives/perspective';
import {isChartConfigChanged} from '../charts/chart.util';
import {Collection} from '../collections/collection';
import {DocumentModel} from '../documents/document.model';
import {LinkType} from '../link-types/link.type';
import {TableConfig} from '../tables/table.model';
import {isTableConfigChanged} from '../tables/utils/table-config-changed.utils';
import {createTableSaveConfig} from '../tables/utils/table-save-config.util';
import {PerspectiveConfig} from './view';
import isEqual from 'lodash/isEqual';
import {isKanbanConfigChanged} from '../../../view/perspectives/kanban/util/kanban.util';

export function isViewConfigChanged(
  perspective: Perspective,
  viewConfig: any,
  perspectiveConfig: any,
  documentsMap: Record<string, DocumentModel>,
  collectionsMap: Record<string, Collection>,
  linkTypesMap: Record<string, LinkType>
): boolean {
  switch (perspective) {
    case Perspective.Table:
      return isTableConfigChanged(viewConfig, perspectiveConfig, documentsMap, collectionsMap, linkTypesMap);
    case Perspective.Chart:
      return isChartConfigChanged(viewConfig, perspectiveConfig);
    case Perspective.GanttChart:
      return isGanttConfigChanged(viewConfig, perspectiveConfig);
    case Perspective.Calendar:
      return isCalendarConfigChanged(viewConfig, perspectiveConfig);
    case Perspective.Kanban:
      return isKanbanConfigChanged(viewConfig, perspectiveConfig);
    default:
      return !isEqual(viewConfig, perspectiveConfig);
  }
}

/**
 * Creates perspective config with modifications before saving in a view
 */
export function createPerspectiveSaveConfig(perspective: Perspective, config: PerspectiveConfig): PerspectiveConfig {
  switch (perspective) {
    case Perspective.Table:
      return createTableSaveConfig(config as TableConfig);
    default:
      return config;
  }
}
