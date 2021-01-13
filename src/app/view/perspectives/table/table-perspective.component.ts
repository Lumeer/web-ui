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
import {BehaviorSubject, combineLatest, Observable, Subscription} from 'rxjs';
import {
  debounceTime,
  filter,
  first,
  map,
  mergeMap,
  pairwise,
  startWith,
  switchMap,
  take,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import {AppState} from '../../../core/store/app.state';
import {Query, QueryStem} from '../../../core/store/navigation/query/query';
import {getNewLinkTypeIdFromQuery, hasQueryNewLink} from '../../../core/store/navigation/query/query.helper';
import {isFirstTableCell, isLastTableCell, TableCursor} from '../../../core/store/tables/table-cursor';
import {DEFAULT_TABLE_ID, TableColumnType, TableConfig, TableModel} from '../../../core/store/tables/table.model';
import {TablesAction} from '../../../core/store/tables/tables.action';
import {selectTableById, selectTableConfigById, selectTableCursor} from '../../../core/store/tables/tables.selector';
import {DefaultViewConfig, View, ViewConfig} from '../../../core/store/views/view';
import {
  selectCurrentView,
  selectDefaultViewConfig,
  selectDefaultViewConfigSnapshot,
  selectViewQuery,
} from '../../../core/store/views/views.state';
import {Direction} from '../../../shared/direction';
import {isKeyPrintable, KeyCode} from '../../../shared/key-code';
import {PERSPECTIVE_CHOOSER_CLICK} from '../../view-controls/view-controls.component';
import {Perspective} from '../perspective';
import {TableBodyComponent} from './body/table-body.component';
import {TableHeaderComponent} from './header/table-header.component';
import {TableRowNumberService} from './table-row-number.service';
import {selectTable, selectTableId} from '../../../core/store/tables/tables.state';
import {
  getAllCollectionIdsFromQuery,
  getBaseCollectionIdsFromQuery,
  queryIsEmpty,
} from '../../../core/store/navigation/query/query.util';
import {preferViewConfigUpdate} from '../../../core/store/views/view.utils';
import {ViewsAction} from '../../../core/store/views/views.action';
import CreateTable = TablesAction.CreateTable;
import {deepObjectsEquals} from '../../../shared/utils/common.utils';
import {selectCurrentQueryDocumentsLoaded} from '../../../core/store/documents/documents.state';
import {createTableSaveConfig} from '../../../core/store/tables/utils/table-save-config.util';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {selectCurrentQueryLinkInstancesLoaded} from '../../../core/store/link-instances/link-instances.state';
import {selectAllLinkTypes} from '../../../core/store/link-types/link-types.state';
import {selectCanManageViewConfig} from '../../../core/store/common/permissions.selectors';
import {isTablePartEmpty} from '../../../shared/table/model/table-utils';

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
  public query: Query;

  @Input()
  public tableId: string;

  @HostBinding('id')
  public elementId: string;

  @ViewChild(TableHeaderComponent)
  public tableHeader: TableHeaderComponent;

  @ViewChild(TableBodyComponent)
  public tableBody: TableBodyComponent;

  public embedded: boolean;
  public canManageConfig$: Observable<boolean>;
  public table$ = new BehaviorSubject<TableModel>(null);
  public tableId$: Observable<string>;

  private selectedCursor: TableCursor;

  private subscriptions = new Subscription();

  public constructor(
    private changeDetector: ChangeDetectorRef,
    private scrollDispatcher: ScrollDispatcher,
    private store$: Store<AppState>
  ) {}

  public ngOnInit() {
    this.resetDefaultConfigSnapshot();
    this.prepareTableId();
    this.initTable();

    this.subscriptions.add(this.subscribeToTable());
    this.subscriptions.add(this.subscribeToSelectedCursor());
    this.subscriptions.add(this.subscribeToScrolling());
    this.subscriptions.add(this.subscribeToConfigChange());

    this.canManageConfig$ = this.store$.pipe(select(selectCanManageViewConfig));
    this.tableId$ = this.store$.pipe(select(selectTableId));
  }

  private prepareTableId() {
    if (this.query && !this.tableId) {
      throw Error('tableId must be set for embedded table!');
    }
    this.embedded = !!this.query;
  }

  private setElementId(tableId: string) {
    this.elementId = `table-${tableId}`;
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
        this.refreshTable(this.query, this.tableId, table.config);
      });
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.store$.dispatch(new TablesAction.DestroyTable({tableId: DEFAULT_TABLE_ID}));
  }

  private initTable() {
    if (this.query) {
      this.initEmbeddedTable();
    } else {
      this.initTableByQuery();
    }
  }

  private initEmbeddedTable() {
    this.createTable(this.query, this.tableId, this.config);
  }

  private createTable(query: Query, tableId: string, config?: TableConfig) {
    if (!tableId) {
      throw new Error('tableId has not been set');
    }
    this.store$.dispatch(new CreateTable({tableId, query, config}));
  }

  private subscribeToTable(): Subscription {
    return this.store$
      .select(selectTable)
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

    if (isTablePartEmpty(table.config.parts[0]) && !isTablePartEmpty(table.config.parts[2])) {
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

  private subscribeToConfigChange(): Subscription {
    return this.store$
      .pipe(
        select(selectTable),
        filter(table => !!table?.config && table.id === DEFAULT_TABLE_ID),
        switchMap(table => this.waitForDataLoaded$().pipe(map(() => table))),
        debounceTime(1000),
        withLatestFrom(this.selectCurrentDefaultViewConfig$())
      )
      .subscribe(([table, {key, defaultConfig}]) => {
        const firstPart = (table.config.parts || [])[0];
        const config: ViewConfig = {table: createTableSaveConfig({parts: [firstPart], rows: []})};
        const defaultConfigCleaned = createTableSaveConfig(defaultConfig?.config?.table);
        const defaultConfigFirstPart = defaultConfigCleaned?.parts?.[0];

        if (!defaultConfigFirstPart || !deepObjectsEquals(config.table.parts[0], defaultConfigFirstPart)) {
          this.store$.dispatch(
            new ViewsAction.SetDefaultConfig({model: {key, config, perspective: Perspective.Table}})
          );
        }
      });
  }

  private waitForDataLoaded$(query?: Query): Observable<boolean> {
    if (query) {
      this.fetchData(query);
    }
    return this.store$.pipe(
      select(selectCurrentQueryDocumentsLoaded),
      filter(loaded => loaded),
      mergeMap(() => this.store$.pipe(select(selectCurrentQueryLinkInstancesLoaded))),
      filter(loaded => loaded),
      take(1)
    );
  }

  private fetchData(query: Query) {
    this.store$.pipe(select(selectAllLinkTypes), take(1)).subscribe(linkTypes => {
      this.store$.dispatch(new DocumentsAction.Get({query}));
      this.store$.dispatch(new LinkInstancesAction.Get({query}));
      const stems: QueryStem[] = getAllCollectionIdsFromQuery(query, linkTypes)
        .slice(1)
        .map(collectionId => ({collectionId}));
      if (stems.length > 0) {
        this.store$.dispatch(new DocumentsAction.Get({query: {stems}}));
      }
    });
  }

  private initTableByQuery() {
    const subscription = this.store$
      .pipe(
        select(selectCurrentView),
        startWith(null as View),
        pairwise(),
        switchMap(([previousView, view]) =>
          view ? this.initTableWithView(previousView, view) : this.initTableDefaultView()
        )
      )
      .subscribe(({query, config, tableId, forceRefresh}) => {
        this.setElementId(tableId);
        if (!forceRefresh && this.queryHasNewLink(query)) {
          this.addTablePart(query, tableId);
        } else {
          this.refreshTable(query, tableId, config);
        }

        this.query = query;
        this.changeDetector.markForCheck();
      });
    this.subscriptions.add(subscription);
  }

  private initTableWithView(
    previousView: View,
    view: View
  ): Observable<{query: Query; config: TableConfig; tableId: string; forceRefresh?: boolean}> {
    return this.store$.pipe(
      select(selectViewQuery),
      switchMap(query => {
        const tableId = view.code;
        return this.store$.pipe(
          select(selectTableById(tableId)),
          take(1),
          map(table => {
            if (previousView?.id === view.id && this.queryHasNewLink(query)) {
              return {query, config: view.config.table, tableId};
            }

            if (preferViewConfigUpdate(previousView?.config?.table, view?.config?.table, !!table)) {
              return {
                query,
                config: view.config?.table,
                tableId,
                forceRefresh: true,
              };
            }
            return {query, config: table?.config || view.config?.table, tableId, forceRefresh: true};
          })
        );
      })
    );
  }

  private initTableDefaultView(): Observable<{
    query: Query;
    config: TableConfig;
    tableId: string;
    forceRefresh?: boolean;
  }> {
    return this.store$.pipe(
      select(selectViewQuery),
      switchMap(query => {
        const tableId = DEFAULT_TABLE_ID;
        return this.selectCurrentDefaultViewConfig$().pipe(
          withLatestFrom(this.store$.pipe(select(selectTableConfigById(tableId)))),
          map(([{defaultConfig}, tableConfig]) => {
            if (this.queryHasNewLink(query)) {
              return {query, config: tableConfig, tableId};
            }

            return {
              query,
              config: mergeFirstTablePart(tableConfig, defaultConfig?.config?.table),
              tableId,
            };
          }),
          tap(({config}) => this.checkConfigSnapshot(config))
        );
      })
    );
  }

  private checkConfigSnapshot(config: TableConfig) {
    combineLatest([this.selectTableDefaultConfigId$(), this.store$.pipe(select(selectDefaultViewConfigSnapshot))])
      .pipe(take(1))
      .subscribe(([tableId, snapshot]) => {
        if (!snapshot || snapshot.key !== tableId || snapshot.perspective !== Perspective.Table) {
          const defaultConfigSnapshot: DefaultViewConfig = {
            key: tableId,
            perspective: Perspective.Table,
            config: {table: config},
          };
          this.store$.dispatch(new ViewsAction.SetDefaultConfigSnapshot({model: defaultConfigSnapshot}));
        }
      });
  }

  private selectCurrentDefaultViewConfig$(): Observable<{key: string; defaultConfig: DefaultViewConfig}> {
    return this.selectTableDefaultConfigId$().pipe(
      switchMap(collectionId =>
        this.store$.pipe(
          select(selectDefaultViewConfig(Perspective.Table, collectionId)),
          map(defaultConfig => ({key: collectionId, defaultConfig}))
        )
      )
    );
  }

  private selectTableDefaultConfigId$(): Observable<string> {
    return this.store$.pipe(
      select(selectViewQuery),
      map(query => getBaseCollectionIdsFromQuery(query)[0])
    );
  }

  private queryHasNewLink(query: Query): boolean {
    return this.table$.value && hasQueryNewLink(this.query, query);
  }

  private addTablePart(query: Query, tableId: string) {
    const linkTypeId = getNewLinkTypeIdFromQuery(this.query, query);
    const subscription = this.waitForDataLoaded$(query).subscribe(() => {
      this.store$.dispatch(new TablesAction.CreatePart({tableId, linkTypeId, last: true}));
    });
    this.subscriptions.add(subscription);
  }

  private refreshTable(query: Query, tableId: string, config: TableConfig) {
    if (queryIsEmpty(query) && tableId === DEFAULT_TABLE_ID) {
      this.store$.dispatch(new TablesAction.DestroyTable({tableId: DEFAULT_TABLE_ID}));
    } else {
      const subscription = this.waitForDataLoaded$(query).subscribe(() => {
        this.createTable(query, tableId, config);
      });
      this.subscriptions.add(subscription);
    }
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

  private resetDefaultConfigSnapshot() {
    this.store$.dispatch(new ViewsAction.SetDefaultConfigSnapshot({}));
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

function mergeFirstTablePart(config: TableConfig, defaultConfig: TableConfig): TableConfig {
  if (!config || !defaultConfig) {
    return config || defaultConfig;
  }

  const configFirstPart = config.parts?.[0];
  const defaultConfigFirstPart = defaultConfig.parts?.[0];

  if (
    configFirstPart &&
    defaultConfigFirstPart &&
    configFirstPart?.collectionId === defaultConfigFirstPart?.collectionId
  ) {
    const columns = [...(configFirstPart.columns || [])];
    for (const column of defaultConfigFirstPart.columns || []) {
      const columnIndex = columns.findIndex(col => deepObjectsEquals(col.attributeIds, column.attributeIds));
      if (columnIndex !== -1) {
        columns[columnIndex] = {...columns[columnIndex], width: column.width, type: column.type};
      }
    }
    const parts = [...config.parts];
    parts[0] = {...configFirstPart, columns};

    return {...config, parts};
  }

  return config;
}
