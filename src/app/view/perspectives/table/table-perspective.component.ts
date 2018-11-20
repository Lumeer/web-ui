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

import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {filter, first, withLatestFrom} from 'rxjs/operators';
import {AppState} from '../../../core/store/app.state';
import {LinkInstanceModel} from '../../../core/store/link-instances/link-instance.model';
import {selectNavigation} from '../../../core/store/navigation/navigation.state';
import {areQueriesEqual, getNewLinkTypeIdFromQuery, hasQueryNewLink} from '../../../core/store/navigation/query.helper';
import {QueryModel} from '../../../core/store/navigation/query.model';
import {TableCursor} from '../../../core/store/tables/table-cursor';
import {DEFAULT_TABLE_ID, TableColumnType, TableConfig, TableModel} from '../../../core/store/tables/table.model';
import {TablesAction} from '../../../core/store/tables/tables.action';
import {selectTableConfig} from '../../../core/store/tables/tables.selector';
import {selectTableById, selectTableCursor} from '../../../core/store/tables/tables.state';
import {ViewModel} from '../../../core/store/views/view.model';
import {selectCurrentView, selectPerspectiveViewConfig} from '../../../core/store/views/views.state';
import {Direction} from '../../../shared/direction';
import {isKeyPrintable, KeyCode} from '../../../shared/key-code';
import {PERSPECTIVE_CHOOSER_CLICK} from '../../view-controls/view-controls.component';
import {Perspective} from '../perspective';
import CreateTable = TablesAction.CreateTable;
import DestroyTable = TablesAction.DestroyTable;

declare let $: any;

export const EDITABLE_EVENT = 'editableEvent';

@Component({
  selector: 'table-perspective',
  templateUrl: './table-perspective.component.html',
  styleUrls: ['./table-perspective.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TablePerspectiveComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public config: TableConfig;

  @Input()
  public linkInstance: LinkInstanceModel;

  @Input()
  public query: QueryModel;

  @Input()
  public tableId: string;

  @HostBinding('id')
  public elementId: string;

  public currentView$: Observable<ViewModel>;
  public table$ = new BehaviorSubject<TableModel>(null);

  private selectedCursor: TableCursor;

  private subscriptions = new Subscription();

  public constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.prepareTableId();
    this.initTable();
    this.subscribeToTable();
    this.subscribeToSelectedCursor();
    this.currentView$ = this.store$.select(selectCurrentView);
  }

  private prepareTableId() {
    if (this.query && !this.tableId) {
      throw Error('tableId must be set for embedded table!');
    }
    this.tableId = this.tableId || DEFAULT_TABLE_ID;
    this.elementId = `table-${this.tableId}`;
  }

  private subscribeToSelectedCursor() {
    this.subscriptions.add(this.store$.select(selectTableCursor).subscribe(cursor => (this.selectedCursor = cursor)));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.query && !changes.query.firstChange) {
      this.refreshEmbeddedTable();
    }
  }

  private refreshEmbeddedTable() {
    this.store$
      .pipe(
        select(selectTableById(this.tableId)),
        first(),
        filter(table => !!table)
      )
      .subscribe(table => {
        this.refreshTable(this.query, table.config);
      });
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.destroyTable();
  }

  private initTable() {
    this.store$
      .pipe(
        select(selectPerspectiveViewConfig),
        first()
      )
      .subscribe(config => this.createTableFromQuery(config));
  }

  private createTableFromQuery(config: TableConfig) {
    if (this.query) {
      this.createTable(this.query, this.config);
    } else {
      this.subscribeToQuery(config);
    }
  }

  private createTable(query: QueryModel, config?: TableConfig) {
    if (!this.tableId) {
      throw new Error('tableId has not been set');
    }
    this.store$.dispatch(new CreateTable({tableId: this.tableId, query, config}));
  }

  private destroyTable() {
    if (!this.tableId || !this.table$.getValue()) {
      return;
    }
    this.store$.dispatch(new DestroyTable({tableId: this.tableId}));
  }

  private subscribeToTable() {
    this.subscriptions.add(
      this.store$
        .select(selectTableById(this.tableId))
        .pipe(filter(table => !!table))
        .subscribe(table => {
          this.table$.next(table);
          this.switchPartsIfFirstEmpty(table);
        })
    );
  }

  private switchPartsIfFirstEmpty(table: TableModel) {
    if (table.parts.length !== 3) {
      return;
    }

    const empty = !table.parts[0].columns.find(
      column =>
        (column.type === TableColumnType.HIDDEN && column.attributeIds && column.attributeIds.length > 0) ||
        (column.type === TableColumnType.COMPOUND && !!column.parent.attributeId)
    );

    if (empty) {
      this.store$.dispatch(
        new TablesAction.SwitchParts({
          cursor: {
            tableId: table.id,
            partIndex: 0,
          },
        })
      );
    }
  }

  private subscribeToQuery(initConfig: TableConfig) {
    this.subscriptions.add(
      this.store$
        .pipe(
          select(selectNavigation),
          filter(navigation => navigation.perspective === Perspective.Table && !!navigation.query),
          withLatestFrom(this.store$.pipe(select(selectTableConfig)))
        )
        .subscribe(([{query}, config]) => {
          if (areQueriesEqual(this.query, query)) {
            return;
          }

          if (this.table$.getValue() && hasQueryNewLink(this.query, query)) {
            this.addTablePart(query);
          } else {
            this.refreshTable(query, config || initConfig);
          }

          this.query = query;
        })
    );
  }

  private addTablePart(query: QueryModel) {
    const linkTypeId = getNewLinkTypeIdFromQuery(this.query, query);
    this.store$.dispatch(new TablesAction.CreatePart({tableId: this.tableId, linkTypeId, last: true}));
  }

  private refreshTable(query: QueryModel, config: TableConfig) {
    this.destroyTable();
    this.createTable(query, config);
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

    const editableEvent = event[EDITABLE_EVENT];

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
        if (editableEvent) {
          return this.store$.dispatch(new TablesAction.RemoveSelectedCell());
        }
        return;
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.F2:
        event.preventDefault();
        if (editableEvent) {
          return this.store$.dispatch(new TablesAction.EditSelectedCell({}));
        }
        return;
      default:
        if (!isKeyPrintable(event) || event.ctrlKey || event.altKey || event.metaKey || !editableEvent) {
          return;
        }

        return this.store$.dispatch(new TablesAction.EditSelectedCell({clear: true}));
    }
  }

  @HostListener('contextmenu', ['$event'])
  public onContextMenu(event: MouseEvent) {
    event.preventDefault();
  }

  public onBodyScroll(event: Event) {
    const scrollLeft: number = event.target['scrollLeft'];
    $('table-header > div').css('left', -scrollLeft);
  }
}
