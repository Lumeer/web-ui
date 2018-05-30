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

import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Action, Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {concatMap, filter, first, flatMap, map, mergeMap, skipWhile, withLatestFrom} from 'rxjs/operators';
import {getArrayDifference} from '../../../shared/utils/array.utils';
import {generateAttributeName} from '../../../shared/utils/attribute.utils';
import {AppState} from '../app.state';
import {AttributeModel, CollectionModel} from '../collections/collection.model';
import {CollectionsAction} from '../collections/collections.action';
import {selectAllCollections, selectCollectionById, selectCollectionsLoaded} from '../collections/collections.state';
import {DocumentsAction} from '../documents/documents.action';
import {LinkInstancesAction} from '../link-instances/link-instances.action';
import {selectLinkInstancesByTypeAndDocuments} from '../link-instances/link-instances.state';
import {LinkTypeHelper} from '../link-types/link-type.helper';
import {selectLinkTypeById} from '../link-types/link-types.state';
import {selectQuery} from '../navigation/navigation.state';
import {QueryConverter} from '../navigation/query.converter';
import {QueryModel} from '../navigation/query.model';
import {RouterAction} from '../router/router.action';
import {ViewCursor} from '../views/view.model';
import {ViewsAction} from '../views/views.action';
import {selectViewTable2Config} from '../views/views.state';
import {moveTableCursor, TableCursor} from './table-cursor';
import {convertTableToConfig} from './table.converter';
import {DEFAULT_ROW_NUMBER_WIDTH, DEFAULT_TABLE_ID, EMPTY_TABLE_ROW, TableColumn, TableColumnType, TableCompoundColumn, TableHiddenColumn, TableModel, TablePart, TableRow, TableSingleColumn} from './table.model';
import {createCollectionPart, createLinkPart, createTableColumnsBySiblingAttributeIds, extendHiddenColumn, findTableColumn, findTableRow, getAttributeIdFromColumn, isLastTableColumn, isLastTableRow, mergeHiddenColumns, resizeLastColumnChild, splitColumnPath} from './table.utils';
import {TablesAction, TablesActionType} from './tables.action';
import {selectTableById, selectTableBySelectedCursor, selectTableCursor} from './tables.state';

@Injectable()
export class TablesEffects {

