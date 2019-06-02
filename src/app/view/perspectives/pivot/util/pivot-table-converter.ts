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

import {PivotData, PivotDataHeader} from './pivot-data';
import {PivotTable, PivotTableCell} from './pivot-table';
import {PivotConfig} from '../../../../core/store/pivots/pivot';
import {isNotNullOrUndefined} from '../../../../shared/utils/common.utils';
import {pivotConfigHasAdditionalValueLevel} from './pivot-util';
import {uniqueValues} from '../../../../shared/utils/array.utils';
import {aggregateDataValues, DataAggregationType} from '../../../../shared/utils/data/data-aggregation';

export class PivotTableConverter {
  public static readonly emptyClass = 'pivot-empty-cell';
  public static readonly dataClass = 'pivot-data-cell';
  public static readonly groupDataClass = 'pivot-group-data-cell';
  public static readonly rowHeaderClass = 'pivot-row-header-cell';
  public static readonly columnHeaderClass = 'pivot-column-header-cell';
  public static readonly groupHeaderClass = 'pivot-group-header-cell';

  private config: PivotConfig;
  private data: PivotData;
  private rowLevels: number;
  private rowsTransformationArray: number[];
  private columnLevels: number;
  private columnsTransformationArray: number[];

  constructor(private headerSummaryString: string, private summaryString: string) {}

  public transform(data: PivotData, config: PivotConfig): PivotTable {
    this.updateData(data, config);
    return this.transformData();
  }

  private updateData(data: PivotData, config: PivotConfig) {
    this.data = sortPivotData(data, config);
    this.config = config;
    this.rowLevels = (config.rowAttributes || []).length;
    this.columnLevels = (config.columnAttributes || []).length + (pivotConfigHasAdditionalValueLevel(config) ? 1 : 0);
    const hasValue = (config.valueAttributes || []).length > 0;
    const numberOfSums = Math.max(1, (data.valueTitles || []).length);
    if ((data.rowHeaders || []).length > 0) {
      this.rowsTransformationArray = createTransformationMap(data.rowHeaders, this.rowShowSums, this.columnLevels, 1);
    } else {
      this.rowsTransformationArray = hasValue ? [this.columnLevels] : [];
    }

    if ((data.columnHeaders || []).length > 0) {
      this.columnsTransformationArray = createTransformationMap(
        data.columnHeaders,
        this.columnShowSums,
        this.rowLevels,
        numberOfSums
      );
    } else {
      this.columnsTransformationArray = hasValue ? [this.rowLevels] : [];
    }
  }

  private get rowShowSums(): boolean[] {
    return ((this.config && this.config.rowAttributes) || []).map(a => a.showSums);
  }

  private get columnShowSums(): boolean[] {
    return ((this.config && this.config.columnAttributes) || []).map(a => a.showSums);
  }

  private transformData(): PivotTable {
    const cells = this.initCells();
    const rowGroups = this.fillCellsByRows(cells);
    const columnGroups = this.fillCellsByColumns(cells);
    this.fillCellsByGroupIntersection(cells, rowGroups, columnGroups);

    return {cells};
  }

  private fillCellsByRows(cells: PivotTableCell[][]): number[][] {
    const rowGroups = [];
    this.iterateAndFillCellsByRows(cells, rowGroups, this.data.rowHeaders, this.columnLevels, this.rowShowSums, 0);
    return rowGroups;
  }

