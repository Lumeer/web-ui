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

import {PivotTableConverter} from './pivot-table-converter';
import {PivotData} from './pivot-data';
import {PivotAttribute, PivotConfig, PivotValueAttribute} from '../../../../core/store/pivots/pivot';
import {AttributesResourceType} from '../../../../core/model/resource';
import {DataAggregationType} from '../../../../shared/utils/data/data-aggregation';
import {COLOR_GRAY400, COLOR_GRAY500} from '../../../../core/constants';

describe('Pivot table converter', () => {
  const converter: PivotTableConverter = new PivotTableConverter('H', 'S');

  function createDummyAttribute(): PivotAttribute {
    return {resourceType: AttributesResourceType.Collection, resourceId: 'aaa', attributeId: 'a1', resourceIndex: 0};
  }

  function createDummyValueAttribute(): PivotValueAttribute {
    return {
      resourceType: AttributesResourceType.Collection,
      resourceId: 'aaa',
      attributeId: 'a1',
      resourceIndex: 0,
      aggregation: DataAggregationType.Sum,
    };
  }

  it('should return empty rows', () => {
    const data: PivotData = {valueTitles: [], rowHeaders: [], columnHeaders: [], values: []};
    const config: PivotConfig = {rowAttributes: [], columnAttributes: [], valueAttributes: []};
    expect(converter.transform(data, config)).toEqual({cells: []});
  });

  it('should return table by only values', () => {
    const data: PivotData = {
      valueTitles: ['A', 'B', 'C'],
      rowHeaders: [],
      columnHeaders: [
        {title: 'A', targetIndex: 0, color: undefined},
        {title: 'B', targetIndex: 1, color: undefined},
        {title: 'C', targetIndex: 2, color: undefined},
      ],
      values: [[10, 20, 30]],
    };
    const config: PivotConfig = {
      rowAttributes: [],
      columnAttributes: [],
      valueAttributes: [createDummyValueAttribute(), createDummyValueAttribute(), createDummyValueAttribute()],
    };

    const pivotTable = converter.transform(data, config);
    expect(pivotTable.cells.length).toEqual(2);
    expect(pivotTable.cells[0].length).toEqual(3);
    expect(pivotTable.cells[1].length).toEqual(3);
    expect(pivotTable.cells[0][0]).toEqual({
      value: 'A',
      rowSpan: 1,
      colSpan: 1,
      isHeader: true,
      cssClass: PivotTableConverter.columnHeaderClass,
      background: undefined,
    });
    expect(pivotTable.cells[0][1]).toEqual({
      value: 'B',
      rowSpan: 1,
      colSpan: 1,
      isHeader: true,
      cssClass: PivotTableConverter.columnHeaderClass,
      background: undefined,
    });
    expect(pivotTable.cells[0][2]).toEqual({
      value: 'C',
      rowSpan: 1,
      colSpan: 1,
      isHeader: true,
      cssClass: PivotTableConverter.columnHeaderClass,
      background: undefined,
    });
    expect(pivotTable.cells[1][0]).toEqual({
      value: '10',
      rowSpan: 1,
      colSpan: 1,
      isHeader: false,
      cssClass: PivotTableConverter.dataClass,
    });
    expect(pivotTable.cells[1][1]).toEqual({
      value: '20',
      rowSpan: 1,
      colSpan: 1,
      isHeader: false,
      cssClass: PivotTableConverter.dataClass,
    });
    expect(pivotTable.cells[1][2]).toEqual({
      value: '30',
      rowSpan: 1,
      colSpan: 1,
      isHeader: false,
      cssClass: PivotTableConverter.dataClass,
    });
  });

  it('should return table by only rows', () => {
    const data: PivotData = {
      valueTitles: [],
      rowHeaders: [
        {
          title: 'A',
          children: [{title: 'a1', targetIndex: 0, color: undefined}, {title: 'a2', targetIndex: 1, color: undefined}],
          color: undefined,
        },
        {title: 'B', children: [{title: 'a1', targetIndex: 2, color: undefined}], color: undefined},
        {
          title: 'C',
          children: [
            {title: 'a2', targetIndex: 3, color: undefined},
            {title: 'a3', targetIndex: 4, color: undefined},
            {title: 'a4', targetIndex: 5, color: undefined},
          ],
          color: undefined,
        },
      ],
      columnHeaders: [],
      values: [],
    };
    const config: PivotConfig = {
      rowAttributes: [{...createDummyAttribute(), showSums: true}, {...createDummyAttribute(), showSums: true}],
      columnAttributes: [],
      valueAttributes: [],
    };
    const pivotTable = converter.transform(data, config);
    expect(pivotTable.cells.length).toEqual(10);
    expect(pivotTable.cells[0][0]).toEqual({
      value: 'A',
      rowSpan: 2,
      colSpan: 1,
      isHeader: true,
      cssClass: PivotTableConverter.rowHeaderClass,
      background: undefined,
    });
    expect(pivotTable.cells[0][1]).toEqual({
      value: 'a1',
      rowSpan: 1,
      colSpan: 1,
      isHeader: true,
      cssClass: PivotTableConverter.rowHeaderClass,
      background: undefined,
    });
    expect(pivotTable.cells[1][0]).toEqual(undefined);
    expect(pivotTable.cells[1][1]).toEqual({
      value: 'a2',
      rowSpan: 1,
      colSpan: 1,
      isHeader: true,
      cssClass: PivotTableConverter.rowHeaderClass,
      background: undefined,
    });
    expect(pivotTable.cells[2][0]).toEqual({
      value: converter.createHeaderTitle('A'),
      rowSpan: 1,
      colSpan: 2,
      isHeader: true,
      cssClass: PivotTableConverter.groupHeaderClass,
      background: COLOR_GRAY400,
    });
    expect(pivotTable.cells[2][1]).toEqual(undefined);

    expect(pivotTable.cells[3][0]).toEqual({
      value: 'B',
      rowSpan: 1,
      colSpan: 1,
      isHeader: true,
      cssClass: PivotTableConverter.rowHeaderClass,
      background: undefined,
    });
    expect(pivotTable.cells[3][1]).toEqual({
      value: 'a1',
      rowSpan: 1,
      colSpan: 1,
      isHeader: true,
      cssClass: PivotTableConverter.rowHeaderClass,
      background: undefined,
    });
    expect(pivotTable.cells[4][0]).toEqual({
      value: converter.createHeaderTitle('B'),
      rowSpan: 1,
      colSpan: 2,
      isHeader: true,
      cssClass: PivotTableConverter.groupHeaderClass,
      background: COLOR_GRAY400,
    });
    expect(pivotTable.cells[4][1]).toEqual(undefined);

    expect(pivotTable.cells[5][0]).toEqual({
      value: 'C',
      rowSpan: 3,
      colSpan: 1,
      isHeader: true,
      cssClass: PivotTableConverter.rowHeaderClass,
      background: undefined,
    });
    expect(pivotTable.cells[5][1]).toEqual({
      value: 'a2',
      rowSpan: 1,
      colSpan: 1,
      isHeader: true,
      cssClass: PivotTableConverter.rowHeaderClass,
      background: undefined,
    });
    expect(pivotTable.cells[6][0]).toEqual(undefined);
    expect(pivotTable.cells[6][1]).toEqual({
      value: 'a3',
      rowSpan: 1,
      colSpan: 1,
      isHeader: true,
      cssClass: PivotTableConverter.rowHeaderClass,
      background: undefined,
    });
    expect(pivotTable.cells[7][0]).toEqual(undefined);
    expect(pivotTable.cells[7][1]).toEqual({
      value: 'a4',
      rowSpan: 1,
      colSpan: 1,
      isHeader: true,
      cssClass: PivotTableConverter.rowHeaderClass,
      background: undefined,
    });
    expect(pivotTable.cells[8][0]).toEqual({
      value: converter.createHeaderTitle('C'),
      rowSpan: 1,
      colSpan: 2,
      isHeader: true,
      cssClass: PivotTableConverter.groupHeaderClass,
      background: COLOR_GRAY400,
    });
    expect(pivotTable.cells[8][1]).toEqual(undefined);
    expect(pivotTable.cells[9][0]).toEqual({
      value: 'S',
      rowSpan: 1,
      colSpan: 2,
      isHeader: true,
      cssClass: PivotTableConverter.groupHeaderClass,
      background: COLOR_GRAY500,
    });
    expect(pivotTable.cells[9][1]).toEqual(undefined);

    const configWithoutSums: PivotConfig = {
      rowAttributes: [createDummyAttribute(), createDummyAttribute()],
      columnAttributes: [],
      valueAttributes: [],
    };
    const pivotTableWithoutSums = converter.transform(data, configWithoutSums);
    expect(pivotTableWithoutSums.cells.length).toEqual(6);
  });

  it('should return table by only columns', () => {
    const data: PivotData = {
      valueTitles: [],
      rowHeaders: [],
      columnHeaders: [
        {title: 'X', children: [{title: 'a1', targetIndex: 0, color: undefined}], color: undefined},
        {
          title: 'Y',
          children: [{title: 'a1', targetIndex: 1, color: undefined}, {title: 'a2', targetIndex: 2, color: undefined}],
          color: undefined,
        },
        {
          title: 'Z',
          children: [{title: 'a2', targetIndex: 3, color: undefined}, {title: 'a3', targetIndex: 4, color: undefined}],
          color: undefined,
        },
      ],
      values: [],
    };
    const config: PivotConfig = {
      columnAttributes: [{...createDummyAttribute(), showSums: true}, {...createDummyAttribute(), showSums: true}],
      rowAttributes: [],
      valueAttributes: [],
    };
    const pivotTable = converter.transform(data, config);
    expect(pivotTable.cells.length).toEqual(2);
    expect(pivotTable.cells[0].length).toEqual(9);
    expect(pivotTable.cells[0][0]).toEqual({
      value: 'X',
      rowSpan: 1,
      colSpan: 1,
      isHeader: true,
      cssClass: PivotTableConverter.columnHeaderClass,
      background: undefined,
    });
    expect(pivotTable.cells[1][0]).toEqual({
      value: 'a1',
      rowSpan: 1,
      colSpan: 1,
      isHeader: true,
      cssClass: PivotTableConverter.columnHeaderClass,
      background: undefined,
    });
    expect(pivotTable.cells[0][1]).toEqual({
      value: converter.createHeaderTitle('X'),
      rowSpan: 2,
      colSpan: 1,
      isHeader: true,
      cssClass: PivotTableConverter.groupHeaderClass,
      background: COLOR_GRAY400,
    });
    expect(pivotTable.cells[1][1]).toEqual(undefined);

    expect(pivotTable.cells[0][2]).toEqual({
      value: 'Y',
      rowSpan: 1,
      colSpan: 2,
      isHeader: true,
      cssClass: PivotTableConverter.columnHeaderClass,
      background: undefined,
    });
    expect(pivotTable.cells[0][3]).toEqual(undefined);
    expect(pivotTable.cells[1][2]).toEqual({
      value: 'a1',
      rowSpan: 1,
      colSpan: 1,
      isHeader: true,
      cssClass: PivotTableConverter.columnHeaderClass,
      background: undefined,
    });
    expect(pivotTable.cells[1][3]).toEqual({
      value: 'a2',
      rowSpan: 1,
      colSpan: 1,
      isHeader: true,
      cssClass: PivotTableConverter.columnHeaderClass,
      background: undefined,
    });
    expect(pivotTable.cells[0][4]).toEqual({
      value: converter.createHeaderTitle('Y'),
      rowSpan: 2,
      colSpan: 1,
      isHeader: true,
      cssClass: PivotTableConverter.groupHeaderClass,
      background: COLOR_GRAY400,
    });
    expect(pivotTable.cells[1][4]).toEqual(undefined);

    expect(pivotTable.cells[0][5]).toEqual({
      value: 'Z',
      rowSpan: 1,
      colSpan: 2,
      isHeader: true,
      cssClass: PivotTableConverter.columnHeaderClass,
      background: undefined,
    });
    expect(pivotTable.cells[0][6]).toEqual(undefined);
    expect(pivotTable.cells[1][5]).toEqual({
      value: 'a2',
      rowSpan: 1,
      colSpan: 1,
      isHeader: true,
      cssClass: PivotTableConverter.columnHeaderClass,
      background: undefined,
    });
    expect(pivotTable.cells[1][6]).toEqual({
      value: 'a3',
      rowSpan: 1,
      colSpan: 1,
      isHeader: true,
      cssClass: PivotTableConverter.columnHeaderClass,
      background: undefined,
    });
    expect(pivotTable.cells[0][7]).toEqual({
      value: converter.createHeaderTitle('Z'),
      rowSpan: 2,
      colSpan: 1,
      isHeader: true,
      cssClass: PivotTableConverter.groupHeaderClass,
      background: COLOR_GRAY400,
    });
    expect(pivotTable.cells[1][7]).toEqual(undefined);
    expect(pivotTable.cells[0][8]).toEqual({
      value: 'S',
      rowSpan: 2,
      colSpan: 1,
      isHeader: true,
      cssClass: PivotTableConverter.groupHeaderClass,
      background: COLOR_GRAY500,
    });
    expect(pivotTable.cells[1][8]).toEqual(undefined);

    const configWithoutSums: PivotConfig = {
      columnAttributes: [createDummyAttribute(), createDummyAttribute()],
      rowAttributes: [],
      valueAttributes: [],
    };
    const pivotTableWithoutSums = converter.transform(data, configWithoutSums);
    expect(pivotTableWithoutSums.cells.length).toEqual(2);
    expect(pivotTableWithoutSums.cells[0].length).toEqual(5);
  });

  it('should return table by row and values', () => {
    const data: PivotData = {
      valueTitles: ['X', 'Y'],
      rowHeaders: [
        {
          title: 'A',
          children: [
            {title: 'a1', targetIndex: 0, color: undefined},
            {title: 'a2', targetIndex: 1, color: undefined},
            {title: 'a3', targetIndex: 2, color: undefined},
          ],
          color: undefined,
        },
        {
          title: 'B',
          children: [{title: 'a2', targetIndex: 3, color: undefined}, {title: 'a3', targetIndex: 4, color: undefined}],
          color: undefined,
        },
        {title: 'C', children: [{title: 'a1', targetIndex: 5, color: undefined}], color: undefined},
      ],
      columnHeaders: [{title: 'X', targetIndex: 0, color: undefined}, {title: 'Y', targetIndex: 1, color: undefined}],
      values: [[1, 2], [2, null], [3, 5], [8, 9], [1, 9], [null, 4]],
    };
    const config: PivotConfig = {
      columnAttributes: [],
      rowAttributes: [{...createDummyAttribute(), showSums: true}, {...createDummyAttribute(), showSums: true}],
      valueAttributes: [createDummyValueAttribute(), createDummyValueAttribute()],
    };

    const pivotTable = converter.transform(data, config);
    expect(pivotTable.cells.length).toEqual(11);
    expect(pivotTable.cells[0].length).toEqual(4);
    expect(pivotTable.cells[0][0]).toEqual({
      value: '',
      rowSpan: 1,
      colSpan: 2,
      isHeader: false,
      cssClass: PivotTableConverter.emptyClass,
    });
    expect(pivotTable.cells[0][2]).toEqual({
      value: 'X',
      rowSpan: 1,
      colSpan: 1,
      isHeader: true,
      cssClass: PivotTableConverter.columnHeaderClass,
      background: undefined,
    });
    expect(pivotTable.cells[0][3]).toEqual({
      value: 'Y',
      rowSpan: 1,
      colSpan: 1,
      isHeader: true,
      cssClass: PivotTableConverter.columnHeaderClass,
      background: undefined,
    });

    expect(pivotTable.cells[1][2].value).toEqual('1');
    expect(pivotTable.cells[1][3].value).toEqual('2');
    expect(pivotTable.cells[2][2].value).toEqual('2');
    expect(pivotTable.cells[2][3].value).toEqual('');
    expect(pivotTable.cells[4][2].value).toEqual('6');
    expect(pivotTable.cells[4][3].value).toEqual('7');

    expect(pivotTable.cells[7][2].value).toEqual('9');
    expect(pivotTable.cells[7][3].value).toEqual('18');

    expect(pivotTable.cells[8][2].value).toEqual('');
    expect(pivotTable.cells[8][3].value).toEqual('4');
    expect(pivotTable.cells[9][2].value).toEqual('0');
    expect(pivotTable.cells[9][3].value).toEqual('4');

    expect(pivotTable.cells[10][2].value).toEqual('15');
    expect(pivotTable.cells[10][3].value).toEqual('29');
  });

  it('should return table by column and values percentage', () => {
    const data: PivotData = {
      valueTitles: ['X', 'Y'],
      rowHeaders: [
        {
          title: 'A',
          children: [
            {title: 'a1', targetIndex: 0, color: undefined},
            {title: 'a2', targetIndex: 1, color: undefined},
            {title: 'a3', targetIndex: 2, color: undefined},
          ],
          color: undefined,
        },
        {
          title: 'B',
          children: [{title: 'a2', targetIndex: 3, color: undefined}, {title: 'a3', targetIndex: 4, color: undefined}],
          color: undefined,
        },
        {title: 'C', children: [{title: 'a1', targetIndex: 5, color: undefined}], color: undefined},
      ],
      columnHeaders: [{title: 'X', targetIndex: 0, color: undefined}, {title: 'Y', targetIndex: 1, color: undefined}],
      values: [['10%', '20%'], ['20%', null], ['30%', '50%'], ['80%', '90%'], ['10%', '90%'], [null, '40%']],
    };
    const config: PivotConfig = {
      columnAttributes: [],
      rowAttributes: [{...createDummyAttribute(), showSums: true}, {...createDummyAttribute(), showSums: true}],
      valueAttributes: [createDummyValueAttribute(), createDummyValueAttribute()],
    };

    const pivotTable = converter.transform(data, config);

    expect(pivotTable.cells[1][2].value).toEqual('10%');
    expect(pivotTable.cells[1][3].value).toEqual('20%');
    expect(pivotTable.cells[2][2].value).toEqual('20%');
    expect(pivotTable.cells[2][3].value).toEqual('');
    expect(pivotTable.cells[4][2].value).toEqual('60%');
    expect(pivotTable.cells[4][3].value).toEqual('70%');

    expect(pivotTable.cells[7][2].value).toEqual('90%');
    expect(pivotTable.cells[7][3].value).toEqual('180%');

    expect(pivotTable.cells[8][2].value).toEqual('');
    expect(pivotTable.cells[8][3].value).toEqual('40%');
    expect(pivotTable.cells[9][2].value).toEqual('0');
    expect(pivotTable.cells[9][3].value).toEqual('40%');

    expect(pivotTable.cells[10][2].value).toEqual('150%');
    expect(pivotTable.cells[10][3].value).toEqual('290%');
  });

  it('should return table by column and values', () => {
    const data: PivotData = {
      valueTitles: ['X', 'Y', 'Z'],
      rowHeaders: [],
      columnHeaders: [
        {
          title: 'A',
          children: [
            {title: 'X', targetIndex: 0, color: undefined},
            {title: 'Y', targetIndex: 1, color: undefined},
            {title: 'Z', targetIndex: 2, color: undefined},
          ],
          color: undefined,
        },
        {
          title: 'B',
          children: [
            {title: 'X', targetIndex: 3, color: undefined},
            {title: 'Y', targetIndex: 4, color: undefined},
            {title: 'Z', targetIndex: 5, color: undefined},
          ],
          color: undefined,
        },
        {
          title: 'C',
          children: [
            {title: 'X', targetIndex: 6, color: undefined},
            {title: 'Y', targetIndex: 7, color: undefined},
            {title: 'Z', targetIndex: 8, color: undefined},
          ],
          color: undefined,
        },
      ],
      values: [[1, 5, 6, 2, null, 1, 4, 5, null]],
    };
    const config: PivotConfig = {
      columnAttributes: [{...createDummyAttribute(), showSums: true}],
      rowAttributes: [],
      valueAttributes: [createDummyValueAttribute(), createDummyValueAttribute(), createDummyValueAttribute()],
    };

    const pivotTable = converter.transform(data, config);
    expect(pivotTable.cells[0][0]).toEqual({
      value: 'A',
      isHeader: true,
      colSpan: 3,
      rowSpan: 1,
      cssClass: PivotTableConverter.columnHeaderClass,
      background: undefined,
    });
    expect(pivotTable.cells[0][3]).toEqual({
      value: 'B',
      isHeader: true,
      colSpan: 3,
      rowSpan: 1,
      cssClass: PivotTableConverter.columnHeaderClass,
      background: undefined,
    });
    expect(pivotTable.cells[0][6]).toEqual({
      value: 'C',
      isHeader: true,
      colSpan: 3,
      rowSpan: 1,
      cssClass: PivotTableConverter.columnHeaderClass,
      background: undefined,
    });
    expect(pivotTable.cells[0][9]).toEqual({
      value: 'S',
      isHeader: true,
      colSpan: 3,
      rowSpan: 1,
      cssClass: PivotTableConverter.groupHeaderClass,
      background: COLOR_GRAY500,
    });

    expect(pivotTable.cells[1][9]).toEqual({
      value: 'X',
      isHeader: true,
      colSpan: 1,
      rowSpan: 1,
      cssClass: PivotTableConverter.groupHeaderClass,
      background: COLOR_GRAY500,
    });
    expect(pivotTable.cells[1][10]).toEqual({
      value: 'Y',
      isHeader: true,
      colSpan: 1,
      rowSpan: 1,
      cssClass: PivotTableConverter.groupHeaderClass,
      background: COLOR_GRAY500,
    });
    expect(pivotTable.cells[1][11]).toEqual({
      value: 'Z',
      isHeader: true,
      colSpan: 1,
      rowSpan: 1,
      cssClass: PivotTableConverter.groupHeaderClass,
      background: COLOR_GRAY500,
    });

    expect(pivotTable.cells[2][0].value).toEqual('1');
    expect(pivotTable.cells[2][1].value).toEqual('5');
    expect(pivotTable.cells[2][2].value).toEqual('6');
    expect(pivotTable.cells[2][3].value).toEqual('2');
    expect(pivotTable.cells[2][4].value).toEqual('');
    expect(pivotTable.cells[2][5].value).toEqual('1');
    expect(pivotTable.cells[2][6].value).toEqual('4');
    expect(pivotTable.cells[2][7].value).toEqual('5');
    expect(pivotTable.cells[2][8].value).toEqual('');
    expect(pivotTable.cells[2][9].value).toEqual('7');
    expect(pivotTable.cells[2][10].value).toEqual('10');
    expect(pivotTable.cells[2][11].value).toEqual('7');
  });

  it('should return table by rows and columns and values', () => {
    const data: PivotData = {
      valueTitles: ['V'],
      rowHeaders: [
        {
          title: 'A',
          children: [
            {title: 'a1', targetIndex: 0, color: undefined},
            {title: 'a2', targetIndex: 1, color: undefined},
            {title: 'a3', targetIndex: 2, color: undefined},
          ],
          color: undefined,
        },
        {
          title: 'B',
          children: [{title: 'a2', targetIndex: 3, color: undefined}, {title: 'a3', targetIndex: 4, color: undefined}],
          color: undefined,
        },
      ],
      columnHeaders: [
        {
          title: 'X',
          children: [{title: 'x1', targetIndex: 0, color: undefined}, {title: 'x2', targetIndex: 1, color: undefined}],
          color: undefined,
        },
        {
          title: 'Y',
          children: [
            {title: 'x2', targetIndex: 2, color: undefined},
            {title: 'x3', targetIndex: 3, color: undefined},
            {title: 'x4', targetIndex: 4, color: undefined},
          ],
          color: undefined,
        },
      ],
      values: [[1, 2, 4, 1, 2], [4, 3, 3, 3, 3], [5, 0, 1, 2, 2], [2, 4, 7, 1, 3], [1, 0, 1, 1, 2]],
    };
    const config: PivotConfig = {
      columnAttributes: [{...createDummyAttribute(), showSums: true}, {...createDummyAttribute(), showSums: true}],
      rowAttributes: [{...createDummyAttribute()}, {...createDummyAttribute(), showSums: true}],
      valueAttributes: [createDummyValueAttribute()],
    };

    const pivotTable = converter.transform(data, config);
    expect(pivotTable.cells[0][0]).toEqual({
      value: '',
      rowSpan: 2,
      colSpan: 2,
      isHeader: false,
      cssClass: PivotTableConverter.emptyClass,
    });

    expect(pivotTable.cells[5][0]).toEqual({
      value: converter.createHeaderTitle('A'),
      rowSpan: 1,
      colSpan: 2,
      isHeader: true,
      cssClass: PivotTableConverter.groupHeaderClass,
      background: COLOR_GRAY400,
    });
    expect(pivotTable.cells[6][0]).toEqual({
      value: 'B',
      rowSpan: 2,
      colSpan: 1,
      isHeader: true,
      cssClass: PivotTableConverter.rowHeaderClass,
      background: undefined,
    });
    expect(pivotTable.cells[8][0]).toEqual({
      value: converter.createHeaderTitle('B'),
      rowSpan: 1,
      colSpan: 2,
      isHeader: true,
      cssClass: PivotTableConverter.groupHeaderClass,
      background: COLOR_GRAY400,
    });

    expect(pivotTable.cells[0][2]).toEqual({
      value: 'X',
      rowSpan: 1,
      colSpan: 2,
      isHeader: true,
      cssClass: PivotTableConverter.columnHeaderClass,
      background: undefined,
    });
    expect(pivotTable.cells[0][5]).toEqual({
      value: 'Y',
      rowSpan: 1,
      colSpan: 3,
      isHeader: true,
      cssClass: PivotTableConverter.columnHeaderClass,
      background: undefined,
    });
    expect(pivotTable.cells[0][4]).toEqual({
      value: converter.createHeaderTitle('X'),
      rowSpan: 2,
      colSpan: 1,
      isHeader: true,
      cssClass: PivotTableConverter.groupHeaderClass,
      background: COLOR_GRAY400,
    });
    expect(pivotTable.cells[0][8]).toEqual({
      value: converter.createHeaderTitle('Y'),
      rowSpan: 2,
      colSpan: 1,
      isHeader: true,
      cssClass: PivotTableConverter.groupHeaderClass,
      background: COLOR_GRAY400,
    });
    expect(pivotTable.cells[0][9]).toEqual({
      value: 'S',
      rowSpan: 2,
      colSpan: 1,
      isHeader: true,
      cssClass: PivotTableConverter.groupHeaderClass,
      background: COLOR_GRAY500,
    });

    expect(pivotTable.cells[2].slice(2).map(v => v.value)).toEqual(['1', '2', '3', '4', '1', '2', '7', '10']);
    expect(pivotTable.cells[3].slice(2).map(v => v.value)).toEqual(['4', '3', '7', '3', '3', '3', '9', '16']);
    expect(pivotTable.cells[4].slice(2).map(v => v.value)).toEqual(['5', '0', '5', '1', '2', '2', '5', '10']);
    expect(pivotTable.cells[5].slice(2).map(v => v.value)).toEqual(['10', '5', '15', '8', '6', '7', '21', '36']);
    expect(pivotTable.cells[6].slice(2).map(v => v.value)).toEqual(['2', '4', '6', '7', '1', '3', '11', '17']);
    expect(pivotTable.cells[7].slice(2).map(v => v.value)).toEqual(['1', '0', '1', '1', '1', '2', '4', '5']);
    expect(pivotTable.cells[8].slice(2).map(v => v.value)).toEqual(['3', '4', '7', '8', '2', '5', '15', '22']);
  });
});
