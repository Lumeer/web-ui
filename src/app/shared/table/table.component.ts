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
import {DocumentModel} from '../../core/store/documents/document.model';
import {Collection} from '../../core/store/collections/collection';
import {LinkType} from '../../core/store/link-types/link.type';
import {BehaviorSubject} from 'rxjs';
import {TableColumn} from './model/table-column';
import {
  findAttribute,
  getDefaultAttributeId,
  isCollectionAttributeEditable
} from '../../core/store/collections/collection.util';
import {createAttributesSettingsOrder} from '../settings/settings.util';
import {ViewSettings} from '../../core/store/views/view';
import {Query} from '../../core/store/navigation/query/query';
import {AllowedPermissions} from '../../core/model/allowed-permissions';

@Component({
  selector: 'lmr-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableComponent implements OnChanges {

  @Input()
  public documents: DocumentModel[];

  @Input()
  public collection: Collection;

  @Input()
  public linkType: LinkType;

  @Input()
  public viewSettings: ViewSettings;

  @Input()
  public query: Query;

  @Input()
  public permissions: AllowedPermissions;

  public columns$ = new BehaviorSubject<TableColumn[]>([]);

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.collection || changes.linkType || changes.viewSettings) {
      this.createColumns();
    }
  }

  private createColumns() {
    const linkTypeColumns = this.createLinkTypeColumns();
    const collectionColumns = this.createCollectionColumns();

    this.columns$.next([...linkTypeColumns, ...collectionColumns]);
  }

  private createLinkTypeColumns(): TableColumn[] {
    return [];
  }

  private createCollectionColumns(): TableColumn[] {
    const defaultAttributeId = getDefaultAttributeId(this.collection);
    const settings = this.viewSettings?.attributes?.collections?.[this.collection?.id];
    return createAttributesSettingsOrder(this.collection?.attributes, settings)
      .reduce((columns, setting) => {
        const attribute = findAttribute(this.collection?.attributes, setting.attributeId);
        const editable = isCollectionAttributeEditable(attribute.id, this.collection, this.permissions, this.query);
        const column: TableColumn = (this.columns$.value || []).find(
          c => c.collectionId === this.collection.id && c.attribute.id === attribute.id
        ) || {
          attribute,
          width: 100,
          collectionId: this.collection.id,
          color: this.collection.color,
          bold: attribute.id === defaultAttributeId,
          hidden: setting.hidden,
          editable,
        };
        columns.push({...column, attribute, editable});
        return columns;
      }, []);
  }

}
