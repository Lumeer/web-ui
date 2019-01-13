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

import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {ContextMenuComponent, ContextMenuService} from 'ngx-contextmenu';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {AppState} from '../../../../../../core/store/app.state';
import {Attribute, Collection} from '../../../../../../core/store/collections/collection';
import {selectCollectionById} from '../../../../../../core/store/collections/collections.state';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {selectLinkTypeById} from '../../../../../../core/store/link-types/link-types.state';
import {TableHeaderCursor} from '../../../../../../core/store/tables/table-cursor';
import {TableHiddenColumn, TableModel, TablePart} from '../../../../../../core/store/tables/table.model';
import {TablesAction} from '../../../../../../core/store/tables/tables.action';

@Component({
  selector: 'table-hidden-column',
  templateUrl: './table-hidden-column.component.html',
  styleUrls: ['./table-hidden-column.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableHiddenColumnComponent implements OnChanges {
  @Input()
  public table: TableModel;

  @Input()
  public cursor: TableHeaderCursor;

  @Input()
  public column: TableHiddenColumn;

  @ViewChild(ContextMenuComponent)
  public contextMenuComponent: ContextMenuComponent;

  public collection$: Observable<Collection>;
  public linkType$: Observable<LinkType>;
  public hiddenAttributes$: Observable<Attribute[]>;

  public constructor(private contextMenuService: ContextMenuService, private store: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges) {
    const part = this.table.parts[this.cursor.partIndex];
    if (part) {
      this.collection$ = this.store.select(selectCollectionById(part.collectionId));
      this.linkType$ = this.store.select(selectLinkTypeById(part.linkTypeId));
      this.hiddenAttributes$ = this.getHiddenAttributes(part);
    }
  }

  public getHiddenAttributes(part: TablePart): Observable<Attribute[]> {
    return this.getAttributes(part).pipe(
      map(attributes => attributes.filter(attribute => this.column.attributeIds.includes(attribute.id)))
    );
  }

  public getAttributes(part: TablePart): Observable<Attribute[]> {
    if (part.collectionId) {
      return this.collection$.pipe(map(collection => collection.attributes));
    }
    if (part.linkTypeId) {
      return this.linkType$.pipe(map(linkType => linkType.attributes));
    }
  }

  public onClick(event: MouseEvent) {
    this.showContextMenu(event);
    event.stopPropagation();
  }

  public onMouseDown(event: MouseEvent) {
    this.store.dispatch(new TablesAction.SetCursor({cursor: null}));
    event.stopPropagation();
  }

  private showContextMenu(event: MouseEvent) {
    this.contextMenuService.show.next({
      anchorElement: null,
      contextMenu: this.contextMenuComponent,
      event,
      item: null,
    });
  }

  public onShowSingleColumn(attribute: Attribute) {
    this.showColumns(attribute.id);
  }

  public onShowAllColumns() {
    this.showColumns(...this.column.attributeIds);
  }

  private showColumns(...attributeIds: string[]) {
    this.store.dispatch(
      new TablesAction.ShowColumns({
        cursor: this.cursor,
        attributeIds,
      })
    );
  }
}
