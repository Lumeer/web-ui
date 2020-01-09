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

import {CdkScrollable, ScrollDispatcher} from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {filter, first, withLatestFrom} from 'rxjs/operators';
import {AppState} from '../../../core/store/app.state';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {selectNavigation} from '../../../core/store/navigation/navigation.state';
import {Query} from '../../../core/store/navigation/query/query';
import {
  areQueriesEqual,
  getNewLinkTypeIdFromQuery,
  hasQueryNewLink,
} from '../../../core/store/navigation/query/query.helper';
import {isFirstTableCell, isLastTableCell, TableCursor} from '../../../core/store/tables/table-cursor';
import {DEFAULT_TABLE_ID, TableColumnType, TableConfig, TableModel} from '../../../core/store/tables/table.model';
import {TablesAction} from '../../../core/store/tables/tables.action';
import {selectTableById, selectTableConfigById, selectTableCursor} from '../../../core/store/tables/tables.selector';
import {View} from '../../../core/store/views/view';
import {selectCurrentView, selectViewConfig} from '../../../core/store/views/views.state';
import {Direction} from '../../../shared/direction';
import {isKeyPrintable, KeyCode} from '../../../shared/key-code';
import {PERSPECTIVE_CHOOSER_CLICK} from '../../view-controls/view-controls.component';
import {Perspective} from '../perspective';
import {TableBodyComponent} from './body/table-body.component';
import {TableHeaderComponent} from './header/table-header.component';
import {TableRowNumberService} from './table-row-number.service';
import CreateTable = TablesAction.CreateTable;
import DestroyTable = TablesAction.DestroyTable;

export const EDITABLE_EVENT = 'editableEvent';

