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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {CollectionModel} from '../../../../../core/store/collections/collection.model';
import {LinkRowModel} from '../link-row.model';
import {DocumentModel} from '../../../../../core/store/documents/document.model';

@Component({
  selector: '[links-list-table-body]',
  templateUrl: './links-list-table-body.component.html',
  styleUrls: ['links-list-table-body.component.scss', './../links-list-table.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LinksListTableBodyComponent {

  @Input()
  public collection: CollectionModel;

  @Input()
  public linkRows: LinkRowModel[];

  @Output() public select = new EventEmitter<{ collection: CollectionModel, document: DocumentModel }>();

  @Output() public unlink = new EventEmitter<string>();

  public documentSelected(collection: CollectionModel, linkRow: LinkRowModel) {
    const document = linkRow.document;
    this.select.emit({collection, document});
  }

  public unlinkDocument(linkRow: LinkRowModel) {
    this.unlink.emit(linkRow.linkInstance.id);
  }

  public trackByDocument(index: number, linkRow: LinkRowModel): string {
    return linkRow.document.correlationId || linkRow.document.id;
  }

}