  private iterateAndFillCellsByRows(
    cells: PivotTableCell[][],
    rowGroups: number[][],
    headers: PivotDataHeader[],
    startIndex: number,
    showSums: boolean[],
    level: number,
    parentTitle?: string
  ) {
    let currentIndex = startIndex;
    for (const header of headers) {
      const rowSpan = getDirectHeaderChildCount(header, level, showSums);
      cells[currentIndex][level] = {
        value: header.title,
        cssClass: PivotTableConverter.rowHeaderClass,
        isHeader: true,
        rowSpan,
        colSpan: 1,
      };

      if (header.children) {
        this.iterateAndFillCellsByRows(
          cells,
          rowGroups,
          header.children,
          currentIndex,
          showSums,
          level + 1,
          header.title
        );
      } else if (isNotNullOrUndefined(header.targetIndex)) {
        this.fillCellsForRow(cells, header.targetIndex);
      }

      currentIndex += getHeaderChildCount(header, level, showSums);
    }

    if (showSums[level]) {
      const groupTitle = level === 0 ? this.summaryString : this.createHeaderTitle(parentTitle);
      const columnIndex = Math.max(level - 1, 0);
      cells[currentIndex][columnIndex] = {
        value: groupTitle,
        cssClass: PivotTableConverter.groupHeaderClass,
        isHeader: true,
        rowSpan: 1,
        colSpan: this.rowLevels - columnIndex,
      };

      const rowIndexes = this.getIndexesForHeaders(headers);
      rowGroups[currentIndex] = rowIndexes
        .map(v => this.rowsTransformationArray[v])
        .filter(v => isNotNullOrUndefined(v));
      this.fillCellsForGroupedRow(cells, rowIndexes, currentIndex);
    }
  }

  public createHeaderTitle(value: string): string {
    return `${this.headerSummaryString} ${value}`;
  }

  private fillCellsForRow(cells: PivotTableCell[][], row: number) {
    const rowIndexInCells = this.rowsTransformationArray[row];
    if (isNotNullOrUndefined(rowIndexInCells)) {
      for (let column = 0; column < this.columnsTransformationArray.length; column++) {
        const columnIndexInCells = this.columnsTransformationArray[column];
        if (isNotNullOrUndefined(columnIndexInCells)) {
          const value = this.data.values[row][column];
          const stringValue = isNotNullOrUndefined(value) ? String(value) : '';
          cells[rowIndexInCells][columnIndexInCells] = {
            value: stringValue,
            rowSpan: 1,
            colSpan: 1,
            cssClass: PivotTableConverter.dataClass,
            isHeader: false,
          };
        }
      }
    }
  }

  private fillCellsForGroupedRow(cells: PivotTableCell[][], rows: number[], rowIndexInCells: number) {
    for (let column = 0; column < this.columnsTransformationArray.length; column++) {
      const columnIndexInCells = this.columnsTransformationArray[column];
      if (isNotNullOrUndefined(columnIndexInCells)) {
        const values = this.getValuesForRowsAndCols(rows, [column]);
        const aggregatedValue = aggregateDataValues(DataAggregationType.Sum, values);
        cells[rowIndexInCells][columnIndexInCells] = {
          value: String(aggregatedValue),
          colSpan: 1,
          rowSpan: 1,
          cssClass: PivotTableConverter.groupDataClass,
          isHeader: false,
        };
      }
    }
  }

  private getValuesForRowsAndCols(rows: number[], columns: number[]): any[] {
    const values = [];
    for (const row of rows) {
      for (const column of columns) {
        values.push(this.data.values[row][column]);
      }
    }
    return values;
  }

  private getIndexesForHeaders(headers: PivotDataHeader[]): number[] {
    const allRows = (headers || []).reduce((rows, header) => [...rows, ...this.getIndexesForHeader(header)], []);
    return uniqueValues<number>(allRows);
  }

  private getIndexesForHeader(pivotDataHeader: PivotDataHeader): number[] {
    if (pivotDataHeader.children) {
      return pivotDataHeader.children.reduce((rows, header) => [...rows, ...this.getIndexesForHeader(header)], []);
    }
    return [pivotDataHeader.targetIndex];
  }

  private fillCellsByColumns(cells: PivotTableCell[][]): number[][] {
    const columnGroups = [];
    this.iterateAndFillCellsByColumns(
      cells,
      columnGroups,
      this.data.columnHeaders,
      this.rowLevels,
      this.columnShowSums,
      0
    );
    return columnGroups;
  }

