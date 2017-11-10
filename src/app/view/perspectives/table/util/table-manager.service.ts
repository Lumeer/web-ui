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

import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';

import {TableConfig, TablePart, TableRow} from '../model';
import {CollectionService, DocumentService, LinkInstanceService, LinkTypeService} from '../../../../core/rest';
import {Attribute, Collection, Document, LinkInstance, LinkType} from '../../../../core/dto';
import {AttributeHelper} from '../../../../shared/utils/attribute-helper';
import {SearchService} from '../../../../core/rest/search.service';

@Injectable()
export class TableManagerService {

  private parts: TablePart[] = [];

  public collections: Collection[] = [];
  public documents: Document[] = [];
  public linkTypes: LinkType[] = [];
  public linkInstances: LinkInstance[] = [];

  constructor(private collectionService: CollectionService,
              private documentService: DocumentService,
              private linkInstanceService: LinkInstanceService,
              private linkTypeService: LinkTypeService,
              private searchService: SearchService) {
  }

  public createTableFromConfig(config: TableConfig): Observable<TablePart[]> {
    const collectionCodes = config.parts.map(part => part.collectionCode);
    const linkTypeIds = config.parts.map(part => part.linkTypeId).filter(id => id);

    return Observable.combineLatest(
      this.searchService.searchCollections({}), // TODO get collections on link suggestions
      this.searchService.searchDocuments({collectionCodes: collectionCodes}),
      this.linkTypeService.getLinkTypesByCollections(...collectionCodes),
      this.linkInstanceService.getLinkInstancesByTypes(...linkTypeIds)
    ).map(([collections, documents, linkTypes, linkInstances]) => {
      this.collections = collections;
      this.documents = documents;
      this.linkTypes = linkTypes;
      this.linkInstances = linkInstances;

      return this.createTablePartsFromConfig(config);
    });
  }

  private createTablePartsFromConfig(config: TableConfig): TablePart[] {
    this.parts = config.parts.map((configPart, index) => {
      const tablePart = new TablePart();
      tablePart.index = index;
      tablePart.collection = this.getCollectionByCode(configPart.collectionCode);

      tablePart.expandedDocuments = configPart.expandedDocumentIds ? this.getDocumentsByCollection(configPart.collectionCode)
        .filter(doc => configPart.expandedDocumentIds.includes(doc.id)) : [];

      tablePart.linkType = this.getLinkTypeById(configPart.linkTypeId);
      tablePart.linkedCollection = tablePart.linkType ? this.getCollectionByCode(tablePart.linkType.collectionCodes.find(code => code !== configPart.collectionCode)) : null;

      tablePart.sorting = index === 0 ? {
        attributeId: configPart.sortedBy,
        descending: configPart.sortedDesc
      } : null;

      this.setUpAttributes(tablePart, config);

      return tablePart;
    });

    this.createBody();

    this.linkNextParts(); // TODO move up
    this.initEmptyTable();

    return this.parts;
  }

  private setUpAttributes(tablePart: TablePart, config: TableConfig) {
    const configPart = config.parts[tablePart.index];
    const leafAttributes = this.leafAttributes(configPart.collectionCode);

    const attributeIds = configPart.attributeIds.filter(id => id);
    if (configPart.attributeIds.length > 0) {
      tablePart.shownAttributes = attributeIds.map(attrId => leafAttributes.find(attr => attr.fullName === attrId));
      tablePart.hiddenAttributes = leafAttributes.filter(attr => !attributeIds.includes(attr.fullName));
    } else {
      tablePart.shownAttributes = leafAttributes;
    }
  }

  private linkNextParts() {
    for (let i = 1; i < this.parts.length; i++) {
      this.parts[i - 1].nextPart = this.parts[i];
    }
  }

  private initEmptyTable() {
    this.initFirstColumn();
    this.initFirstRow();
  }

  private initFirstColumn() {
    if (this.parts[0].shownAttributes.length === 0) {
      const attribute: Attribute = {
        fullName: null,
        name: AttributeHelper.generateAttributeName([]),
        constraints: [],
        usageCount: 0
      };

      this.parts[0].shownAttributes.push(attribute);
    }
  }

  private initFirstRow() {
    if (this.parts[0].rows.length === 0) {
      const row = new TableRow();
      row.part = this.parts[0];
      row.rowOffset = 0;
      row.part.rows.push(row);
    }
  }

