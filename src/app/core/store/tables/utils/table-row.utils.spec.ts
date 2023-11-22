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
import {findLinkedTableRows, findTableRowsIncludingCollapsed} from './table-row.utils';

const rows: TableConfigRow[] = [
  {
    documentId: 'a',
    linkedRows: [],
  },
  {
    documentId: 'b',
    expanded: true,
    linkedRows: [
      {
        documentId: 'ba',
        expanded: true,
        linkedRows: [
          {
            documentId: 'baa',
            linkedRows: [],
          },
          {
            documentId: 'bab',
            linkedRows: [],
          },
        ],
      },
      {
        documentId: 'bb',
        expanded: true,
        linkedRows: [
          {
            documentId: 'bba',
            linkedRows: [],
          },
          {
            documentId: 'bbb',
            linkedRows: [],
          },
        ],
      },
    ],
  },
  {
    documentId: 'c',
    linkedRows: [
      {
        documentId: 'ca',
        linkedRows: [
          {
            documentId: 'caa',
            linkedRows: [],
          },
          {
            documentId: 'cab',
            linkedRows: [],
          },
        ],
      },
      {
        documentId: 'cb',
        linkedRows: [
          {
            documentId: 'cba',
            linkedRows: [],
          },
          {
            documentId: 'cbb',
            linkedRows: [],
          },
        ],
      },
    ],
  },
];

describe('findLinkedTableRows()', () => {
  it('should find not existing rows in second part', () => {
    expect(findLinkedTableRows(rows, [0])).toEqual([]);
  });

  it('should find not existing rows in third part', () => {
    expect(findLinkedTableRows(rows, [0, 0])).toEqual([]);
  });

  it('should find rows in second part', () => {
    const linkedDocumentIds = findLinkedTableRows(rows, [1]).map(row => row.documentId);
    expect(linkedDocumentIds).toEqual(['ba', 'bb']);
  });

  it('should find rows in third part', () => {
    const linkedDocumentIds = findLinkedTableRows(rows, [1, 1]).map(row => row.documentId);
    expect(linkedDocumentIds).toEqual(['bba', 'bbb']);
  });

  it('should find collapsed rows in second part', () => {
    const linkedDocumentIds = findLinkedTableRows(rows, [2]).map(row => row.documentId);
    expect(linkedDocumentIds).toEqual(['ca', 'cb']);
  });

  it('should find collapsed rows in third part', () => {
    const linkedDocumentIds = findLinkedTableRows(rows, [2, 0]).map(row => row.documentId);
    expect(linkedDocumentIds).toEqual(['caa', 'cab', 'cba', 'cbb']);
  });
});

describe('findTableRowsIncludingCollapsed()', () => {
  it('should find row in first part', () => {
    const rowsWithPath = findTableRowsIncludingCollapsed(rows, [0]);
    const documentIds = rowsWithPath.map(row => row.row.documentId);
    expect(documentIds).toEqual(['a']);
  });

  it('should find not existing rows in second part', () => {
    expect(findTableRowsIncludingCollapsed(rows, [0, 0])).toEqual([]);
  });

  it('should find not existing rows in third part', () => {
    expect(findTableRowsIncludingCollapsed(rows, [0, 0, 0])).toEqual([]);
  });

  it('should find expanded row in second part', () => {
    const rowsWithPath = findTableRowsIncludingCollapsed(rows, [1, 1]);
    const linkedDocumentIds = rowsWithPath.map(row => row.row.documentId);
    expect(linkedDocumentIds).toEqual(['bb']);
    const paths = rowsWithPath.map(row => row.path);
    expect(paths).toEqual([[1, 1]]);
  });

  it('should find expanded row in third part', () => {
    const rowsWithPath = findTableRowsIncludingCollapsed(rows, [1, 1, 1]);
    const linkedDocumentIds = rowsWithPath.map(row => row.row.documentId);
    expect(linkedDocumentIds).toEqual(['bbb']);
    const paths = rowsWithPath.map(row => row.path);
    expect(paths).toEqual([[1, 1, 1]]);
  });

  it('should find collapsed rows in second part', () => {
    const rowsWithPath = findTableRowsIncludingCollapsed(rows, [2, 0]);
    const linkedDocumentIds = rowsWithPath.map(row => row.row.documentId);
    expect(linkedDocumentIds).toEqual(['ca', 'cb']);
    const paths = rowsWithPath.map(row => row.path);
    expect(paths).toEqual([
      [2, 0],
      [2, 1],
    ]);
  });

  it('should find collapsed rows in third part', () => {
    const rowsWithPath = findTableRowsIncludingCollapsed(rows, [2, 0, 1]);
    const linkedDocumentIds = rowsWithPath.map(row => row.row.documentId);
    expect(linkedDocumentIds).toEqual(['caa', 'cab', 'cba', 'cbb']);
    const paths = rowsWithPath.map(row => row.path);
    expect(paths).toEqual([
      [2, 0, 0],
      [2, 0, 1],
      [2, 1, 0],
      [2, 1, 1],
    ]);
  });
});
