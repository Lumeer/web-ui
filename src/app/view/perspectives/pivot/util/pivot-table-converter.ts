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
import {
  PivotColumnAttribute,
  PivotConfig,
  PivotRowAttribute,
  PivotRowColumnAttribute,
  PivotValueType,
} from '../../../../core/store/pivots/pivot';
import {isNotNullOrUndefined, isNullOrUndefined, isNumeric, toNumber} from '../../../../shared/utils/common.utils';
import {pivotStemConfigHasAdditionalValueLevel} from './pivot-util';
import {uniqueValues} from '../../../../shared/utils/array.utils';
import {aggregateDataValues, DataAggregationType} from '../../../../shared/utils/data/data-aggregation';
import {COLOR_GRAY100, COLOR_GRAY200, COLOR_GRAY300, COLOR_GRAY400, COLOR_GRAY500} from '../../../../core/constants';
import {shadeColor} from '../../../../shared/utils/html-modifier';
import Big from 'big.js';
import {formatDataValue} from '../../../../shared/utils/data.utils';

interface HeaderGroupInfo {
  background: string;
  indexes: number[];
  level: number;
}

interface ValueTypeInfo {
  sum?: number;
  sumsRows?: number[];
  sumsColumns?: number[];
}

export class PivotTableConverter {
  public static readonly emptyClass = 'pivot-empty-cell';
  public static readonly dataClass = 'pivot-data-cell';
  public static readonly groupDataClass = 'pivot-group-data-cell';
  public static readonly rowHeaderClass = 'pivot-row-header-cell';
  public static readonly columnHeaderClass = 'pivot-column-header-cell';
  public static readonly groupHeaderClass = 'pivot-group-header-cell';

  private readonly groupColors = [COLOR_GRAY100, COLOR_GRAY200, COLOR_GRAY300, COLOR_GRAY400, COLOR_GRAY500];

  private config: PivotConfig;
  private data: PivotData;
  private rowLevels: number;
  private rowsTransformationArray: number[];
  private columnLevels: number;
  private columnsTransformationArray: number[];
  private valueTypeInfo: ValueTypeInfo[];

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
    this.data = preparePivotData(data, config);
    this.valueTypeInfo = getValuesTypeInfo(data.values, config);
    this.config = config;
    this.rowLevels = (config.rowAttributes || []).length;
    this.columnLevels =
      (config.columnAttributes || []).length + (pivotStemConfigHasAdditionalValueLevel(config) ? 1 : 0);
    const hasValue = (config.valueAttributes || []).length > 0;
    const numberOfSums = Math.max(1, (this.data.valueTitles || []).length);
    if ((this.data.rowHeaders || []).length > 0) {
      this.rowsTransformationArray = createTransformationMap(
        this.data.rowHeaders,
        this.rowShowSums,
        this.columnLevels,
        1
      );
    } else {
      this.rowsTransformationArray = hasValue ? [this.columnLevels] : [];
    }