  @Effect()
  public createTable$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.CreateTable>(TablesActionType.CREATE_TABLE),
    withLatestFrom(
      this.store$.select(selectViewTable2Config),
      this.store$.select(selectCollectionsLoaded).pipe(
        skipWhile(loaded => !loaded),
        mergeMap(() => this.store$.select(selectAllCollections))
      )
    ),
    flatMap(([action, config, collections]) => {
      const query: QueryModel = action.payload.query;

      const collection = collections.find(collection => collection.id === query.collectionIds[0]);
      const part = createCollectionPart(collection, 0, config);

      const createTableAction: Action = new TablesAction.AddTable({
        table: {
          id: action.payload.tableId,
          parts: [part],
          documentIds: new Set<string>(),
          rows: [EMPTY_TABLE_ROW],
          rowNumberWidth: DEFAULT_ROW_NUMBER_WIDTH // TODO calculate dynamically
        }
      });

      const createPartActions: Action[] = query.linkTypeIds.map(linkTypeId => new TablesAction.CreatePart({
        tableId: action.payload.tableId,
        linkTypeId,
        config
      }));

      if (createPartActions.length === 0 && part.columns.length === 0) {
        const addColumnAction = new TablesAction.AddColumn({
          cursor: {
            tableId: action.payload.tableId,
            partIndex: 0,
            columnPath: [0]
          }
        });
        return [createTableAction].concat(addColumnAction);
      }
      return [createTableAction].concat(createPartActions);
    })
  );

  @Effect()
  public destroyTable$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.DestroyTable>(TablesActionType.DESTROY_TABLE),
    mergeMap(action => Observable.combineLatest(
      this.store$.select(selectTableById(action.payload.tableId)),
      this.store$.select(selectTableCursor)
    ).pipe(
      first()
    )),
    mergeMap(([table, tableCursor]) => {
      if (tableCursor && tableCursor.tableId === table.id) {
        return this.createViewCursorFromTable(table, tableCursor).pipe(
          map(viewCursor => ({table, viewCursor}))
        );
      }
      return Observable.of({table, viewCursor: null});
    }),
    flatMap(({table, viewCursor}) => {
      const actions: Action[] = [new TablesAction.RemoveTable({tableId: table.id})];

      if (table.id === DEFAULT_TABLE_ID) {
        actions.push(new ViewsAction.ChangeTable2Config({config: convertTableToConfig(table)}));
        actions.push(new ViewsAction.SetCursor({cursor: viewCursor}));
      }

      return actions;
    })
  );

  @Effect()
  public createPart$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.CreatePart>(TablesActionType.CREATE_PART),
    mergeMap(action => this.store$.select(selectTableById(action.payload.tableId)).pipe(
      first(),
      map(table => ({action, table}))
    )),
    mergeMap(item => this.store$.select(selectLinkTypeById(item.action.payload.linkTypeId)).pipe(
      first(),
      map(linkType => ({...item, linkType}))
    )),
    mergeMap(item => {
      const parts = item.table.parts;
      const lastPart = parts[parts.length - 1];

      const collectionId = LinkTypeHelper.getOtherCollectionId(item.linkType, lastPart.collectionId);
      return this.store$.select(selectCollectionById(collectionId)).pipe(
        first(),
        map(collection => ({...item, collection}))
      );
    }),
    mergeMap(({action, table, linkType, collection}) => {
      const lastIndex = table.parts.length - 1;
      const linkTypePart = createLinkPart(linkType, lastIndex + 1, action.payload.config);
      const collectionPart = createCollectionPart(collection, lastIndex + 2, action.payload.config);

      return [
        new TablesAction.AddPart({
          tableId: table.id,
          parts: [linkTypePart, collectionPart]
        }),
        new DocumentsAction.Get({
          query: {
            collectionIds: [collection.id]
          }
        }),
        new LinkInstancesAction.Get({
          query: {
            linkTypeIds: [linkType.id]
          }
        })
      ];
    })
  );

  @Effect()
  public switchParts$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.SwitchParts>(TablesActionType.SWITCH_PARTS),
    mergeMap(action => this.getLatestTable(action)),
    filter(({action, table}) => table.parts.length === 3),
    withLatestFrom(this.store$.select(selectQuery)),
    map(([{action, table}, query]) => {
      const linkTypeIds = [table.parts[1].linkTypeId];
      const collectionIds = [table.parts[2].collectionId];

      const newQuery: QueryModel = {...query, collectionIds, linkTypeIds};

      return new RouterAction.Go({
        path: [],
        queryParams: {
          query: QueryConverter.toString(newQuery)
        },
        extras: {
          queryParamsHandling: 'merge'
        }
      });
    })
  );

  @Effect()
  public removePart$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.RemovePart>(TablesActionType.REMOVE_PART),
    mergeMap(action => this.getLatestTable(action)),
    withLatestFrom(this.store$.select(selectQuery)),
    map(([{action, table}, query]) => {
      const linkTypeIds = table.parts.slice(0, action.payload.cursor.partIndex)
        .reduce((linkTypeIds, part) => part.linkTypeId ? linkTypeIds.concat(part.linkTypeId) : linkTypeIds, []);
      const newQuery: QueryModel = {...query, linkTypeIds};

      return new RouterAction.Go({
        path: [],
        queryParams: {
          query: QueryConverter.toString(newQuery)
        },
        extras: {
          queryParamsHandling: 'merge'
        }
      });
    })
  );

  @Effect()
  public addColumn$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.AddColumn>(TablesActionType.ADD_COLUMN),
    mergeMap(action => this.getLatestTable(action)),
    mergeMap(({action, table}) => {
      const {cursor} = action.payload;
      const part: TablePart = table.parts[cursor.partIndex];
      const columns = part.columns;

      if (part.collectionId) {
        return this.store$.select(selectCollectionById(part.collectionId)).pipe(
          first(),
          map(collection => ({cursor, columns, attributes: collection.attributes}))
        );
      } else {
        return this.store$.select(selectLinkTypeById(part.linkTypeId)).pipe(
          first(),
          map(linkType => ({cursor, columns, attributes: linkType.attributes}))
        );
      }
    }),
    map(({cursor, columns, attributes}) => {
      const parentColumn = cursor.columnPath.length > 1 ? findTableColumn(columns, cursor.columnPath.slice(0, -1)) : null;
      const parentAttributeId = parentColumn ? (parentColumn as TableCompoundColumn).parent.attributeId : null;
      const parentAttribute = attributes.find(attribute => attribute.id === parentAttributeId);
      const parentName = parentAttribute ? parentAttribute.name : null;

      const attributeName = generateAttributeName(attributes, parentName);
      const column = new TableCompoundColumn(new TableSingleColumn(null, attributeName), []);

      return new TablesAction.ReplaceColumns({cursor, deleteCount: 0, columns: [column]});
    })
  );

  @Effect()
  public splitColumn$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.SplitColumn>(TablesActionType.SPLIT_COLUMN),
    mergeMap(action => this.store$.select(selectTableById(action.payload.cursor.tableId)).pipe(
      first(),
      mergeMap(table => {
        const part = table.parts[action.payload.cursor.partIndex];
        return this.store$.select(selectCollectionById(part.collectionId)).pipe( // TODO linktype as well
          first(),
          map(collection => ({action, part, collection}))
        );
      })
    )),
    flatMap(({action, part, collection}) => {
      const childNames = ['A', 'B'];

      const path = action.payload.cursor.columnPath;
      const column = findTableColumn(part.columns, path) as TableCompoundColumn;

      const oldAttribute = collection.attributes.find(attribute => attribute.id === column.parent.attributeId);

      const replaceColumnAction = createReplaceColumnAction(action, column, childNames);
      const parentAttributeAction = createParentAttributeAction(collection, oldAttribute, replaceColumnAction);
      const secondChildAttributeAction = createSecondChildAttributeAction(collection, oldAttribute, childNames[1], parentAttributeAction);
      const firstChildAttributeAction = createFirstChildAttributeAction(collection, oldAttribute, childNames[0], secondChildAttributeAction);

      const deselectAction = new TablesAction.SetCursor({cursor: null});
      return [firstChildAttributeAction, deselectAction];
    })
  );

  @Effect()
  public hideColumn$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.HideColumn>(TablesActionType.HIDE_COLUMN),
    mergeMap(action => this.getLatestTable(action)),
    map(({action, table}) => {
      const part: TablePart = table.parts[action.payload.cursor.partIndex];
      const {parentPath, columnIndex} = splitColumnPath(action.payload.cursor.columnPath);

      const column = findTableColumn(part.columns, action.payload.cursor.columnPath) as TableCompoundColumn;

      const pathBefore = parentPath.concat(columnIndex - 1);
      const columnBefore = columnIndex > 0 ? findTableColumn(part.columns, pathBefore) : null;
      const hiddenBefore: boolean = columnBefore && columnBefore.type === TableColumnType.HIDDEN;

      const columnAfter = findTableColumn(part.columns, parentPath.concat(columnIndex + 1));
      const hiddenAfter: boolean = columnAfter && columnAfter.type === TableColumnType.HIDDEN;

      if (hiddenBefore && hiddenAfter) {
        const mergedColumn = mergeHiddenColumns(columnBefore as TableHiddenColumn, columnAfter as TableHiddenColumn);
        const hiddenColumn = extendHiddenColumn(mergedColumn, column.parent.attributeId);
        return new TablesAction.ReplaceColumns({
          cursor: {...action.payload.cursor, columnPath: pathBefore},
          deleteCount: 3,
          columns: [hiddenColumn]
        });
      }
      if (hiddenBefore && !hiddenAfter) {
        const hiddenColumn = extendHiddenColumn(columnBefore as TableHiddenColumn, column.parent.attributeId);
        return new TablesAction.ReplaceColumns({
          cursor: {...action.payload.cursor, columnPath: pathBefore},
          deleteCount: 2,
          columns: [hiddenColumn]
        });
      }
      if (!hiddenBefore && hiddenAfter) {
        const hiddenColumn = extendHiddenColumn(columnAfter as TableHiddenColumn, column.parent.attributeId);
        return new TablesAction.ReplaceColumns({
          cursor: action.payload.cursor,
          deleteCount: 2,
          columns: [hiddenColumn]
        });
      }
      const hiddenColumn = new TableHiddenColumn([column.parent.attributeId]);
      return new TablesAction.ReplaceColumns({
        cursor: action.payload.cursor,
        deleteCount: 1,
        columns: [hiddenColumn]
      });
    })
  );

  @Effect()
  public showColumns$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.ShowColumns>(TablesActionType.SHOW_COLUMNS),
    mergeMap(action => this.getLatestTable(action)),
    map(({action, table}) => {
      const part: TablePart = table.parts[action.payload.cursor.partIndex];
      return {action, part};
    }),
    mergeMap(({action, part}) => {
      if (part.collectionId) {
        return this.store$.select(selectCollectionById(part.collectionId)).pipe(
          first(),
          map(collection => ({action, part, attributes: collection.attributes}))
        );
      }
      if (part.linkTypeId) {
        return this.store$.select(selectLinkTypeById(part.linkTypeId)).pipe(
          first(),
          map(collection => ({action, part, attributes: collection.attributes}))
        );
      }
    }),
    map(({action, part, attributes}) => {
      const hiddenColumn = findTableColumn(part.columns, action.payload.cursor.columnPath) as TableHiddenColumn;

      const columns = createTableColumnsBySiblingAttributeIds(attributes, action.payload.attributeIds);

      const attributeIds = getArrayDifference(hiddenColumn.attributeIds, action.payload.attributeIds);
      if (attributeIds.length > 0) {
        const updatedHiddenColumn: TableHiddenColumn = {...hiddenColumn, attributeIds};
        columns.push(updatedHiddenColumn);
      }

      return new TablesAction.ReplaceColumns({
        cursor: action.payload.cursor,
        deleteCount: 1,
        columns
      });
    })
  );

  @Effect()
  public removeColumn$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.RemoveColumn>(TablesActionType.REMOVE_COLUMN),
    mergeMap(action => this.store$.select(selectTableById(action.payload.cursor.tableId)).pipe(
      first(),
      map(table => ({action, table}))
    )),
    flatMap(({action, table}) => {
      const part: TablePart = table.parts[action.payload.cursor.partIndex];
      const column = findTableColumn(part.columns, action.payload.cursor.columnPath);
      const attributeId = getAttributeIdFromColumn(column);

      return [
        new TablesAction.ReplaceColumns({cursor: action.payload.cursor, deleteCount: 1}),
        new CollectionsAction.RemoveAttribute({collectionId: part.collectionId, attributeId})
      ];
    })
  );

  @Effect()
  public resizeColumn$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.ResizeColumn>(TablesActionType.RESIZE_COLUMN),
    mergeMap(action => this.store$.select(selectTableById(action.payload.cursor.tableId)).pipe(
      first(),
      map(table => {
        const part: TablePart = table.parts[action.payload.cursor.partIndex];
        const column = findTableColumn(part.columns, action.payload.cursor.columnPath) as TableCompoundColumn;
        const resizedColumn = resizeLastColumnChild(column, action.payload.delta);

        return new TablesAction.ReplaceColumns({
          cursor: action.payload.cursor,
          deleteCount: 1,
          columns: [resizedColumn]
        });
      })
    ))
  );

  @Effect()
  public initColumn$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.InitColumn>(TablesActionType.INIT_COLUMN),
    mergeMap(action => this.store$.select(selectTableById(action.payload.cursor.tableId)).pipe(
      first(),
      map(table => {
        const part: TablePart = table.parts[action.payload.cursor.partIndex];
        const column = findTableColumn(part.columns, action.payload.cursor.columnPath) as TableCompoundColumn;
        const parent = {...column.parent, attributeId: action.payload.attributeId};
        const initializedColumn = {...column, parent};

        return new TablesAction.ReplaceColumns({
          cursor: action.payload.cursor,
          deleteCount: 1,
          columns: [initializedColumn]
        });
      })
    ))
  );

  @Effect()
  public collapseRows$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.CollapseRows>(TablesActionType.COLLAPSE_ROWS),
    mergeMap(action => this.getLatestTable(action)),
    mergeMap(({action, table}) => {
      const {cursor} = action.payload;

      const row = findTableRow(table.rows, cursor.rowPath);
      if (!row) {
        return [];
      }

      const updatedRow: TableRow = {...row, linkedRows: [], expanded: false};
      return [new TablesAction.ReplaceRows({cursor, rows: [updatedRow], deleteCount: 1})];
    })
  );

  @Effect()
  public expandRows$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.ExpandRows>(TablesActionType.EXPAND_ROWS),
    mergeMap(action => this.getLatestTable(action)),
    mergeMap(({action, table}) => {
      const {cursor} = action.payload;

      const row = findTableRow(table.rows, cursor.rowPath);
      if (!row) {
        return [];
      }

      const updatedRow: TableRow = {...row, linkedRows: [], expanded: true};

      return [new TablesAction.ReplaceRows({cursor, rows: [updatedRow], deleteCount: 1})];
    })
  );

  @Effect()
  public setCursor$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.SetCursor>(TablesActionType.SET_CURSOR),
    mergeMap(action => {
      if (action.payload.cursor) {
        return this.getLatestTable(action);
      }
      return this.store$.select(selectTableBySelectedCursor).pipe(
        first(),
        map(table => ({action, table}))
      );
    }),
    filter(({action, table}) => !!table),
    mergeMap(({action, table}) => {
      const {cursor} = action.payload;
      const actions: Action[] = [new TablesAction.SetCursorSuccess({cursor})];
      if (table.parts.length > 1) {
        return actions;
      }

      if (!cursor) {
        const lastRowIndex = table.rows.length - 1;
        const lastRow = table.rows[lastRowIndex];
        if (lastRowIndex > 0 && lastRow && lastRow.documentIds.length === 0) {
          actions.push(new TablesAction.ReplaceRows({
            cursor: {
              tableId: table.id,
              partIndex: 0,
              rowPath: [lastRowIndex]
            },
            deleteCount: 1,
            rows: []
          }));
        }

        const {columns} = table.parts[0];
        const lastColumnIndex = columns.length - 1;
        const lastColumn = columns[lastColumnIndex];
        if (lastColumnIndex > 0 && lastColumn && lastColumn.type === TableColumnType.COMPOUND && !(lastColumn as TableCompoundColumn).parent.attributeId) {
          actions.push(new TablesAction.ReplaceColumns({
            cursor: {
              tableId: table.id,
              partIndex: 0,
              columnPath: [lastColumnIndex]
            },
            deleteCount: 1
          }));
        }

        return actions;
      }

      const part: TablePart = table.parts[cursor.partIndex];
      if (isLastTableColumn(cursor, part)) {
        const index = cursor.columnPath ? cursor.columnPath[0] : cursor.columnIndex;
        const lastColumn = part.columns[index];
        if (lastColumn && lastColumn.type === TableColumnType.COMPOUND && (lastColumn as TableCompoundColumn).parent.attributeId) {
          const nextCursor = {...cursor, columnPath: [index + 1]};
          actions.push(new TablesAction.AddColumn({cursor: nextCursor}));
        }
      }
      if (isLastTableRow(cursor, table)) {
        const row: TableRow = table.rows[cursor.rowPath[0]];
        if (row.documentIds.length > 0) {
          actions.push(new TablesAction.AddRows({
            cursor: {
              tableId: cursor.tableId,
              partIndex: cursor.partIndex,
              rowPath: [cursor.rowPath[0] + 1]
            },
            rows: [EMPTY_TABLE_ROW]
          }));
        }
      }

      return actions;
    })
  );

  @Effect()
  public moveCursor$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.MoveCursor>(TablesActionType.MOVE_CURSOR),
    withLatestFrom(this.store$.select(selectTableCursor).pipe(
      filter(cursor => !!cursor)
    )),
    concatMap(([action, cursor]) => this.store$.select(selectTableById(cursor.tableId)).pipe(
      first(),
      map(table => ({action, cursor, table}))
    )),
    map(({action, cursor, table}) => {
      const nextCursor = moveTableCursor(table, cursor, action.payload.direction);
      return new TablesAction.SetCursor({cursor: nextCursor});
    })
  );

  public constructor(private actions$: Actions,
                     private store$: Store<AppState>) {
  }

  private getLatestTable<A extends TablesAction.TableCursorAction>(action: A): Observable<{ action: A, table: TableModel }> {
    return this.store$.select(selectTableById(action.payload.cursor.tableId)).pipe(
      first(),
      map(table => ({action, table}))
    );
  }

  private createViewCursorFromTable(table: TableModel, cursor: TableCursor): Observable<ViewCursor> {
    if (!cursor || !cursor.rowPath) {
      return Observable.of(null);
    }

    const part = table.parts[cursor.partIndex];
    if (!part.collectionId) {
      return Observable.of(null);
    }

    const column = part.columns[cursor.columnIndex];
    if (column.type !== TableColumnType.COMPOUND) {
      return Observable.of(null);
    }

    const {attributeId} = (column as TableCompoundColumn).parent;
    const row = findTableRow(table.rows, cursor.rowPath);
    if (row.documentIds.length !== 1) {
      return Observable.of(null);
    }

    if (cursor.rowPath.length > 1) {
      const linkedRow = findTableRow(table.rows, cursor.rowPath);
      const {linkTypeId} = table.parts[cursor.partIndex - 1];
      const linkedDocumentId = linkedRow.documentIds[0];
      return this.store$.select(selectLinkInstancesByTypeAndDocuments(linkTypeId, [linkedDocumentId])).pipe(
        first(),
        map(linkInstances => ({
          linkInstanceId: linkInstances.length ? linkInstances[0].id : null,
          collectionId: part.collectionId,
          documentId: row.documentIds[0],
          attributeId
        }))
      );
    }

    return Observable.of({
      collectionId: part.collectionId,
      documentId: row.documentIds[0],
      attributeId
    });
  }
}

