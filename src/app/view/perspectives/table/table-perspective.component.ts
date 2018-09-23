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

import {Component, ElementRef, HostBinding, HostListener, Input, OnDestroy, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs';
import {filter} from 'rxjs/operators';
import {AppState} from '../../../core/store/app.state';
import {LinkInstanceModel} from '../../../core/store/link-instances/link-instance.model';
import {selectNavigation} from '../../../core/store/navigation/navigation.state';
import {areQueriesEqual, getNewLinkTypeIdFromQuery, hasQueryNewLink} from '../../../core/store/navigation/query.helper';
import {QueryModel} from '../../../core/store/navigation/query.model';
import {TableCursor} from '../../../core/store/tables/table-cursor';
import {DEFAULT_TABLE_ID, TableColumnType, TableModel} from '../../../core/store/tables/table.model';
import {TablesAction} from '../../../core/store/tables/tables.action';
import {selectTableById, selectTableCursor} from '../../../core/store/tables/tables.state';
import {Direction} from '../../../shared/direction';
import {isKeyPrintable, KeyCode} from '../../../shared/key-code';
import {PERSPECTIVE_CHOOSER_CLICK} from '../../view-controls/view-controls.component';
import {Perspective} from '../perspective';
import CreateTable = TablesAction.CreateTable;
import DestroyTable = TablesAction.DestroyTable;

declare let $: any;

@Component({
  selector: 'table-perspective',
  templateUrl: './table-perspective.component.html',
  styleUrls: ['./table-perspective.component.scss']
})
export class TablePerspectiveComponent implements OnInit, OnDestroy {

  @Input()
  public linkInstance: LinkInstanceModel;

  @Input()
  public query: QueryModel;

  @HostBinding('id')
  public elementId: string;

  public table: TableModel;
  private tableId: string;

  public height = 'auto';

  private selectedCursor: TableCursor;

  private subscriptions = new Subscription();

  public constructor(private element: ElementRef,
                     private store$: Store<AppState>) {
  }

  public ngOnInit() {
    this.tableId = this.createTableId();
    this.elementId = `table-${this.tableId}`;

    this.createTableFromQuery();
    this.subscribeToTable();
    this.subscribeToSelectedCursor();
  }

  private subscribeToSelectedCursor() {
    this.subscriptions.add(
      this.store$.select(selectTableCursor).subscribe(cursor => this.selectedCursor = cursor)
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.destroyTable();
  }

  private createTableFromQuery() {
    if (this.query) {
      this.createTable(this.query);
    } else {
      this.subscribeToQuery();
    }
  }

  private createTable(query: QueryModel) {
    if (!this.tableId) {
      throw new Error('tableId has not been set');
    }
    this.store$.dispatch(new CreateTable({tableId: this.tableId, query}));
  }

  private destroyTable() {
    if (!this.tableId || !this.table) {
      return;
    }
    this.store$.dispatch(new DestroyTable({tableId: this.tableId}));
  }

  private subscribeToTable() {
    this.subscriptions.add(
      this.store$.select(selectTableById(this.tableId)).pipe(
        filter(table => !!table)
      ).subscribe(table => {
        this.table = table;
        this.switchPartsIfFirstEmpty(table);
      })
    );
  }

  private switchPartsIfFirstEmpty(table: TableModel) {
    if (table.parts.length !== 3) {
      return;
    }

    const empty = !table.parts[0].columns.find(column =>
      (column.type === TableColumnType.HIDDEN && column.attributeIds && column.attributeIds.length > 0)
      || (column.type === TableColumnType.COMPOUND && !!column.parent.attributeId)
    );

    if (empty) {
      this.store$.dispatch(new TablesAction.SwitchParts({
        cursor: {
          tableId: table.id,
          partIndex: 0
        }
      }));
    }
  }

  private subscribeToQuery() {
    this.subscriptions.add(
      this.store$.select(selectNavigation).pipe(
        filter(navigation => navigation.perspective === Perspective.Table && !!navigation.query)
      ).subscribe(({query}) => {
        if (areQueriesEqual(this.query, query)) {
          return;
        }

        if (this.table && hasQueryNewLink(this.query, query)) {
          this.addTablePart(query);
        } else {
          this.refreshTable(query);
        }

        this.query = query;
      })
    );
  }

  private addTablePart(query: QueryModel) {
    const linkTypeId = getNewLinkTypeIdFromQuery(this.query, query);
    this.store$.dispatch(new TablesAction.CreatePart({tableId: this.tableId, linkTypeId}));
  }

  private refreshTable(query: QueryModel) {
    this.destroyTable();
    this.createTable(query);
  }

  private createTableId(): string {
    return this.linkInstance ? this.linkInstance.id : DEFAULT_TABLE_ID;
  }

  public onClickOutside(event: MouseEvent) {
    if (this.selectedCursor && !event[PERSPECTIVE_CHOOSER_CLICK]) {
      this.store$.dispatch(new TablesAction.SetCursor({cursor: null}));
    }
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (!this.selectedCursor) {
      return;
    }

    switch (event.code) {
      case KeyCode.ArrowLeft:
        return this.store$.dispatch(new TablesAction.MoveCursor({direction: Direction.Left}));
      case KeyCode.ArrowUp:
        return this.store$.dispatch(new TablesAction.MoveCursor({direction: Direction.Up}));
      case KeyCode.ArrowRight:
      case KeyCode.Tab:
        event.preventDefault();
        return this.store$.dispatch(new TablesAction.MoveCursor({direction: Direction.Right}));
      case KeyCode.ArrowDown:
        return this.store$.dispatch(new TablesAction.MoveCursor({direction: Direction.Down}));
      case KeyCode.Backspace:
      case KeyCode.Delete:
        event.preventDefault();
        return this.store$.dispatch(new TablesAction.RemoveSelectedCell());
      case KeyCode.Enter:
      case KeyCode.F2:
        event.preventDefault();
        return this.store$.dispatch(new TablesAction.EditSelectedCell());
      default:
        if (!isKeyPrintable(event) || event.ctrlKey || event.altKey || event.metaKey) {
          return;
        }

        return this.store$.dispatch(new TablesAction.EditSelectedCell());
    }
  }

  public onBodyScroll(event: Event) {
    const scrollLeft: number = event.target['scrollLeft'];
    $('table-header > div').css('left', -scrollLeft);
  }

}
