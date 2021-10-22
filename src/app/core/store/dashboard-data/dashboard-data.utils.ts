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

import {Dashboard} from '../searches/search';
import {DashboardDataType} from './dashboard-data';
import {getAllDashboardCells} from '../../../shared/utils/dashboard.utils';
import {DashboardCellType} from '../../model/dashboard-tab';
import {arraySubtract} from '../../../shared/utils/array.utils';

export function checkDeletedDashboardData(
  old: Dashboard,
  current: Dashboard
): {type: DashboardDataType; ids: string[]} {
  // for now we save data only for notes
  const oldNotesCellIds = getAllDashboardCells(old)
    .filter(cell => cell.type === DashboardCellType.Notes)
    .map(cell => cell.id);
  const currentNotesCellIds = getAllDashboardCells(current)
    .filter(cell => cell.type === DashboardCellType.Notes)
    .map(cell => cell.id);

  return {type: DashboardDataType.Cell, ids: arraySubtract(oldNotesCellIds, currentNotesCellIds)};
}
