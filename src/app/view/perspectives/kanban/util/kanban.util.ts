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

import {KanbanColumn, KanbanConfig} from '../../../../core/store/kanbans/kanban';
import {deepObjectsEquals} from '../../../../shared/utils/common.utils';
import {areArraysSame} from '../../../../shared/utils/array.utils';

export function isKanbanConfigChanged(viewConfig: KanbanConfig, currentConfig: KanbanConfig): boolean {
  if (!deepObjectsEquals(viewConfig.collections, currentConfig.collections)) {
    return true;
  }

  const currentColumns = currentConfig.columns || [];
  return (viewConfig.columns || []).some((column, index) => {
    if (index > currentColumns.length - 1) {
      return true;
    }

    const currentColumn = (currentConfig.columns || [])[index];
    return kanbanColumnsChanged(column, currentColumn);
  });
}

function kanbanColumnsChanged(column1: KanbanColumn, column2: KanbanColumn): boolean {
  return (
    !deepObjectsEquals(column1, column2) ||
    !areArraysSame(column1 && column1.documentsIdsOrder, column2 && column2.documentsIdsOrder)
  );
}