  private iterateAndFillCellsByColumns(
    cells: PivotTableCell[][],
    columnGroups: number[][],
    headers: PivotDataHeader[],
    startIndex: number,
    showSums: boolean[],
    level: number,
    parentTitle?: string
  ) {
    let currentIndex = startIndex;
    for (const header of headers) {
      const colSpan = getDirectHeaderChildCount(header, level, showSums);
      cells[level][currentIndex] = {
        value: header.title,
        cssClass: PivotTableConverter.columnHeaderClass,
        isHeader: true,
        rowSpan: 1,
        colSpan,
      };

      if (header.children) {
        this.iterateAndFillCellsByColumns(
          cells,
          columnGroups,
          header.children,
          currentIndex,
          showSums,
          level + 1,
          header.title
        );
      } else if (isNotNullOrUndefined(header.targetIndex)) {
        this.fillCellsForColumn(cells, header.targetIndex);
      }

      currentIndex += getHeaderChildCount(header, level, showSums);
    }

    if (showSums[level]) {
      const groupTitle = level === 0 ? this.summaryString : this.createHeaderTitle(parentTitle);
      const numberOfValues = this.data.valueTitles.length;
      const rowIndex = Math.max(level - 1, 0);
      const shouldAddValueHeaders = numberOfValues > 1;

      cells[rowIndex][currentIndex] = {
        value: groupTitle,
        cssClass: PivotTableConverter.groupHeaderClass,
        isHeader: true,
        rowSpan: this.columnLevels - rowIndex - (shouldAddValueHeaders ? 1 : 0),
        colSpan: Math.max(1, numberOfValues),
      };

      for (let i = 0; i < numberOfValues; i++) {
        const columnIndexInCells = currentIndex + i;
        if (shouldAddValueHeaders) {
          const valueTitle = this.data.valueTitles[i];
          cells[this.columnLevels - 1][columnIndexInCells] = {
            value: valueTitle,
            cssClass: PivotTableConverter.groupHeaderClass,
            isHeader: true,
            rowSpan: 1,
            colSpan: 1,
          };
        }

        const columnsIndexes = this.getIndexesForHeaders(headers);
        const valueColumnsIndexes = columnsIndexes.filter(index => index % numberOfValues === i);
        columnGroups[columnIndexInCells] = valueColumnsIndexes
          .map(v => this.columnsTransformationArray[v])
          .filter(v => isNotNullOrUndefined(v));
        this.fillCellsForGroupedColumn(cells, valueColumnsIndexes, columnIndexInCells);
      }
    }
  }

  private fillCellsForGroupedColumn(cells: PivotTableCell[][], columns: number[], columnIndexInCells: number) {
    for (let row = 0; row < this.rowsTransformationArray.length; row++) {
      const rowIndexInCells = this.rowsTransformationArray[row];
      if (isNotNullOrUndefined(rowIndexInCells)) {
        const values = this.getValuesForRowsAndCols([row], columns);
        const aggregatedValue = aggregateDataValues(DataAggregationType.Sum, values);
        cells[rowIndexInCells][columnIndexInCells] = {
          value: String(aggregatedValue),
          colSpan: 1,
          rowSpan: 1,
          cssClass: PivotTableConverter.groupDataClass,
          isHeader: false,
        };
      }
    }
  }

  private fillCellsForColumn(cells: PivotTableCell[][], column: number) {
    const columnIndexInCells = this.columnsTransformationArray[column];
    if (isNotNullOrUndefined(columnIndexInCells)) {
      for (let row = 0; row < this.rowsTransformationArray.length; row++) {
        const rowIndexInCells = this.rowsTransformationArray[row];
        if (isNotNullOrUndefined(rowIndexInCells)) {
          const value = this.data.values[row][column];
          const stringValue = isNotNullOrUndefined(value) ? String(value) : '';
          cells[rowIndexInCells][columnIndexInCells] = {
            value: stringValue,
            rowSpan: 1,
            colSpan: 1,
            cssClass: PivotTableConverter.dataClass,
            isHeader: false,
          };
        }
      }
    }
  }

  private fillCellsByGroupIntersection(cells: PivotTableCell[][], rowGroups: number[][], columnGroups: number[][]) {
    for (let j = 0; j < columnGroups.length; j++) {
      const columnIndexes = columnGroups[j] || [];
      if (columnIndexes.length) {
        for (let i = 0; i < rowGroups.length; i++) {
          const rowIndexes = rowGroups[i] || [];
          if (rowIndexes.length) {
            // it's enough to fill group values only from row side
            const values = this.getValuesFromCells(cells, rowIndexes, [j]);
            const aggregatedValue = aggregateDataValues(DataAggregationType.Sum, values);
            cells[i][j] = {
              value: String(aggregatedValue),
              colSpan: 1,
              rowSpan: 1,
              cssClass: PivotTableConverter.groupDataClass,
              isHeader: false,
            };
          }
        }
      }
    }
  }

