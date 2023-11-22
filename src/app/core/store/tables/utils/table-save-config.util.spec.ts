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
import {TableColumnType, TableConfigColumn, TableConfigRow} from '../table.model';
import {filterOutLastUninitializedTableColumns, filterOutLastUninitializedTableRows} from './table-save-config.util';

const column1: TableConfigColumn = {type: TableColumnType.COMPOUND, attributeIds: ['a1']};
const column2: TableConfigColumn = {type: TableColumnType.COMPOUND, attributeIds: ['a2']};
const uninitializedColumn: TableConfigColumn = {type: TableColumnType.COMPOUND, attributeIds: [], attributeName: 'A'};

describe('filterOutLastUninitializedTableColumns', () => {
  it('should filter out last uninitialized column', () => {
    const columns = [column1, column2, uninitializedColumn];
    const filteredColumns = filterOutLastUninitializedTableColumns(columns);
    expect(filteredColumns.length).toBe(2);
    expect(filteredColumns).toContain(column1);
    expect(filteredColumns).toContain(column2);
    expect(columns.length).toBe(3);
  });

  it('should not filter out uninitialized column in the middle', () => {
    const columns = [column1, uninitializedColumn, column2];
    const filteredColumns = filterOutLastUninitializedTableColumns(columns);
    expect(filteredColumns.length).toBe(3);
    expect(filteredColumns).toContain(column1);
    expect(filteredColumns).toContain(column2);
    expect(filteredColumns).toContain(uninitializedColumn);
  });
});

const initializedRow: TableConfigRow = {documentId: '5c93ee0b44c8b87bb646e367', linkedRows: []};
const uninitializedRow: TableConfigRow = {linkedRows: []};

describe('filterOutLastUninitializedTableRows', () => {
  it('should filter out last uninitialized row', () => {
    const rows = [initializedRow, initializedRow, uninitializedRow];
    const filteredColumns = filterOutLastUninitializedTableRows(rows);
    expect(filteredColumns.length).toBe(2);
    expect(filteredColumns[0]).toBe(initializedRow);
    expect(filteredColumns[1]).toBe(initializedRow);
    expect(rows.length).toBe(3);
  });

  it('should filter out all uninitialized row at the end', () => {
    const rows = [initializedRow, initializedRow, uninitializedRow, uninitializedRow];
    const filteredColumns = filterOutLastUninitializedTableRows(rows);
    expect(filteredColumns.length).toBe(2);
    expect(filteredColumns[0]).toBe(initializedRow);
    expect(filteredColumns[1]).toBe(initializedRow);
    expect(rows.length).toBe(4);
  });

  it('should not filter out uninitialized row in the middle', () => {
    const rows = [initializedRow, initializedRow, uninitializedRow, initializedRow];
    const filteredColumns = filterOutLastUninitializedTableRows(rows);
    expect(filteredColumns.length).toBe(4);
    expect(filteredColumns[0]).toBe(initializedRow);
    expect(filteredColumns[1]).toBe(initializedRow);
    expect(filteredColumns[2]).toBe(uninitializedRow);
    expect(filteredColumns[3]).toBe(initializedRow);
  });

  it('should not filter out any rows if all initialized', () => {
    const rows = [initializedRow, initializedRow, initializedRow];
    const filteredColumns = filterOutLastUninitializedTableRows(rows);
    expect(filteredColumns.length).toBe(3);
    expect(filteredColumns[0]).toBe(initializedRow);
    expect(filteredColumns[1]).toBe(initializedRow);
    expect(filteredColumns[2]).toBe(initializedRow);
  });

  it('should not fail on empty rows', () => {
    expect(filterOutLastUninitializedTableRows([]).length).toBe(0);
  });
});
