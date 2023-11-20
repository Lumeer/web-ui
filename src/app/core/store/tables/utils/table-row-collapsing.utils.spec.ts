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
import {TableConfigRow} from '../table.model';
import {isTableRowCollapsed} from './table-row-collapsing.utils';

describe('isTableRowCollapsed', () => {
  it('should be false for null rows', () => expect(isTableRowCollapsed(null, [0])).toBeFalsy());

  it('should be false for empty path', () => expect(isTableRowCollapsed([], [])).toBeFalsy());

  it('should be false for a row with a single linked row', () => {
    const rows: TableConfigRow[] = [{linkedRows: [{linkedRows: [{linkedRows: []}, {linkedRows: []}]}]}];
    expect(isTableRowCollapsed(rows, [0])).toBeFalsy();
  });

  it('should be true for a row with multiple linked rows', () => {
    const rows: TableConfigRow[] = [{linkedRows: [{linkedRows: [{linkedRows: []}, {linkedRows: []}]}]}];
    expect(isTableRowCollapsed(rows, [0, 0])).toBeTruthy();
  });

  it('should be true for a row with previous linked collapsed row', () => {
    const rows: TableConfigRow[] = [{linkedRows: [{linkedRows: [{linkedRows: []}]}, {linkedRows: []}]}];
    expect(isTableRowCollapsed(rows, [0, 0])).toBeTruthy();
  });
});
