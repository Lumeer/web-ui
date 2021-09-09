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

import {DashboardCell} from '../../core/model/dashboard-tab';

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