  private createRow(linkedRow: TableRow, rowBelow: TableRow, partIndex: number, rowIndex: number, docs: Document[]): TableRow {
    const row = new TableRow();
    row.part = this.parts[partIndex];
    row.documents = docs;
    row.previousLinkedRow = linkedRow;
    row.rowOffset = rowIndex;

    const expanded = this.parts[partIndex].expandedDocuments.includes(row.documents[0]);
    row.nextLinkedRows = this.getNextLinkedRows(row, expanded, rowBelow ? rowBelow.nextLinkedRows[0] : null);

    this.insertNewRow(row, rowBelow);
    return row;
  }

  private insertNewRow(row: TableRow, rowBelow: TableRow) {
    if (rowBelow) {
      const index = row.part.rows.indexOf(rowBelow);
      return row.part.rows.splice(index, 0, row);
    }

    row.part.rows.push(row);
  }

  private getNextLinkedRows(row: TableRow, expanded: boolean, rowBelow: TableRow): TableRow[] {
    const nextPartIndex = row.part.index + 1;
    if (this.parts.length === nextPartIndex) {
      return [];
    }

    const linkTypeId = this.parts[nextPartIndex].linkType.id;
    const linkedDocuments = [].concat.apply([], row.documents.map(doc => this.getLinkedDocuments(doc, linkTypeId)));

    if (row.documents.length === 1 && expanded) {
      return linkedDocuments.map((doc, index) => this.createRow(row, rowBelow, nextPartIndex, index, [doc]));
    }

    return [this.createRow(row, rowBelow, nextPartIndex, 0, linkedDocuments)];
  }

  private getLinkedDocuments(doc: Document, linkTypeId: string): Document[] {
    const linkedDocumentIds = this.getLinkInstancesByType(linkTypeId)
      .filter(linkInstance => linkInstance.documentIds.includes(doc.id))
      .map(linkInstance => linkInstance.documentIds.find(id => id != doc.id));
    const linkedCollectionCode = this.getLinkTypeById(linkTypeId).collectionCodes
      .find(code => code != doc.collectionCode);
    return this.getDocumentsByCollection(linkedCollectionCode)
      .filter(d => linkedDocumentIds.includes(d.id));
  }

  public addTablePart(linkType: LinkType, collection: Collection, ...shownAttributes: Attribute[]) {
    this.destroyBody();
    this.removeUninitializedColumns();

    const part = new TablePart();
    part.index = this.parts.length;
    part.collection = collection;
    part.shownAttributes = shownAttributes;
    part.hiddenAttributes = part.collection.attributes.filter(attr => !attr.intermediate && !shownAttributes.includes(attr));

    part.linkType = linkType;
    part.linkedCollection = this.parts[this.parts.length - 1].collection;

    this.parts[this.parts.length - 1].nextPart = part;
    this.parts.push(part);

    Observable.combineLatest(
      this.searchService.searchDocuments({collectionCodes: [part.collection.code]}),
      this.linkInstanceService.getLinkInstancesByTypes(linkType.id)
    ).subscribe(([documents, linkInstances]) => {
      this.documents.push(...documents);
      this.linkInstances.push(...linkInstances);
      this.createBody();
    });
  }

  public removeTablePart(part: TablePart) {
    this.documents = this.documents.filter(doc => doc.collectionCode !== part.collection.code);
    this.linkInstances = this.linkInstances.filter(linkInstance => linkInstance.linkTypeId !== part.linkType.id);

    this.parts[part.index - 1].rows.forEach(row => row.nextLinkedRows = []);

    this.parts.splice(part.index);
    this.parts[this.parts.length - 1].nextPart = null;
  }

  private removeUninitializedColumns() {
    this.parts.forEach(part => part.shownAttributes.filter(attr => !attr.fullName)
      .forEach(attr => this.removeColumn(part, attr))
    );
  }

  private createBody() {
    const primaryDocuments = this.getDocumentsByCollection(this.parts[0].collection.code);
    this.sortDocuments(primaryDocuments);

    primaryDocuments.forEach((doc, index) => this.createRow(null, null, 0, index, [doc]));
  }

  private destroyBody() {
    // TODO go more into the depth
    this.parts.forEach(part => {
      part.rows.length = 0;
    });
  }

  private sortDocuments(primaryDocuments: Document[]) {
    const attributeId = this.parts[0].sorting.attributeId;
    const descending = this.parts[0].sorting.descending;

    if (!attributeId) {
      return;
    }

    primaryDocuments.sort((first, second) => TableManagerService.compareDocuments(first, second, attributeId, descending));
  }

