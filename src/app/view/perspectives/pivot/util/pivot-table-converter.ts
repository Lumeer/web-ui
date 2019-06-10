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

import {PivotData, PivotDataHeader} from './pivot-data';
import {PivotTable, PivotTableCell} from './pivot-table';
import {PivotConfig} from '../../../../core/store/pivots/pivot';
import {isNotNullOrUndefined, isNullOrUndefined, isNumeric, toNumber} from '../../../../shared/utils/common.utils';
import {pivotConfigHasAdditionalValueLevel} from './pivot-util';
import {uniqueValues} from '../../../../shared/utils/array.utils';
import {aggregateDataValues, DataAggregationType} from '../../../../shared/utils/data/data-aggregation';
import {COLOR_GRAY100, COLOR_GRAY200, COLOR_GRAY300, COLOR_GRAY400, COLOR_GRAY500} from '../../../../core/constants';
import {shadeColor} from '../../../../shared/utils/html-modifier';
import Big from 'big.js';

interface HeaderGroupInfo {
  background: string;
  indexes: number[];
  level: number;
}

export class PivotTableConverter {
  public static readonly emptyClass = 'pivot-empty-cell';
  public static readonly dataClass = 'pivot-data-cell';
  public static readonly groupDataClass = 'pivot-group-data-cell';
  public static readonly rowHeaderClass = 'pivot-row-header-cell';
  public static readonly columnHeaderClass = 'pivot-column-header-cell';
  public static readonly groupHeaderClass = 'pivot-group-header-cell';

  private readonly groupColors = [COLOR_GRAY500, COLOR_GRAY400, COLOR_GRAY300, COLOR_GRAY200, COLOR_GRAY100];

  private config: PivotConfig;
  private data: PivotData;
  private rowLevels: number;
  private rowsTransformationArray: number[];
  private columnLevels: number;
  private columnsTransformationArray: number[];

  constructor(private headerSummaryString: string, private summaryString: string) {}

  public transform(data: PivotData, config: PivotConfig): PivotTable {
    if (!data || !config || this.dataAreEmpty(data)) {
      return {cells: []};
    }

    this.updateData(data, config);
    return this.transformData();
  }

  private dataAreEmpty(data: PivotData): boolean {
    return (data.rowHeaders || []).length === 0 && (data.columnHeaders || []).length === 0;
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
    this.formatCellsValues(cells);

    return {cells};
  }

  private fillCellsByRows(cells: PivotTableCell[][]): HeaderGroupInfo[] {
    const rowGroups = [];
    this.iterateAndFillCellsByRows(cells, rowGroups, this.data.rowHeaders, this.columnLevels, this.rowShowSums, 0);
    return rowGroups;
  }

  private iterateAndFillCellsByRows(
    cells: PivotTableCell[][],
    rowGroupsInfo: HeaderGroupInfo[],
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
        background: this.getHeaderBackground(header, level),
      };

      if (header.children) {
        this.iterateAndFillCellsByRows(
          cells,
          rowGroupsInfo,
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
      const background = this.getSummaryBackground(level);
      const groupTitle = level === 0 ? this.summaryString : this.createHeaderTitle(parentTitle);
      const columnIndex = Math.max(level - 1, 0);
      cells[currentIndex][columnIndex] = {
        value: groupTitle,
        cssClass: PivotTableConverter.groupHeaderClass,
        isHeader: true,
        rowSpan: 1,
        colSpan: this.rowLevels - columnIndex,
        background,
      };

      const rowIndexes = this.getIndexesForHeaders(headers);
      const transformedRowIndexes = rowIndexes
        .map(v => this.rowsTransformationArray[v])
        .filter(v => isNotNullOrUndefined(v));
      rowGroupsInfo[currentIndex] = {background, indexes: transformedRowIndexes, level};

      this.fillCellsForGroupedRow(cells, rowIndexes, currentIndex, background);
    }
  }

  private getHeaderBackground(header: PivotDataHeader, level: number): string {
    if (header && header.color) {
      return shadeColor(header.color, this.getLevelOpacity(level));
    }

    return undefined;
  }

