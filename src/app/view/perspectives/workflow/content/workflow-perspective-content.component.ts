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

import {Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges} from '@angular/core';
import {Query} from '../../../../core/store/navigation/query/query';
import {Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {TableColumn} from '../../../../shared/table/model/table-column';
import {
  findAttribute,
  getDefaultAttributeId,
  isCollectionAttributeEditable,
} from '../../../../core/store/collections/collection.util';
import {createAttributesSettingsOrder} from '../../../../shared/settings/settings.util';
import {ViewSettings} from '../../../../core/store/views/view';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {TableRow} from '../../../../shared/table/model/table-row';
import {BehaviorSubject} from 'rxjs';

@Component({
  selector: 'workflow-perspective-content',
  templateUrl: './workflow-perspective-content.component.html',
  styleUrls: ['./workflow-perspective-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowPerspectiveContentComponent implements OnChanges {
  @Input()
  public viewSettings: ViewSettings;

  @Input()
  public query: Query;

  @Input()
  public permissions: AllowedPermissions;

  @Input()
  public collections: Collection[];

  @Input()
  public documents: DocumentModel[];

  public columns$ = new BehaviorSubject<TableColumn[]>([]);
  public rows: TableRow[];

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.documents) {
      this.rows = this.createRows();
    }
    if (changes.collections || changes.query || changes.permissions || changes.viewSettings) {
      this.columns$.next(this.createColumns());
    }
  }

  private createRows(): TableRow[] {
    const collection = this.collections?.[0];
    if (!collection) {
      return [];
    }

    return this.documents
      .filter(document => document.collectionId === collection.id)
      .map(document => ({documentData: document.data, documentId: document.id}));
  }

  private createColumns(): TableColumn[] {
    const linkTypeColumns = this.createLinkTypeColumns();
    const collectionColumns = this.createCollectionColumns();

    return [...linkTypeColumns, ...collectionColumns];
  }

  private createLinkTypeColumns(): TableColumn[] {
    return [];
  }

  private createCollectionColumns(): TableColumn[] {
    const collection = this.collections?.[0];
    if (!collection) {
      return [];
    }
    const defaultAttributeId = getDefaultAttributeId(collection);
    const settings = this.viewSettings?.attributes?.collections?.[collection.id];
    return createAttributesSettingsOrder(collection.attributes, settings).reduce((columns, setting) => {
      const attribute = findAttribute(collection.attributes, setting.attributeId);
      const editable = isCollectionAttributeEditable(attribute.id, collection, this.permissions, this.query);
      const column: TableColumn = (this.columns$.value || []).find(
        c => c.collectionId === collection.id && c.attribute.id === attribute.id
      ) || {
        attribute,
        width: 100,
        collectionId: collection.id,
        color: collection.color,
        bold: attribute.id === defaultAttributeId,
        hidden: setting.hidden,
        editable,
      };
      columns.push({...column, attribute, editable});
      return columns;
    }, []);
  }

  public onColumnsChange(columns: TableColumn[]) {
    this.columns$.next(columns);
  }
}
