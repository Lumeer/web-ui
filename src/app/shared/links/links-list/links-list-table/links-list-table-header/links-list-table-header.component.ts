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

import {ChangeDetectionStrategy, Component, ElementRef, Input, QueryList, ViewChildren} from '@angular/core';
import {AttributeModel, CollectionModel} from '../../../../../core/store/collections/collection.model';
import {DocumentHintColumn} from '../../../../document-hints/document-hint-column';

@Component({
  selector: '[links-list-table-header]',
  templateUrl: './links-list-table-header.component.html',
  styleUrls: ['./links-list-table-header.component.scss', './../links-list-table.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinksListTableHeaderComponent {
  @ViewChildren('headerCell')
  public cells: QueryList<ElementRef>;

  @Input()
  public collection: CollectionModel;

  public trackByAttribute(index: number, attribute: AttributeModel): string {
    return attribute.correlationId || attribute.id;
  }

  public getColumns(): DocumentHintColumn[] {
    return this.cells
      .toArray()
      .map(cell => ({attributeId: cell.nativeElement.id, width: cell.nativeElement.clientWidth}));
  }
}