    if ((this.data.columnHeaders || []).length > 0) {
      this.columnsTransformationArray = createTransformationMap(
        this.data.columnHeaders,
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

      const rowIndexes = getTargetIndexesForHeaders(headers);
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
          const formattedValue = this.formatValueByValueType(value, [row], [column]);
          const stringValue = isNotNullOrUndefined(formattedValue) ? String(formattedValue) : '';
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

  private formatValueByValueType(value: any, rows: number[], columns: number[]): any {
    const valueIndex = columns[0] % this.config.valueAttributes.length;
    const valueAttribute = this.config.valueAttributes[valueIndex];
    const valueTypeInfo = this.valueTypeInfo[valueIndex];
    if (!valueTypeInfo || !valueAttribute.valueType || valueAttribute.valueType === PivotValueType.Default) {
      return this.formatValueByConstraint(value, valueIndex);
    }

    if (valueAttribute.valueType === PivotValueType.AllPercentage) {
      return this.formatValueByConstraint(this.divideValues(value, valueTypeInfo.sum), valueIndex);
    } else if (valueAttribute.valueType === PivotValueType.ColumnPercentage) {
      const columnsDividers = columns.reduce((dividers, column) => {
        dividers.push(valueTypeInfo.sumsColumns[column]);
        return dividers;
      }, []);
      const columnsDivider = aggregateDataValues(DataAggregationType.Sum, columnsDividers);
      return this.formatValueByConstraint(this.divideValues(value, columnsDivider), valueIndex);
    } else if (valueAttribute.valueType === PivotValueType.RowPercentage) {
      const rowsDividers = rows.reduce((dividers, row) => {
        dividers.push(valueTypeInfo.sumsRows[row]);
        return dividers;
      }, []);
      const rowsDivider = aggregateDataValues(DataAggregationType.Sum, rowsDividers);
      return this.formatValueByConstraint(this.divideValues(value, rowsDivider), valueIndex);
    }

    return this.formatValueByConstraint(value, valueIndex);
  }

  private formatValueByConstraint(value: any, valueIndex: number): any {
    const constraint = this.data.valuesConstraints && this.data.valuesConstraints[valueIndex];
    if (constraint) {
      return formatDataValue(value, constraint, this.data.constraintData);
    }
    return value;
  }

  private divideValues(value: any, divider: any): string {
    if (isNullOrUndefined(value)) {
      return null;
    }

    if (isNumeric(value) && isNumeric(divider)) {
      if (divider !== 0) {
        return `${(value / divider) * 100}%`;
      } else {
        return '0%';
      }
    }

    return '';
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
        const formattedValue = this.formatValueByValueType(aggregatedValue, rows, [column]);
        cells[rowIndexInCells][columnIndexInCells] = {
          value: String(formattedValue),
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

          const columnsIndexes = getTargetIndexesForHeaders(headers);
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
        const formattedValue = this.formatValueByValueType(aggregatedValue, [row], columns);
        cells[rowIndexInCells][columnIndexInCells] = {
          value: String(formattedValue),
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
          const formattedValue = this.formatValueByValueType(value, [row], [column]);
          const stringValue = isNotNullOrUndefined(formattedValue) ? String(formattedValue) : '';
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
            const {rowsIndexes, columnsIndexes} = this.getValuesIndexesFromCellsIndexes(
              rowGroupInfo.indexes,
              columnGroupsInfo[j].indexes
            );
            const values = this.getValuesForRowsAndCols(rowsIndexes, columnsIndexes);
            const aggregatedValue = aggregateDataValues(DataAggregationType.Sum, values);
            const formattedValue = this.formatValueByValueType(aggregatedValue, rowsIndexes, columnsIndexes);
            cells[i][j] = {
              value: String(formattedValue),
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

  private getValuesIndexesFromCellsIndexes(
    rows: number[],
    columns: number[]
  ): {rowsIndexes: number[]; columnsIndexes: number[]} {
    const rowsIndexes = rows
      .map(row => this.rowsTransformationArray.findIndex(tRow => tRow === row))
      .filter(index => index >= 0);
    const columnsIndexes = columns
      .map(column => this.columnsTransformationArray.findIndex(tColumn => tColumn === column))
      .filter(index => index >= 0);
    return {rowsIndexes, columnsIndexes};
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

  private formatCellsValues(cells: PivotTableCell[][]) {
    const rowsCount = cells.length;
    const columnsCount = (cells[0] && cells[0].length) || 0;
    for (let j = this.rowLevels; j < columnsCount; j++) {
      let columnContainsPercentage = false;
      for (let i = this.columnLevels; i < rowsCount; i++) {
        if (cells[i][j] && isValueDecimal(cells[i][j].value)) {
          columnContainsPercentage = true;
          break;
        }
      }

      if (columnContainsPercentage) {
        for (let i = this.columnLevels; i < rowsCount; i++) {
          cells[i][j] && (cells[i][j].value = formatDecimalValue(cells[i][j].value));
        }
      }
    }
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

function preparePivotData(data: PivotData, config: PivotConfig): PivotData {
  return sortPivotData(data, config);
}

function getValuesTypeInfo(values: any[][], config: PivotConfig): ValueTypeInfo[] {
  const valueTypeInfo = [];
  const numValues = (config.valueAttributes || []).length;
  const rowsIndexes = [...Array(values.length).keys()];

  for (let i = 0; i < numValues; i++) {
    const valueAttribute = config.valueAttributes[i];
    if (!valueAttribute.valueType || valueAttribute.valueType === PivotValueType.Default) {
      continue;
    }

    const columnsCount = (values[0] && values[0].length) || 0;
    const columnIndexes = [...Array(columnsCount).keys()].filter(key => key % numValues === i);

    valueTypeInfo[i] = getValueTypeInfo(values, valueAttribute.valueType, rowsIndexes, columnIndexes);
  }

  return valueTypeInfo;
}

function getValueTypeInfo(values: any[][], type: PivotValueType, rows: number[], columns: number[]): ValueTypeInfo {
  if (type === PivotValueType.AllPercentage) {
    return {sum: getNumericValuesSummary(values, rows, columns)};
  } else if (type === PivotValueType.RowPercentage) {
    return {
      sumsRows: rows.reduce((arr, row) => {
        arr[row] = getNumericValuesSummary(values, [row], columns);
        return arr;
      }, []),
    };
  } else if (type === PivotValueType.ColumnPercentage) {
    return {
      sumsColumns: columns.reduce((arr, column) => {
        arr[column] = getNumericValuesSummary(values, rows, [column]);
        return arr;
      }, []),
    };
  }

  return {};
}

function isValueDecimal(value: string): boolean {
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

function formatDecimalValue(value: string): string {
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
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    if (header.children) {
      iterateThroughTransformationMap(header.children, additional, array, level + 1, showSums, numberOfSums);
      additional += getHeaderChildCount(header, level, showSums, numberOfSums);
    } else if (isNotNullOrUndefined(header.targetIndex)) {
      array[header.targetIndex] = i + additional;
    }
  }
}

function getTargetIndexesForHeaders(headers: PivotDataHeader[]): number[] {
  const allRows = (headers || []).reduce((rows, header) => {
    rows.push(...getTargetIndexesForHeader(header));
    return rows;
  }, []);
  return uniqueValues<number>(allRows);
}

function getTargetIndexesForHeader(pivotDataHeader: PivotDataHeader): number[] {
  if (pivotDataHeader.children) {
    return pivotDataHeader.children.reduce((rows, header) => {
      rows.push(...getTargetIndexesForHeader(header));
      return rows;
    }, []);
  }
  return [pivotDataHeader.targetIndex];
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

export function sortPivotData(data: PivotData, config: PivotConfig): PivotData {
  return {
    ...data,
    rowHeaders: sortPivotRowDataHeaders(data.rowHeaders, config.rowAttributes, data),
    columnHeaders: sortPivotColumnDataHeaders(data.columnHeaders, config.columnAttributes, data),
  };
}

function sortPivotRowDataHeaders(
  rowHeaders: PivotDataHeader[],
  rowAttributes: PivotRowAttribute[],
  pivotData: PivotData
): PivotDataHeader[] {
  return sortPivotDataHeadersRecursive(
    rowHeaders,
    0,
    rowAttributes,
    pivotData.columnHeaders,
    pivotData.values,
    pivotData.valueTitles || [],
    true
  );
}

function sortPivotColumnDataHeaders(
  columnHeaders: PivotDataHeader[],
  columnAttributes: PivotColumnAttribute[],
  pivotData: PivotData
): PivotDataHeader[] {
  return sortPivotDataHeadersRecursive(
    columnHeaders,
    0,
    columnAttributes,
    pivotData.rowHeaders,
    pivotData.values,
    pivotData.valueTitles || [],
    false
  );
}

function sortPivotDataHeadersRecursive(
  headers: PivotDataHeader[],
  index: number,
  pivotAttributes: PivotRowColumnAttribute[],
  otherSideHeaders: PivotDataHeader[],
  values: any[][],
  valueTitles: string[],
  isRows: boolean
): PivotDataHeader[] {
  const rowAttribute = pivotAttributes && pivotAttributes[index];
  if (!rowAttribute) {
    return headers;
  }

  const multiplier = !rowAttribute.sort || rowAttribute.sort.asc ? 1 : -1;
  const valuesMap = createHeadersValuesMap(headers, rowAttribute, otherSideHeaders, values, valueTitles, isRows);
  return headers
    .map(header => ({
      ...header,
      children:
        header.children &&
        sortPivotDataHeadersRecursive(
          header.children,
          index + 1,
          pivotAttributes,
          otherSideHeaders,
          values,
          valueTitles,
          isRows
        ),
    }))
    .sort((r1, r2) =>
      valuesMap[r1.title] > valuesMap[r2.title]
        ? multiplier
        : valuesMap[r1.title] < valuesMap[r2.title]
        ? -multiplier
        : 0
    );
}

function createHeadersValuesMap(
  headers: PivotDataHeader[],
  attribute: PivotRowColumnAttribute,
  otherSideHeaders: PivotDataHeader[],
  values: any[][],
  valueTitles: string[],
  isRows: boolean
): Record<string, any> {
  const sortTargetIndexes = sortValueTargetIndexes(attribute, otherSideHeaders, valueTitles);
  if (!sortTargetIndexes) {
    return (headers || []).reduce((valuesMap, header) => {
      valuesMap[header.title] = header.title;
      return valuesMap;
    }, {});
  }

  return (headers || []).reduce((valuesMap, header) => {
    const rows = isRows ? getTargetIndexesForHeader(header) : sortTargetIndexes;
    const columns = isRows ? sortTargetIndexes : getTargetIndexesForHeader(header);
    valuesMap[header.title] = getNumericValuesSummary(values, rows, columns);
    return valuesMap;
  }, {});
}

function getNumericValuesSummary(values: any[][], rows: number[], columns: number[]): number {
  let sum = 0;
  for (const row of rows) {
    for (const column of columns) {
      const value = values[row][column];
      if (isNotNullOrUndefined(value) && isNumeric(value)) {
        sum += toNumber(value);
      }
    }
  }
  return sum;
}

function sortValueTargetIndexes(
  pivotAttribute: PivotRowColumnAttribute,
  otherSideHeaders: PivotDataHeader[],
  valueTitles: string[]
): number[] | null {
  if (pivotAttribute.sort && pivotAttribute.sort.list) {
    let valueIndex = valueTitles.findIndex(title => title === pivotAttribute.sort.list.valueTitle);
    if (valueIndex === -1) {
      if (valueTitles.length === 1) {
        valueIndex = 0;
      } else {
        return null;
      }
    }

    let pivotHeader: PivotDataHeader = null;
    let currentOtherSideHeaders = otherSideHeaders;
    for (const value of pivotAttribute.sort.list.values || []) {
      if (value.isSummary) {
        const indexes = getTargetIndexesForHeaders(currentOtherSideHeaders || []) || [];
        return filterIndexesByMod(indexes, valueTitles.length, valueIndex);
      }

      pivotHeader = (currentOtherSideHeaders || []).find(header => header.title === value.title);
      if (!pivotHeader) {
        break;
      }

      currentOtherSideHeaders = pivotHeader.children || [];
    }

    if (pivotHeader) {
      const targetIndexes = isNotNullOrUndefined(pivotHeader.targetIndex)
        ? [pivotHeader.targetIndex]
        : getTargetIndexesForHeaders(currentOtherSideHeaders);
      return filterIndexesByMod(targetIndexes, valueTitles.length, valueIndex);
    }
  }

  return null;
}

function filterIndexesByMod(indexes: number[], mod: number, value: number): number[] {
  return (indexes || []).filter(index => index % mod === value);
}
