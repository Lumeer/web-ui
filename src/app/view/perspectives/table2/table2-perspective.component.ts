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

import {Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {filter} from 'rxjs/operators';
import {Subscription} from 'rxjs';
import {AppState} from '../../../core/store/app.state';
import {LinkInstanceModel} from '../../../core/store/link-instances/link-instance.model';
import {selectNavigation} from '../../../core/store/navigation/navigation.state';
import {areQueriesEqual, getNewLinkTypeIdFromQuery, hasQueryNewLink} from '../../../core/store/navigation/query.helper';
import {QueryModel} from '../../../core/store/navigation/query.model';
import {TableCursor} from '../../../core/store/tables/table-cursor';
import {DEFAULT_TABLE_ID, TableModel} from '../../../core/store/tables/table.model';
import {TablesAction} from '../../../core/store/tables/tables.action';
import {selectTableById, selectTableCursor} from '../../../core/store/tables/tables.state';
import {Direction} from '../../../shared/direction';
import {KeyCode} from '../../../shared/key-code';
import {isKeyPrintable} from '../../../shared/utils/key-code.helper';
import {PERSPECTIVE_CHOOSER_CLICK} from '../../view-controls/view-controls.component';
import {Perspective} from '../perspective';
import CreateTable = TablesAction.CreateTable;
import DestroyTable = TablesAction.DestroyTable;

@Component({
  selector: 'table2-perspective',
  templateUrl: './table2-perspective.component.html',
  styleUrls: ['./table2-perspective.component.scss']
})
export class Table2PerspectiveComponent implements OnInit, OnDestroy {

  @Input()
  public linkInstance: LinkInstanceModel;

  @Input()
  public query: QueryModel;

  @ViewChild('positioner')
  public positioner: ElementRef;

  public table: TableModel;
  private tableId: string;

  public height = 'auto';

  private selectedCursor: TableCursor;

  private subscriptions = new Subscription();

  public constructor(private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.tableId = this.createTableId();
    if (this.tableId === DEFAULT_TABLE_ID) {
      this.calculateHeight();
    }

    this.createTableFromQuery();
    this.subscribeToTable();
    this.subscribeToSelectedCursor();
  }

  private subscribeToSelectedCursor() {
    this.subscriptions.add(
      this.store.select(selectTableCursor).subscribe(cursor => this.selectedCursor = cursor)
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
    this.store.dispatch(new CreateTable({tableId: this.tableId, query}));
  }

  private destroyTable() {
    if (!this.tableId || !this.table) {
      return;
    }
    this.store.dispatch(new DestroyTable({tableId: this.tableId}));
  }

  private subscribeToTable() {
    this.subscriptions.add(
      this.store.select(selectTableById(this.tableId)).pipe(
        filter(table => !!table)
      ).subscribe(table => {
        this.table = table;
      })
    );
  }

  private subscribeToQuery() {
    this.subscriptions.add(
      this.store.select(selectNavigation).pipe(
        filter(navigation => navigation.perspective === Perspective.Table2 && !!navigation.query)
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
    this.store.dispatch(new TablesAction.CreatePart({tableId: this.tableId, linkTypeId}));
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
      this.store.dispatch(new TablesAction.SetCursor({cursor: null}));
    }
  }

  private calculateHeight() {
    const {top} = this.positioner.nativeElement.getBoundingClientRect();
    const height = window.innerHeight - top;
    this.height = `${height}px`;
  }

  @HostListener('window:resize')
  public onResize() {
    this.calculateHeight();
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (!this.selectedCursor) {
      return;
    }

    switch (event.keyCode) {
      case KeyCode.LeftArrow:
        return this.store.dispatch(new TablesAction.MoveCursor({direction: Direction.Left}));
      case KeyCode.UpArrow:
        return this.store.dispatch(new TablesAction.MoveCursor({direction: Direction.Up}));
      case KeyCode.RightArrow:
        return this.store.dispatch(new TablesAction.MoveCursor({direction: Direction.Right}));
      case KeyCode.DownArrow:
        return this.store.dispatch(new TablesAction.MoveCursor({direction: Direction.Down}));
      case KeyCode.Enter:
      case KeyCode.Backspace:
      case KeyCode.F2:
        event.preventDefault();
        return this.store.dispatch(new TablesAction.EditSelectedCell({}));
      default:
        if (!isKeyPrintable(event.keyCode)) {
          return;
        }

        event.preventDefault();
        return this.store.dispatch(new TablesAction.EditSelectedCell({letter: event.key}));
    }
  }

}