  private getLevelOpacity(level: number): number {
    return Math.min(80, 50 + level * 5) / 100;
  }

  private getSummaryBackground(level: number): string {
    const index = Math.min(level, this.groupColors.length - 1);
    return this.groupColors[index];
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

  private fillCellsForGroupedRow(
    cells: PivotTableCell[][],
    rows: number[],
    rowIndexInCells: number,
    background: string
  ) {
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
          background,
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

  private fillCellsByColumns(cells: PivotTableCell[][]): HeaderGroupInfo[] {
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
    columnGroupsInfo: HeaderGroupInfo[],
    headers: PivotDataHeader[],
    startIndex: number,
    showSums: boolean[],
    level: number,
    parentTitle?: string
  ) {
    let currentIndex = startIndex;
    const numberOfSums = Math.max(1, this.data.valueTitles.length);
    for (const header of headers) {
      const colSpan = getDirectHeaderChildCount(header, level, showSums, numberOfSums);
      cells[level][currentIndex] = {
        value: header.title,
        cssClass: PivotTableConverter.columnHeaderClass,
        isHeader: true,
        rowSpan: 1,
        colSpan,
        background: this.getHeaderBackground(header, level),
      };

      if (header.children) {
        this.iterateAndFillCellsByColumns(
          cells,
          columnGroupsInfo,
          header.children,
          currentIndex,
          showSums,
          level + 1,
          header.title
        );
      } else if (isNotNullOrUndefined(header.targetIndex)) {
        this.fillCellsForColumn(cells, header.targetIndex);
      }

      currentIndex += getHeaderChildCount(header, level, showSums, numberOfSums);
    }

    if (showSums[level]) {
      const background = this.getSummaryBackground(level);
      const groupTitle = level === 0 ? this.summaryString : this.createHeaderTitle(parentTitle);
      const numberOfValues = this.data.valueTitles.length;
      const rowIndex = Math.max(level - 1, 0);
      const shouldAddValueHeaders = numberOfValues > 1;

      cells[rowIndex][currentIndex] = {
        value: groupTitle,
        cssClass: PivotTableConverter.groupHeaderClass,
        isHeader: true,
        rowSpan: this.columnLevels - rowIndex - (shouldAddValueHeaders ? 1 : 0),
        colSpan: numberOfSums,
        background,
      };

      if (numberOfValues > 0) {
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
              background,
            };
          }

          const columnsIndexes = this.getIndexesForHeaders(headers);
          const valueColumnsIndexes = columnsIndexes.filter(index => index % numberOfValues === i);
          const transformedColumnIndexes = valueColumnsIndexes
            .map(v => this.columnsTransformationArray[v])
            .filter(v => isNotNullOrUndefined(v));
          columnGroupsInfo[columnIndexInCells] = {background, indexes: transformedColumnIndexes, level};

          this.fillCellsForGroupedColumn(cells, valueColumnsIndexes, columnIndexInCells, background);
        }
      } else {
        columnGroupsInfo[currentIndex] = {background, indexes: [], level};
      }
    }
  }

  private fillCellsForGroupedColumn(
    cells: PivotTableCell[][],
    columns: number[],
    columnIndexInCells: number,
    background: string
  ) {
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
          background,
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

  private fillCellsByGroupIntersection(
    cells: PivotTableCell[][],
    rowGroupsInfo: HeaderGroupInfo[],
    columnGroupsInfo: HeaderGroupInfo[]
  ) {
    const rowsCount = cells.length;
    const columnsCount = (cells[0] && cells[0].length) || 0;

    for (let i = 0; i < rowGroupsInfo.length; i++) {
      const rowGroupInfo = rowGroupsInfo[i];
      if (rowGroupInfo) {
        for (let j = 0; j < columnGroupsInfo.length; j++) {
          if (columnGroupsInfo[j]) {
            // it's enough to fill group values only from row side
            const values = this.getValuesFromCells(cells, rowGroupInfo.indexes, [j]);
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

        this.fillRowWithColor(cells, i, rowGroupInfo, columnsCount);
      }
    }

    for (let j = 0; j < columnGroupsInfo.length; j++) {
      if (columnGroupsInfo[j]) {
        this.fillColumnWithColor(cells, j, columnGroupsInfo[j], rowGroupsInfo, rowsCount);
      }
    }
  }

  private fillRowWithColor(
    cells: PivotTableCell[][],
    row: number,
    rowGroupInfo: HeaderGroupInfo,
    columnsCount: number
  ) {
    for (let i = this.rowLevels; i < columnsCount; i++) {
      cells[row][i] && (cells[row][i].background = rowGroupInfo.background);
    }
  }

  private fillColumnWithColor(
    cells: PivotTableCell[][],
    column: number,
    columnGroupInfo: HeaderGroupInfo,
    rowGroupsInfo: HeaderGroupInfo[],
    rowCount: number
  ) {
    for (let i = this.columnLevels; i < rowCount; i++) {
      const rowGroupInfo = rowGroupsInfo[i];
      if (!rowGroupInfo || rowGroupInfo.level > columnGroupInfo.level) {
        cells[i][column] && (cells[i][column].background = columnGroupInfo.background);
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

  private formatCellsValues(cells: PivotTableCell[][]) {
    const rowsCount = cells.length;
    const columnsCount = (cells[0] && cells[0].length) || 0;
    for (let j = this.rowLevels; j < columnsCount; j++) {
      let columnContainsPercentage = false;
      for (let i = this.columnLevels; i < rowsCount; i++) {
        if (cells[i][j] && this.isValueDecimal(cells[i][j].value)) {
          columnContainsPercentage = true;
          break;
        }
      }

      if (columnContainsPercentage) {
        for (let i = this.columnLevels; i < rowsCount; i++) {
          cells[i][j] && (cells[i][j].value = this.formatDecimalValue(cells[i][j].value));
        }
      }
    }
  }

  private isValueDecimal(value: string): boolean {
    if (isNullOrUndefined(value)) {
      return false;
    }

    if (isNumeric(value)) {
      return toNumber(value) % 1 !== 0;
    } else if (value.endsWith('%')) {
      return toNumber(value.substring(0, value.length - 1)) % 1 !== 0;
    }

    return false;
  }

  private formatDecimalValue(value: string): string {
    if (isNullOrUndefined(value)) {
      return value;
    }

    if (isNumeric(value)) {
      return new Big(toNumber(value)).toFixed(2);
    } else if (value.endsWith('%')) {
      return new Big(toNumber(value.substring(0, value.length - 1))).toFixed(2) + '%';
    }

    return '';
  }

  private initCells(): PivotTableCell[][] {
    const rows = this.getRowsCount() + this.columnLevels;
    const columns = this.getColumnsCount() + this.rowLevels;

    const matrix: PivotTableCell[][] = [];
    for (let i = 0; i < rows; i++) {
      matrix[i] = [];
      for (let j = 0; j < columns; j++) {
        if (i >= this.columnLevels && j >= this.rowLevels) {
          const isDataClass = this.rowsTransformationArray.includes(i) && this.columnsTransformationArray.includes(j);
          matrix[i][j] = {
            value: '',
            cssClass: isDataClass ? PivotTableConverter.dataClass : PivotTableConverter.groupDataClass,
            rowSpan: 1,
            colSpan: 1,
            isHeader: false,
          };
        } else {
          matrix[i][j] = undefined;
        }
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
      additional += getHeaderChildCount(header, level, showSums, numberOfSums, false);
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
  numberOfSums = 1,
  includeChild = true
): number {
  if (pivotDataHeader.children) {
    return pivotDataHeader.children.reduce(
      (sum, header) => sum + getHeaderChildCount(header, level + 1, showSums, numberOfSums, includeChild),
      showSums[level + 1] ? numberOfSums : 0
    );
  }
  return includeChild ? 1 : 0;
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
