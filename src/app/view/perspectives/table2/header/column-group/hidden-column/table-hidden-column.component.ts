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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {map} from 'rxjs/operators';
import {Subscription} from 'rxjs/Subscription';
import {AppState} from '../../../../../../core/store/app.state';
import {AttributeModel, CollectionModel} from '../../../../../../core/store/collections/collection.model';
import {selectCollectionById} from '../../../../../../core/store/collections/collections.state';
import {LinkTypeModel} from '../../../../../../core/store/link-types/link-type.model';
import {selectLinkTypeById} from '../../../../../../core/store/link-types/link-types.state';
import {areTableHeaderCursorsEqual, TableHeaderCursor} from '../../../../../../core/store/tables/table-cursor';
import {TableHiddenColumn, TableModel, TablePart} from '../../../../../../core/store/tables/table.model';
import {getTableColumnWidth} from '../../../../../../core/store/tables/table.utils';
import {TablesAction} from '../../../../../../core/store/tables/tables.action';
import {selectTableCursor} from '../../../../../../core/store/tables/tables.state';
import {HtmlModifier} from '../../../../../../shared/utils/html-modifier';
import {DEFAULT_COLOR} from '../single-column/table-single-column.component';

@Component({
  selector: 'table-hidden-column',
  templateUrl: './table-hidden-column.component.html',
  styleUrls: ['./table-hidden-column.component.scss']
})
export class TableHiddenColumnComponent implements OnInit, OnDestroy {

  @Input()
  public table: TableModel;

  @Input()
  public cursor: TableHeaderCursor;

  @Input()
  public column: TableHiddenColumn;

  public selected: boolean;

  private subscriptions = new Subscription();

  public constructor(private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.subscribeToSelection();
  }

  private subscribeToSelection() {
    this.subscriptions.add(
      this.store.select(selectTableCursor).subscribe(cursor => {
        this.selected = areTableHeaderCursorsEqual(cursor, this.cursor);
      })
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public backgroundColor(): Observable<string> {
    if (this.getPart().collectionId) {
      return this.getCollection().pipe(
        map(collection => HtmlModifier.shadeColor(collection.color, .5))
      );
    }

    return Observable.of(DEFAULT_COLOR);
  }

  public width(): string {
    const width = getTableColumnWidth(this.column);
    return `${width}px`;
  }

  public hiddenAttributes(): Observable<AttributeModel[]> {
    return this.getAttributes().pipe(
      map(attributes => attributes.filter(attribute => this.column.attributeIds.includes(attribute.id)))
    );
  }

  public getAttributes(): Observable<AttributeModel[]> {
    if (this.getPart().collectionId) {
      return this.getCollection().pipe(map(collection => collection.attributes));
    }
    if (this.getPart().linkTypeId) {
      return this.getLinkType().pipe(map(linkType => linkType.attributes));
    }
  }

  public getCollection(): Observable<CollectionModel> {
    return this.store.select(selectCollectionById(this.getPart().collectionId));
  }

  public getLinkType(): Observable<LinkTypeModel> {
    return this.store.select(selectLinkTypeById(this.getPart().linkTypeId));
  }

  public onMouseDown() {
    if (!this.selected) {
      this.selectColumn();
    }
  }

  private selectColumn() {
    this.store.dispatch(new TablesAction.SetCursor({cursor: this.cursor}));
  }

  public onShowSingleColumn(attribute: AttributeModel) {
    this.showColumns(attribute.id);
  }

  public onShowAllColumns() {
    this.showColumns(...this.column.attributeIds);
  }

  private showColumns(...attributeIds: string[]) {
    this.store.dispatch(new TablesAction.ShowColumns({
      cursor: this.cursor,
      attributeIds
    }));
  }

  private getPart(): TablePart {
    return this.table.parts[this.cursor.partIndex];
  }

}