@Component({
  selector: 'table-perspective',
  templateUrl: './table-perspective.component.html',
  styleUrls: ['./table-perspective.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TableRowNumberService],
})
export class TablePerspectiveComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public config: TableConfig;

  @Input()
  public linkInstance: LinkInstance;

  @Input()
  public query: Query;

  @Input()
  public tableId: string;

  @HostBinding('id')
  public elementId: string;

  @ViewChild(TableHeaderComponent, {static: false})
  public tableHeader: TableHeaderComponent;

  @ViewChild(TableBodyComponent, {static: false})
  public tableBody: TableBodyComponent;

  public currentView$: Observable<View>;
  public table$ = new BehaviorSubject<TableModel>(null);

  private selectedCursor: TableCursor;

  private lastViewId: string;

  private subscriptions = new Subscription();

  public constructor(
    private changeDetector: ChangeDetectorRef,
    private scrollDispatcher: ScrollDispatcher,
    private store$: Store<AppState>
  ) {}

  public ngOnInit() {
    this.prepareTableId();
    this.initTable();

    this.subscriptions.add(this.subscribeToTable());
    this.subscriptions.add(this.subscribeToSelectedCursor());
    this.subscriptions.add(this.subscribeToScrolling());

    this.currentView$ = this.store$.select(selectCurrentView);
  }

  private prepareTableId() {
    if (this.query && !this.tableId) {
      throw Error('tableId must be set for embedded table!');
    }
    this.tableId = this.tableId || DEFAULT_TABLE_ID;
    this.elementId = `table-${this.tableId}`;
  }

  private subscribeToSelectedCursor(): Subscription {
    return this.store$.pipe(select(selectTableCursor)).subscribe(cursor => {
      this.selectedCursor = cursor;
      this.scrollToEdgeIfEdgeCellSelected(cursor);
    });
  }

  private scrollToEdgeIfEdgeCellSelected(cursor: TableCursor) {
    const [scrollable] = Array.from(this.scrollDispatcher.scrollContainers.keys());
    if (cursor && scrollable) {
      this.scrollLeftIfFirstCellSelected(cursor, scrollable);
      this.scrollRightIfLastCellSelected(cursor, scrollable);
    }
  }

  private scrollLeftIfFirstCellSelected(cursor: TableCursor, scrollable: CdkScrollable) {
    if (!isFirstTableCell(cursor)) {
      return;
    }

    const scrollLeft = scrollable.measureScrollOffset('left');
    if (scrollLeft !== 0) {
      scrollable.scrollTo({left: 0});
    }
  }

  private scrollRightIfLastCellSelected(cursor: TableCursor, scrollable: CdkScrollable) {
    const table = this.table$.getValue();
    if (!isLastTableCell(cursor, table && table.config)) {
      return;
    }

    const scrollRight = scrollable.measureScrollOffset('right');
    if (scrollRight !== 0) {
      scrollable.scrollTo({right: 0});
    }
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
        select(selectViewConfig),
        first()
      )
      .subscribe(config => this.createTableFromQuery(config && config.table));
  }

  private createTableFromQuery(config: TableConfig) {
    if (this.query) {
      this.createTable(this.query, this.config);
    } else {
      this.subscriptions.add(this.subscribeToQuery(config));
    }
  }

  private createTable(query: Query, config?: TableConfig) {
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

  private subscribeToTable(): Subscription {
    return this.store$
      .select(selectTableById(this.tableId))
      .pipe(filter(table => !!table))
      .subscribe(table => {
        this.table$.next(table);
        this.switchPartsIfFirstEmpty(table);
      });
  }

  private switchPartsIfFirstEmpty(table: TableModel) {
    if (!table.config || table.config.parts.length !== 3) {
      return;
    }

    const empty = !table.config.parts[0].columns.find(
      column =>
        [TableColumnType.COMPOUND, TableColumnType.HIDDEN].includes(column.type) &&
        column.attributeIds &&
        column.attributeIds.length > 0
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

  private subscribeToQuery(initConfig: TableConfig): Subscription {
    // the filter in the pipe passes only when the table is not embedded
    // as a consequence, there cannot be multiple embedded tables in the table perspective, this would require further refinement here
    return this.store$
      .pipe(
        select(selectNavigation),
        filter(navigation => navigation.perspective === Perspective.Table && !!navigation.query),
        withLatestFrom(
          this.store$.pipe(select(selectTableConfigById(this.tableId))),
          this.store$.pipe(select(selectViewConfig)),
          this.store$.pipe(select(selectCurrentView))
        )
      )
      .subscribe(([{query}, config, viewConfig, view]) => {
        // views can have the same query and still be configured differently
        if (areQueriesEqual(this.query, query) && (!view || this.lastViewId === view.id)) {
          return;
        }

        if (view) {
          this.lastViewId = view.id;
        }

        if (this.table$.getValue() && hasQueryNewLink(this.query, query)) {
          this.addTablePart(query);
        } else {
          // when tableId does not change, config holds the old table configuration - this helps only when view is not used
          // initConfig is initialized only once and carries the initial perspective config
          // viewConfig is the up-to-date configuration of the current view
          this.refreshTable(query, (viewConfig && viewConfig.table) || config || initConfig);
        }

        this.query = query;
        this.changeDetector.markForCheck();
      });
  }

  private addTablePart(query: Query) {
    const linkTypeId = getNewLinkTypeIdFromQuery(this.query, query);
    this.store$.dispatch(new TablesAction.CreatePart({tableId: this.tableId, linkTypeId, last: true}));
  }

  private refreshTable(query: Query, config: TableConfig) {
    this.destroyTable();
    this.createTable(query, config);
  }

  private subscribeToScrolling(): Subscription {
    return this.scrollDispatcher
      .scrolled()
      .pipe(filter(scrollable => !!scrollable))
      .subscribe((scrollable: CdkScrollable) => {
        const left = scrollable.measureScrollOffset('left');
        const otherScrollable = Array.from(this.scrollDispatcher.scrollContainers.keys()).find(s => s !== scrollable);

        if (otherScrollable && otherScrollable.measureScrollOffset('left') !== left) {
          otherScrollable.scrollTo({left});
        }
      });
  }

  public onClickOutside(event: Event) {
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
        return this.store$.dispatch(
          new TablesAction.MoveCursor({direction: event.shiftKey ? Direction.Left : Direction.Right})
        );
      case KeyCode.ArrowDown:
        return this.store$.dispatch(new TablesAction.MoveCursor({direction: Direction.Down}));
      case KeyCode.Backspace:
        event.preventDefault();
        event.stopPropagation();
        this.store$.dispatch(new TablesAction.EditSelectedCell({clear: true}));
        return;
      case KeyCode.Delete:
        event.preventDefault();
        event.stopPropagation();
        this.store$.dispatch(new TablesAction.RemoveSelectedCell());
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
}