  private getValuesFromCells(cells: PivotTableCell[][], rows: number[], columns: number[]): string[] {
    const values = [];
    for (const row of rows) {
      for (const column of columns) {
        values.push(cells[row][column].value);
      }
    }
    return values;
  }

  private initCells(): PivotTableCell[][] {
    const rows = this.getRowsCount() + this.columnLevels;
    const columns = this.getColumnsCount() + this.rowLevels;

    const matrix: PivotTableCell[][] = [];
    for (let i = 0; i < rows; i++) {
      matrix[i] = [];
      for (let j = 0; j < columns; j++) {
        matrix[i][j] = undefined;
      }
    }

    if (this.rowLevels > 0 && this.columnLevels > 0) {
      matrix[0][0] = {
        value: '',
        cssClass: PivotTableConverter.emptyClass,
        rowSpan: this.columnLevels,
        colSpan: this.rowLevels,
        isHeader: false,
      };
    }

    return matrix;
  }

  private getRowsCount(): number {
    if (this.data.rowHeaders.length === 0 && (this.config.valueAttributes || []).length > 0) {
      return 1;
    }
    return getHeadersChildCount(this.data.rowHeaders, this.rowShowSums);
  }

  private getColumnsCount(): number {
    if (this.data.columnHeaders.length === 0 && (this.config.valueAttributes || []).length > 0) {
      return 1;
    }
    const numberOfSums = Math.max(1, (this.data.valueTitles || []).length);
    return getHeadersChildCount(this.data.columnHeaders, this.columnShowSums, numberOfSums);
  }
}

function createTransformationMap(
  headers: PivotDataHeader[],
  showSums: boolean[],
  additionalNum: number,
  numberOfSums: number
): number[] {
  const array = [];
  iterateThroughTransformationMap(headers, additionalNum, array, 0, showSums, numberOfSums);
  return array;
}

function iterateThroughTransformationMap(
  headers: PivotDataHeader[],
  additionalNum: number,
  array: number[],
  level: number,
  showSums: boolean[],
  numberOfSums: number
) {
  let additional = additionalNum;
  for (const header of headers) {
    if (header.children) {
      iterateThroughTransformationMap(header.children, additional, array, level + 1, showSums, numberOfSums);
      additional += showSums[level + 1] ? numberOfSums : 0;
    } else if (isNotNullOrUndefined(header.targetIndex)) {
      array[header.targetIndex] = header.targetIndex + additional;
    }
  }
}

function getHeadersChildCount(headers: PivotDataHeader[], showSums: boolean[], numberOfSums = 1): number {
  return (headers || []).reduce(
    (sum, header) => sum + getHeaderChildCount(header, 0, showSums, numberOfSums),
    showSums[0] ? numberOfSums : 0
  );
}

function getHeaderChildCount(
  pivotDataHeader: PivotDataHeader,
  level: number,
  showSums: boolean[],
  numberOfSums = 1
): number {
  if (pivotDataHeader.children) {
    return pivotDataHeader.children.reduce(
      (sum, header) => sum + getHeaderChildCount(header, level + 1, showSums, numberOfSums),
      showSums[level + 1] ? numberOfSums : 0
    );
  }
  return 1;
}

function getDirectHeaderChildCount(
  pivotDataHeader: PivotDataHeader,
  level: number,
  showSums: boolean[],
  numberOfSums = 1
): number {
  if (pivotDataHeader.children) {
    return pivotDataHeader.children.reduce(
      (sum, header) => sum + getHeaderChildCount(header, level + 1, showSums, numberOfSums),
      0
    );
  }
  return 1;
}

function sortPivotData(data: PivotData, config: PivotConfig): PivotData {
  // TODO sort
  return data;
}