function createReplaceColumnAction(splitAction: TablesAction.SplitColumn,
                                   oldColumn: TableCompoundColumn,
                                   childNames: string[]): TablesAction.ReplaceColumns {
  const parent = oldColumn.parent;
  const children: TableColumn[] = childNames.map(name => {
    return new TableCompoundColumn(new TableSingleColumn(`${parent.attributeId}.${name}`), []);
  });
  const column: TableCompoundColumn = new TableCompoundColumn(parent, children);

  return new TablesAction.ReplaceColumns({cursor: splitAction.payload.cursor, deleteCount: 1, columns: [column]});
}

function createParentAttributeAction(collection: CollectionModel,
                                     oldAttribute: AttributeModel,
                                     nextAction: TablesAction.ReplaceColumns): CollectionsAction.ChangeAttribute {
  return new CollectionsAction.ChangeAttribute({
    collectionId: collection.id,
    attributeId: oldAttribute.id,
    attribute: {
      id: oldAttribute.id,
      name: oldAttribute.name,
      constraints: []
    },
    nextAction
  });
}

function createSecondChildAttributeAction(collection: CollectionModel,
                                          oldAttribute: AttributeModel,
                                          name: string,
                                          nextAction: CollectionsAction.ChangeAttribute): CollectionsAction.ChangeAttribute {
  return new CollectionsAction.ChangeAttribute({
    collectionId: collection.id,
    attributeId: `${oldAttribute.id}.${name}`,
    attribute: {
      id: `${oldAttribute.id}.${name}`,
      name,
      constraints: []
    },
    nextAction
  });
}

function createFirstChildAttributeAction(collection: CollectionModel,
                                         oldAttribute: AttributeModel,
                                         name: string,
                                         nextAction: CollectionsAction.ChangeAttribute): CollectionsAction.ChangeAttribute {
  return new CollectionsAction.ChangeAttribute({
    collectionId: collection.id,
    attributeId: `${oldAttribute.id}.${name}`,
    attribute: {...oldAttribute, id: `${oldAttribute.id}.${name}`, name},
    nextAction
  });
}
