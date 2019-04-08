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

import {TableColumnType, TableConfigColumn} from '../table.model';
import {filterValidSavedColumns} from './table-config-changed.utils';

const column1: TableConfigColumn = {type: TableColumnType.COMPOUND, attributeIds: ['a1']};
const column2: TableConfigColumn = {type: TableColumnType.COMPOUND, attributeIds: ['a2']};
const uninitializedColumn: TableConfigColumn = {type: TableColumnType.COMPOUND, attributeIds: [], attributeName: 'A'};

xdescribe('filterValidSavedColumns', () => {
  it('should filter out last uninitialized column', () => {
    const columns = [column1, column2, uninitializedColumn];
    const filteredColumns = filterValidSavedColumns(columns);
    expect(filteredColumns.length).toBe(2);
    expect(filteredColumns).toContain(column1);
    expect(filteredColumns).toContain(column2);
  });

  it('should not filter out uninitialized column in the middle', () => {
    const columns = [column1, uninitializedColumn, column2];
    const filteredColumns = filterValidSavedColumns(columns);
    expect(filteredColumns.length).toBe(3);
    expect(filteredColumns).toContain(column1);
    expect(filteredColumns).toContain(column2);
    expect(filteredColumns).toContain(uninitializedColumn);
  });
});
