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

import {Attribute, Collection} from '../../collections/collection';
import {DocumentModel} from '../../documents/document.model';
import {LinkType} from '../../link-types/link.type';
import {TableColumnType, TableConfig, TableConfigColumn, TableConfigPart, TableConfigRow} from '../table.model';
import {filterTableColumnsByAttributes} from '../table.utils';

export function isTableConfigChanged(
  viewConfig: TableConfig,
  perspectiveConfig: TableConfig,
  documentsMap: Record<string, DocumentModel>,
  collectionsMap: Record<string, Collection>,
  linkTypesMap: Record<string, LinkType>
): boolean {
  if (areTableConfigPartsChanged(viewConfig.parts, perspectiveConfig.parts, collectionsMap, linkTypesMap)) {
    return true;
  }

  return areTableConfigRowsChanged(viewConfig.rows, perspectiveConfig.rows, documentsMap);
}

export function areTableConfigPartsChanged(
  savedParts: TableConfigPart[],
  shownParts: TableConfigPart[],
  collectionsMap: Record<string, Collection>,
  linkTypesMap: Record<string, LinkType>
): boolean {
  if (!savedParts || !shownParts || savedParts.length !== shownParts.length) {
    return true;
  }

  return savedParts.some((savedPart, index) => {
    const collection = collectionsMap[savedPart.collectionId];
    const linkType = linkTypesMap[savedPart.linkTypeId];
    const attributes = (collection && collection.attributes) || (linkType && linkType.attributes) || [];

    return isTablePartChanged(savedPart, shownParts[index], attributes);
  });
}

function isTablePartChanged(savedPart: TableConfigPart, shownPart: TableConfigPart, attributes: Attribute[]): boolean {
  const filteredSavedColumns = filterTableColumnsByAttributes(savedPart.columns, attributes).filter(
    column => (column.attributeIds || []).length > 0
  );
  const filteredShownColumns = filterTableColumnsByAttributes(shownPart.columns, attributes).filter(
    column => (column.attributeIds || []).length > 0
  );

  return (
    savedPart.collectionId !== shownPart.collectionId ||
    savedPart.linkTypeId !== shownPart.linkTypeId ||
    areTableColumnsChanged(filteredSavedColumns, filteredShownColumns)
  );
}

function areTableColumnsChanged(savedColumns: TableConfigColumn[], shownColumns: TableConfigColumn[]): boolean {
  if (savedColumns.length !== shownColumns.length && savedColumns.length !== shownColumns.length - 1) {
    return true;
  }

  if (savedColumns.some((savedColumn, index) => isTableColumnChanged(savedColumn, shownColumns[index]))) {
    return true;
  }

  const additionalColumn = shownColumns[savedColumns.length];
  return Boolean(additionalColumn && additionalColumn.type !== TableColumnType.HIDDEN);
}

function isTableColumnChanged(savedColumn: TableConfigColumn, shownColumn: TableConfigColumn): boolean {
  if (!savedColumn || !shownColumn || savedColumn.type !== shownColumn.type) {
    return true;
  }

  if (savedColumn.type === TableColumnType.COMPOUND) {
    return isTableCompoundColumnChanged(savedColumn, shownColumn);
  }

  if (savedColumn.type === TableColumnType.HIDDEN) {
    return isTableHiddenColumnChanged(savedColumn, shownColumn);
  }

  return true;
}

function isTableCompoundColumnChanged(savedColumn: TableConfigColumn, shownColumn: TableConfigColumn): boolean {
  return (
    savedColumn.attributeIds[0] !== shownColumn.attributeIds[0] ||
    savedColumn.width !== shownColumn.width ||
    areTableColumnsChanged(savedColumn.children, shownColumn.children)
  );
}

function isTableHiddenColumnChanged(savedColumn: TableConfigColumn, shownColumn: TableConfigColumn): boolean {
  return false; // it does not matter if there is a difference in hidden attributes since it is not a visual change
}

export function areTableConfigRowsChanged(
  savedRows: TableConfigRow[],
  shownRows: TableConfigRow[],
  documentsMap: Record<string, DocumentModel>
): boolean {
  const validSavedRows = filterValidSavedRows(savedRows, documentsMap);
  return !areAllSavedRowsPresent(validSavedRows, shownRows);
}

export function filterValidSavedRows(
  rows: TableConfigRow[],
  documentsMap: Record<string, DocumentModel>
): TableConfigRow[] {
  return (
    rows &&
    rows.filter((row, index) => {
      // filter out rows with deleted documents and last empty row
      return !(row.documentId && !documentsMap[row.documentId]) && !(!row.documentId && index === rows.length - 1);
    })
  );
}

export function areAllSavedRowsPresent(savedRows: TableConfigRow[], shownRows: TableConfigRow[]): boolean {
  let showIndex = -1;
  return savedRows.reduce((present, savedRow) => {
    showIndex = shownRows.findIndex(
      (row, index) =>
        row.documentId === savedRow.documentId && row.linkInstanceId === savedRow.linkInstanceId && index > showIndex
    );

    const shownRow = shownRows[showIndex];
    if (!shownRow) {
      return present;
    }

    return (
      present &&
      savedRow.documentId === shownRow.documentId &&
      savedRow.linkInstanceId === shownRow.linkInstanceId &&
      savedRow.parentDocumentId === shownRow.parentDocumentId &&
      (savedRow.linkedRows.length < 2 || Boolean(savedRow.expanded) === Boolean(shownRow.expanded)) &&
      areAllSavedRowsPresent(savedRow.linkedRows, shownRow.linkedRows)
    );
  }, true);
}
