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

import {TableRow} from './table-row';

export interface TableRowHierarchy {
  previousRowLevel: number;
  level: number;
  parentsHasChildBelow?: boolean[];
  hasChild?: boolean;
}

export function createTableHierarchyPath(row: TableRow, height: number, stepWidth: number): string {
  if (!row?.hierarchy) {
    return '';
  }

  const width = ((row.hierarchy.level || 0) + 1) * stepWidth;
  const paths = [];
  for (let i = 0; i < row.hierarchy.level; i++) {
    if (row.hierarchy.parentsHasChildBelow?.[i]) {
      const x = i * stepWidth + stepWidth / 2;
      paths.push(`M ${x} 0 L ${x} ${height}`);
    }
  }
  if (row.hierarchy.hasChild && row.expanded) {
    paths.push(`M ${width - stepWidth / 2} ${height / 2} L ${width - stepWidth / 2} ${height}`);
  }

  if (row.hierarchy.level > 0) {
    paths.push(
      `M ${width - (stepWidth / 2) * 3} 0 C ${width - (stepWidth / 2) * 3} 20, ${width - stepWidth / 2} 20, ${
        width - stepWidth / 2
      } ${height / 2}`
    );
  }

  return paths.join('\n');
}