  public sortRows(attributeId: string, descending: boolean) {
    this.parts[0].sorting.attributeId = attributeId;
    this.parts[0].sorting.descending = descending;

    this.parts[0].rows.sort((first, second) => TableManagerService.compareDocuments(first.documents[0], second.documents[0], attributeId, descending));
  }

  private static compareDocuments(first: Document, second: Document, attributeId: string, descending: boolean): number {
    // TODO use better comparison function (e.g. localeCompare)
    if (first.data[attributeId] < second.data[attributeId]) {
      return descending ? 1 : -1;
    }
    if (first.data[attributeId] > second.data[attributeId]) {
      return descending ? -1 : 1;
    }
    return 0;
  }

  private leafAttributes(collectionCode: string): Attribute[] {
    return this.getCollectionByCode(collectionCode).attributes.filter(attr => !attr.intermediate);
  }

  private getCollectionByCode(code: string): Collection {
    return this.collections.find(collection => collection.code === code);
  }

  private getDocumentsByCollection(collectionCode: string): Document[] {
    return this.documents.filter(doc => doc.collectionCode === collectionCode);
  }

  private getLinkTypeById(linkTypeId: string): LinkType {
    return this.linkTypes.find(linkType => linkType.id === linkTypeId);
  }

  private getLinkInstancesByType(linkTypeId: string): LinkInstance[] {
    return this.linkInstances.filter(linkInstance => linkInstance.linkTypeId === linkTypeId);
  }

  public collapseRow(row: TableRow) {
    const rowBelow = this.removeRows(row.nextLinkedRows);
    row.nextLinkedRows = this.getNextLinkedRows(row, false, rowBelow);
  }

  public expandRow(row: TableRow) {
    const rowBelow = this.removeRows(row.nextLinkedRows);
    row.nextLinkedRows = this.getNextLinkedRows(row, true, rowBelow);
  }

  public removeRow(row: TableRow) {
    if (row.previousLinkedRow && row.previousLinkedRow.nextLinkedRows.length === 1) {
      this.removeLastRow(row);
      return;
    }

    if (row.previousLinkedRow) {
      const linkedRows = row.previousLinkedRow.nextLinkedRows;
      const index = linkedRows.indexOf(row);
      linkedRows.splice(index, 1);

      linkedRows.forEach((row, i) => {
        if (i >= index) {
          row.rowOffset--;
        }
      });
    }

    const rows = row.part.rows;
    rows.splice(rows.indexOf(row), 1);
  }

  private removeLastRow(row: TableRow) {
    const emptyRow = new TableRow();
    emptyRow.part = row.part;
    emptyRow.rowOffset = 0;
    emptyRow.documents = [this.emptyDocument(row.part.collection.code)];
    emptyRow.previousLinkedRow = row.previousLinkedRow;

    const rows = row.part.rows;
    rows.splice(rows.indexOf(row), 1, emptyRow);

    if (row.previousLinkedRow) {
      const linkedRows = row.previousLinkedRow.nextLinkedRows;
      const index = linkedRows.indexOf(row);
      linkedRows.splice(index, 1, emptyRow);
    }
  }

  private emptyDocument(collectionCode: string) {
    const emptyDocument = new Document();
    emptyDocument.collectionCode = collectionCode;
    emptyDocument.data = {};
    return emptyDocument;
  }

  public removeDocumentFromRows(part: TablePart, doc: Document) {
    part.rows.forEach((row) => {
      const index = row.documents.indexOf(doc);
      if (index >= 0) {
        if (row.documents.length > 1) {
          row.documents.splice(index, 1);
        } else {
          row.documents.splice(index, 1, this.emptyDocument(doc.collectionCode));
        }
      }
    });
    // TODO remove empty rows when multiple linked
  }

  private removeRows(rows: TableRow[]): TableRow {
    if (!rows || rows.length === 0) {
      return null;
    }

    const rowBelow = rows[rows.length - 1].rowBelow;

    rows.forEach(row => this.removeRows(row.nextLinkedRows));

    const index = rows[0].part.rows.indexOf(rows[0]);
    rows[0].part.rows.splice(index, rows.length);

    return rowBelow;
  }

  public extractTableConfig(): TableConfig {
    const configParts = this.parts.map(part => {
      return {
        collectionCode: part.collection.code,
        attributeIds: part.shownAttributes.map(attr => attr.fullName).filter(id => id),
        sortedBy: part.sorting ? part.sorting.attributeId : null,
        sortedDesc: part.sorting ? part.sorting.descending : null,
        linkTypeId: part.linkType ? part.linkType.id : null,
        linkAttributeIds: [],
        expandedDocumentIds: part.rows.filter(row => row.nextLinkedRows.length > 1).map(row => row.documents[0].id)
      };
    });

    return {
      parts: configParts
    };
  }

  public addColumn(part: TablePart, previousAttribute: Attribute) {
    const index = part.shownAttributes.indexOf(previousAttribute) + 1;
    const allAttributes = [].concat(part.shownAttributes).concat(part.hiddenAttributes);

    const attribute: Attribute = {
      fullName: null,
      name: AttributeHelper.generateAttributeName(allAttributes),
      constraints: [],
      usageCount: 0
    };

    part.shownAttributes.splice(index, 0, attribute);
  }

  public addSubColumn(part: TablePart, parentAttribute: Attribute) {
    const attributes = part.shownAttributes;

    const attribute: Attribute = {
      fullName: parentAttribute.fullName + '.',
      name: parent.name,
      constraints: [],
      usageCount: 0
    };

    if (!parentAttribute.intermediate) {
      const index = attributes.indexOf(parentAttribute);
      attributes.splice(index, 1, attribute);

      parentAttribute.intermediate = true;
      return;
    }

    const index = attributes.length - attributes.reverse().findIndex(attr => attr.fullName.startsWith(parentAttribute.fullName));
    attributes.splice(index, 0, attribute);
  }

  public hideColumn(part: TablePart, attribute: Attribute) {
    if (attribute.intermediate) {
      this.filterLeafChildrenAttributes(part.shownAttributes, attribute)
        .forEach(attr => this.hideColumn(part, attr));
      return;
    }

    const index = part.shownAttributes.indexOf(attribute);
    part.shownAttributes.splice(index, 1);

    part.hiddenAttributes.unshift(attribute);
  }

  private filterLeafChildrenAttributes(all: Attribute[], parent: Attribute): Attribute[] {
    return all.filter(attr => !attr.intermediate)
      .filter(attr => attr.fullName.startsWith(parent.fullName));
  }

  public removeColumn(part: TablePart, attribute: Attribute) {
    AttributeHelper.removeAttributeFromArray(attribute, part.shownAttributes);

    if (attribute.fullName) {
      AttributeHelper.removeAttributeFromArray(attribute, part.collection.attributes);
    }
  }

  public addRow(rowAbove: TableRow): TableRow {
    const row = new TableRow();
    row.part = rowAbove.part;
    row.rowOffset = rowAbove.rowOffset + 1;

    const index = row.part.rows.indexOf(rowAbove) + 1;
    row.part.rows.splice(index, 0, row);

    if (rowAbove.previousLinkedRow) {
      row.previousLinkedRow = rowAbove.previousLinkedRow;

      const linkedRows = row.previousLinkedRow.nextLinkedRows;
      const linkedIndex = linkedRows.indexOf(rowAbove);
      linkedRows.splice(linkedIndex + 1, 0, row);

      linkedRows.forEach((row, i) => {
        if (i > index) {
          row.rowOffset++;
        }
      });
    }

    return row;
  }

  public addLinkedRow(previousLinkedRow: TableRow): TableRow {
    const row = new TableRow();
    row.part = previousLinkedRow.part.nextPart;
    row.rowOffset = previousLinkedRow.nextLinkedRows.length;

    const index = this.getNewRowIndex(previousLinkedRow);
    row.part.rows.splice(index, 0, row);

    row.previousLinkedRow = previousLinkedRow;
    previousLinkedRow.nextLinkedRows.splice(row.rowOffset, 0, row);

    return row;
  }

  private getNewRowIndex(previousLinkedRow: TableRow) {
    if (previousLinkedRow.nextLinkedRows.length > 0) {
      const rowAbove = previousLinkedRow.nextLinkedRows[previousLinkedRow.nextLinkedRows.length - 1];
      return rowAbove.part.rows.indexOf(rowAbove) + 1;
    }

    if (previousLinkedRow.rowAbove && previousLinkedRow.rowAbove.nextLinkedRows.length > 0) {
      const rowAbove = previousLinkedRow.rowAbove.nextLinkedRows[previousLinkedRow.rowAbove.nextLinkedRows.length - 1];
      return rowAbove.part.rows.indexOf(rowAbove) + 1;
    }

    return 0;
  }

  public moveColumn(part: TablePart, previousIndex: number, nextIndex: number) {
    const attribute: Attribute = part.shownAttributes.splice(previousIndex, 1)[0];
    part.shownAttributes.splice(nextIndex, 0, attribute);
  }

}
