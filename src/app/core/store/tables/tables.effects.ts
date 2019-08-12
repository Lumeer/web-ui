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

import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Action, select, Store} from '@ngrx/store';
import {combineLatest, Observable, of} from 'rxjs';
import {
  concatMap,
  debounceTime,
  distinctUntilChanged,
  filter,
  first,
  flatMap,
  map,
  mergeMap,
  switchMap,
  take,
  withLatestFrom,
} from 'rxjs/operators';
import {Direction} from '../../../shared/direction';
import {CollectionPermissionsPipe} from '../../../shared/pipes/permissions/collection-permissions.pipe';
import {getArrayDifference} from '../../../shared/utils/array.utils';
import {AppState} from '../app.state';
import {Attribute, Collection} from '../collections/collection';
import {CollectionsAction} from '../collections/collections.action';
import {
  selectCollectionById,
  selectCollectionsDictionary,
  selectCollectionsLoaded,
} from '../collections/collections.state';
import {
  selectDocumentsByCustomQuery,
  selectDocumentsByQuery,
  selectDocumentsByQueryAndIds,
} from '../common/permissions.selectors';
import {DocumentModel} from '../documents/document.model';
import {DocumentsAction} from '../documents/documents.action';
import {selectDocumentsDictionary} from '../documents/documents.state';
import {FileAttachmentsAction} from '../file-attachments/file-attachments.action';
import {getOtherDocumentIdFromLinkInstance} from '../link-instances/link-instance.utils';
import {LinkInstancesAction} from '../link-instances/link-instances.action';
import {
  selectLinkInstancesByTypeAndDocuments,
  selectLinkInstancesDictionary,
} from '../link-instances/link-instances.state';
import {LinkTypeHelper} from '../link-types/link-type.helper';
import {LinkTypesAction} from '../link-types/link-types.action';
import {selectLinkTypeById, selectLinkTypesDictionary, selectLinkTypesLoaded} from '../link-types/link-types.state';
import {selectQuery, selectViewCode} from '../navigation/navigation.state';
import {Query} from '../navigation/query';
import {convertQueryModelToString} from '../navigation/query.converter';
import {isSingleCollectionQuery, queryWithoutLinks} from '../navigation/query.util';
import {RouterAction} from '../router/router.action';
import {ViewCursor} from '../views/view';
import {ViewsAction} from '../views/views.action';
import {moveTableCursor, TableBodyCursor, TableCursor} from './table-cursor';
import {
  DEFAULT_TABLE_ID,
  TableColumnType,
  TableConfigColumn,
  TableConfigPart,
  TableConfigRow,
  TableModel,
} from './table.model';
import {
  addMissingTableColumns,
  areTableColumnsListsEqual,
  createCollectionPart,
  createEmptyColumn,
  createEmptyTableRow,
  createLinkPart,
  createTableColumnsBySiblingAttributeIds,
  createTableRow,
  extendHiddenColumn,
  filterTableColumnsByAttributes,
  filterTableRowsByDepth,
  findTableColumn,
  findTableRow,
  getAttributeIdFromColumn,
  initializeExistingTableColumns,
  mergeHiddenColumns,
  resizeLastColumnChild,
  splitColumnPath,
  splitRowPath,
} from './table.utils';
import {TablesAction, TablesActionType} from './tables.action';
import {
  selectMoveTableCursorDown,
  selectTableById,
  selectTableCursor,
  selectTablePart,
  selectTableRow,
  selectTableRows,
  selectTableRowsWithHierarchyLevels,
} from './tables.selector';
import {
  filterNewlyCreatedDocuments,
  filterNewlyCreatedLinkInstances,
  filterUnknownDocuments,
  filterUnknownLinkInstances,
} from './utils/table-row-sync.utils';
import {findLinkedTableRows, findTableRowsIncludingCollapsed, isLastTableRowInitialized} from './utils/table-row.utils';

@Injectable()
export class TablesEffects {
  @Effect()
  public createTable$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.CreateTable>(TablesActionType.CREATE_TABLE),
    filter(action => isSingleCollectionQuery(action.payload.query)),
    withLatestFrom(
      this.store$.pipe(
        select(selectCollectionsLoaded),
        filter(loaded => loaded),
        mergeMap(() => this.store$.select(selectCollectionsDictionary))
      ),
      this.store$.pipe(
        select(selectLinkTypesLoaded),
        filter(loaded => loaded),
        mergeMap(() => this.store$.select(selectLinkTypesDictionary))
      ),
      this.store$.pipe(select(selectDocumentsByQuery)),
      this.store$.pipe(select(selectViewCode))
    ),
    mergeMap(([action, collectionsMap, linkTypesMap, documents, viewCode]) => {
      const {config, query, tableId} = action.payload;

      const queryStem = query.stems[0];
      const primaryCollection = collectionsMap[queryStem.collectionId];
      const linkTypeIds = queryStem.linkTypeIds || [];

      let lastCollectionId = queryStem.collectionId;
      const parts: TableConfigPart[] = [
        createCollectionPart(primaryCollection, 0, !viewCode && linkTypeIds.length === 0, config),
      ];

      linkTypeIds.forEach((linkTypeId, index) => {
        const linkType = linkTypesMap[linkTypeId];
        const linkTypePart = createLinkPart(linkType, index * 2 + 1, action.payload.config);

        const collectionId = LinkTypeHelper.getOtherCollectionId(linkType, lastCollectionId);
        const collection = collectionsMap[collectionId];
        const collectionPart = createCollectionPart(
          collection,
          index * 2 + 2,
          !viewCode && index === linkTypeIds.length - 1,
          config
        );

        lastCollectionId = collectionId;

        parts.push(linkTypePart, collectionPart);
      });

      const documentIds = (documents || []).map(document => document.id);
      const rows = filterTableRowsByDepth(
        (config && config.rows) || [createEmptyTableRow()],
        Math.round(parts.length / 2),
        documentIds
      );

      const actions: Action[] = [];
      actions.push(
        new TablesAction.AddTable({
          table: {
            id: action.payload.tableId,
            config: {parts, rows},
          },
        })
      );

      actions.push(new DocumentsAction.Get({query}), new LinkInstancesAction.Get({query}));

      // if the table is embedded, file attachments are not loaded by guard
      if (tableId !== DEFAULT_TABLE_ID) {
        actions.push(new FileAttachmentsAction.GetByQuery({query}));
      }

      return actions;
    })
  );

  @Effect()
  public destroyTable$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.DestroyTable>(TablesActionType.DESTROY_TABLE),
    mergeMap(action =>
      combineLatest(
        this.store$.select(selectTableById(action.payload.tableId)),
        this.store$.select(selectTableCursor)
      ).pipe(first())
    ),
    filter(([table]) => !!table),
    mergeMap(([table, tableCursor]) => {
      if (tableCursor && tableCursor.tableId === table.id) {
        return this.createViewCursorFromTable(table, tableCursor).pipe(map(viewCursor => ({table, viewCursor})));
      }
      return of({table, viewCursor: null});
    }),
    flatMap(({table, viewCursor}) => {
      const actions: Action[] = [new TablesAction.RemoveTable({tableId: table.id})];

      if (table.id === DEFAULT_TABLE_ID) {
        actions.push(new ViewsAction.SetCursor({cursor: viewCursor}));
      }

      return actions;
    })
  );

  @Effect()
  public createPart$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.CreatePart>(TablesActionType.CREATE_PART),
    mergeMap(action =>
      this.store$.select(selectTableById(action.payload.tableId)).pipe(
        first(),
        filter(table => !!table),
        mergeMap(table =>
          this.store$.select(selectLinkTypeById(action.payload.linkTypeId)).pipe(
            first(),
            mergeMap(linkType => {
              const {parts} = table.config;
              const lastPart = parts[parts.length - 1];

              const collectionId = LinkTypeHelper.getOtherCollectionId(linkType, lastPart.collectionId);
              return this.store$.select(selectCollectionById(collectionId)).pipe(
                first(),
                mergeMap(collection => {
                  const lastPartIndex = table.config.parts.length - 1;
                  const linkTypePart = createLinkPart(linkType, lastPartIndex + 1, action.payload.config);
                  const collectionPart = createCollectionPart(
                    collection,
                    lastPartIndex + 2,
                    action.payload.last,
                    action.payload.config
                  );

                  const query: Query = {
                    stems: [{collectionId: collection.id, linkTypeIds: [linkType.id]}],
                  };

                  return [
                    new TablesAction.RemoveEmptyColumns({
                      cursor: {tableId: table.id, partIndex: lastPartIndex},
                    }),
                    new TablesAction.AddPart({
                      tableId: table.id,
                      parts: [linkTypePart, collectionPart],
                    }),
                    // TODO get data only in guards
                    new DocumentsAction.Get({query}),
                    new LinkInstancesAction.Get({query}),
                  ];
                })
              );
            })
          )
        )
      )
    )
  );

  @Effect()
  public switchParts$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.SwitchParts>(TablesActionType.SWITCH_PARTS),
    mergeMap(action => this.getLatestTable(action)),
    filter(({action, table}) => table.config.parts.length === 3),
    withLatestFrom(this.store$.select(selectQuery)),
    mergeMap(([{action, table}, query]) => {
      const linkTypeIds = [table.config.parts[1].linkTypeId];
      const collectionId = table.config.parts[2].collectionId;

      const newQuery: Query = {...query, stems: [{collectionId, linkTypeIds}]};

      return [
        new TablesAction.SetCursor({cursor: null}),
        new RouterAction.Go({
          path: [],
          queryParams: {
            q: convertQueryModelToString(newQuery),
          },
          extras: {
            queryParamsHandling: 'merge',
          },
        }),
      ];
    })
  );

  @Effect()
  public removePart$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.RemovePart>(TablesActionType.REMOVE_PART),
    mergeMap(action => this.getLatestTable(action)),
    withLatestFrom(this.store$.select(selectQuery)),
    map(([{action, table}, query]) => {
      const linkTypeIds = table.config.parts.slice(0, action.payload.cursor.partIndex).reduce((ids, part) => {
        if (part.linkTypeId) {
          ids.push(part.linkTypeId);
        }
        return ids;
      }, []);

      const stem = {...query.stems[0], linkTypeIds};
      const newQuery: Query = {...query, stems: [stem]};

      return new RouterAction.Go({
        path: [],
        queryParams: {
          q: convertQueryModelToString(newQuery),
        },
        extras: {
          queryParamsHandling: 'merge',
        },
      });
    })
  );

  @Effect()
  public addColumn$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.AddColumn>(TablesActionType.ADD_COLUMN),
    mergeMap(action => this.getLatestTable(action)),
    mergeMap(({action, table}) =>
      this.createNewEmptyColumn(table, action.payload.cursor).pipe(
        map(
          column =>
            new TablesAction.ReplaceColumns({
              cursor: action.payload.cursor,
              deleteCount: 0,
              columns: [column],
            })
        )
      )
    )
  );

  private createNewEmptyColumn(table: TableModel, cursor: TableCursor): Observable<TableConfigColumn> {
    const part = table.config.parts[cursor.partIndex];
    const columns = part.columns;

    return this.getLatestAttributes(part).pipe(
      map(attributes => {
        const parentColumn =
          cursor.columnPath.length > 1 ? findTableColumn(columns, cursor.columnPath.slice(0, -1)) : null;
        const parentAttributeId = parentColumn && parentColumn.attributeIds[0];
        const parentAttribute = attributes.find(attribute => attribute.id === parentAttributeId);
        const parentName = parentAttribute ? parentAttribute.name : null;

        return createEmptyColumn(attributes, columns, parentName);
      })
    );
  }

  private getLatestAttributes(part: TableConfigPart): Observable<Attribute[]> {
    if (part.collectionId) {
      return this.store$.select(selectCollectionById(part.collectionId)).pipe(
        first(),
        map(collection => collection.attributes)
      );
    } else {
      return this.store$.select(selectLinkTypeById(part.linkTypeId)).pipe(
        first(),
        map(linkType => linkType.attributes)
      );
    }
  }

  @Effect()
  public splitColumn$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.SplitColumn>(TablesActionType.SPLIT_COLUMN),
    mergeMap(action =>
      this.store$.select(selectTableById(action.payload.cursor.tableId)).pipe(
        first(),
        mergeMap(table => {
          const part = table.config.parts[action.payload.cursor.partIndex];
          return this.store$.select(selectCollectionById(part.collectionId)).pipe(
            // TODO linktype as well
            first(),
            map(collection => ({action, part, collection}))
          );
        })
      )
    ),
    flatMap(({action, part, collection}) => {
      const childNames = ['A', 'B'];

      const {cursor} = action.payload;
      const column = findTableColumn(part.columns, cursor.columnPath);

      const oldAttribute = collection.attributes.find(attribute => attribute.id === column.attributeIds[0]);

      const replaceColumnAction = createReplaceColumnAction(action, column, oldAttribute.name, childNames);
      const parentAttributeAction = createParentAttributeAction(collection, oldAttribute, replaceColumnAction);
      const secondChildAttributeAction = createSecondChildAttributeAction(
        collection,
        oldAttribute,
        childNames[1],
        parentAttributeAction
      );
      const firstChildAttributeAction = createFirstChildAttributeAction(
        collection,
        oldAttribute,
        childNames[0],
        secondChildAttributeAction
      );

      return [firstChildAttributeAction, new TablesAction.SetCursor({cursor: null})];
    })
  );

  @Effect()
  public hideColumn$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.HideColumn>(TablesActionType.HIDE_COLUMN),
    mergeMap(action => this.getLatestTable(action)),
    mergeMap(({action, table}) => {
      const {cursor} = action.payload;
      const part: TableConfigPart = table.config.parts[cursor.partIndex];
      const {parentPath, columnIndex} = splitColumnPath(cursor.columnPath);

      const column = findTableColumn(part.columns, cursor.columnPath);

      const pathBefore = parentPath.concat(columnIndex - 1);
      const columnBefore = columnIndex > 0 ? findTableColumn(part.columns, pathBefore) : null;
      const hiddenBefore: boolean = columnBefore && columnBefore.type === TableColumnType.HIDDEN;

      const columnAfter = findTableColumn(part.columns, parentPath.concat(columnIndex + 1));
      const hiddenAfter: boolean = columnAfter && columnAfter.type === TableColumnType.HIDDEN;

      const actions: Action[] = [];

      if (hiddenBefore && hiddenAfter) {
        const mergedColumn = mergeHiddenColumns(columnBefore, columnAfter);
        actions.push(
          new TablesAction.ReplaceColumns({
            cursor: {...cursor, columnPath: pathBefore},
            deleteCount: 3,
            columns: [extendHiddenColumn(mergedColumn, column.attributeIds[0])],
          })
        );
      }
      if (hiddenBefore && !hiddenAfter) {
        actions.push(
          new TablesAction.ReplaceColumns({
            cursor: {...cursor, columnPath: pathBefore},
            deleteCount: 2,
            columns: [extendHiddenColumn(columnBefore, column.attributeIds[0])],
          })
        );
      }
      if (!hiddenBefore && hiddenAfter) {
        actions.push(
          new TablesAction.ReplaceColumns({
            cursor,
            deleteCount: 2,
            columns: [extendHiddenColumn(columnAfter, column.attributeIds[0])],
          })
        );
      }
      if (!hiddenBefore && !hiddenAfter) {
        actions.push(
          new TablesAction.ReplaceColumns({
            cursor,
            deleteCount: 1,
            columns: [
              {
                type: TableColumnType.HIDDEN,
                attributeIds: [...column.attributeIds],
              },
            ],
          })
        );
      }

      return actions;
    })
  );

  @Effect()
  public showColumns$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.ShowColumns>(TablesActionType.SHOW_COLUMNS),
    mergeMap(action => this.getLatestTable(action)),
    mergeMap(({action, table}) => {
      const part = table.config.parts[action.payload.cursor.partIndex];
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
      const {cursor, attributeIds} = action.payload;

      const hiddenColumn = findTableColumn(part.columns, cursor.columnPath);

      const columns = createTableColumnsBySiblingAttributeIds(attributes, attributeIds);

      const hiddenAttributeIds = getArrayDifference(hiddenColumn.attributeIds, attributeIds);
      if (hiddenAttributeIds.length > 0) {
        const updatedHiddenColumn: TableConfigColumn = {...hiddenColumn, attributeIds: hiddenAttributeIds};
        columns.push(updatedHiddenColumn);
      }

      return new TablesAction.ReplaceColumns({
        cursor: action.payload.cursor,
        deleteCount: 1,
        columns,
      });
    })
  );

  @Effect()
  public removeColumn$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.RemoveColumn>(TablesActionType.REMOVE_COLUMN),
    mergeMap(action =>
      this.store$.select(selectTableById(action.payload.cursor.tableId)).pipe(
        first(),
        flatMap(table => {
          const {cursor} = action.payload;
          const part = table.config.parts[cursor.partIndex];
          const column = findTableColumn(part.columns, cursor.columnPath);
          const attributeId = getAttributeIdFromColumn(column);

          const actions: Action[] = [new TablesAction.ReplaceColumns({cursor, deleteCount: 1})];
          if (attributeId && part.collectionId) {
            actions.push(new CollectionsAction.RemoveAttribute({collectionId: part.collectionId, attributeId}));
          }
          if (attributeId && part.linkTypeId) {
            actions.push(new LinkTypesAction.DeleteAttribute({linkTypeId: part.linkTypeId, attributeId}));
          }
          return actions;
        })
      )
    )
  );

  @Effect()
  public resizeColumn$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.ResizeColumn>(TablesActionType.RESIZE_COLUMN),
    mergeMap(action => this.getLatestTable(action)),
    map(({action, table}) => {
      const {cursor} = action.payload;
      const part = table.config.parts[cursor.partIndex];
      const column = findTableColumn(part.columns, cursor.columnPath);
      const resizedColumn = resizeLastColumnChild(column, action.payload.delta);

      return new TablesAction.ReplaceColumns({
        cursor,
        deleteCount: 1,
        columns: [resizedColumn],
      });
    })
  );

  @Effect()
  public syncColumns$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.SyncColumns>(TablesActionType.SYNC_COLUMNS),
    mergeMap(action => {
      const {cursor} = action.payload;
      return this.store$.pipe(
        select(selectTablePart(cursor)),
        filter(part => !!part),
        take(1),
        withLatestFrom(this.store$.pipe(select(selectTableById(cursor.tableId)))),
        mergeMap(([part, table]: [TableConfigPart, TableModel]) =>
          this.store$.pipe(
            select(part.collectionId ? selectCollectionById(part.collectionId) : selectLinkTypeById(part.linkTypeId)),
            filter(entity => !!entity),
            take(1),
            withLatestFrom(this.store$.pipe(select(selectViewCode))),
            mergeMap(([entity, viewCode]) => {
              const filteredColumns = filterTableColumnsByAttributes(part.columns, entity.attributes);
              const initializedColumns = initializeExistingTableColumns(filteredColumns, entity.attributes);
              const columns = addMissingTableColumns(initializedColumns, entity.attributes, !!viewCode);

              const lastColumn = columns[columns.length - 1];
              const lastPartIndex = table.config.parts.length - 1;
              if (!viewCode && cursor.partIndex === lastPartIndex && (!lastColumn || lastColumn.attributeIds.length)) {
                columns.push(createEmptyColumn(entity.attributes, columns));
              }

              if (areTableColumnsListsEqual(part.columns, columns)) {
                return [];
              }

              // TODO double check if deletion works as expected
              return [new TablesAction.UpdateColumns({cursor, columns})];
            })
          )
        )
      );
    })
  );

  @Effect()
  public syncPrimaryRows$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.SyncPrimaryRows>(TablesActionType.SYNC_PRIMARY_ROWS),
    debounceTime(100), // otherwise unwanted parallel syncing occurs
    switchMap(action =>
      combineLatest(
        this.store$.pipe(select(selectTableById(action.payload.cursor.tableId))),
        this.store$.pipe(select(selectDocumentsByCustomQuery(queryWithoutLinks(action.payload.query), false, true))),
        this.store$.pipe(select(selectMoveTableCursorDown))
      ).pipe(
        first(),
        filter(([table]) => !!table),
        mergeMap(([table, documents, moveCursorDown]) => {
          const {collectionId} = table.config.parts[0];
          return this.store$.pipe(
            select(selectCollectionById(collectionId)),
            mergeMap(collection => this.collectionPermissionsPipe.transform(collection)),
            map(permissions => permissions.write || permissions.writeWithView),
            distinctUntilChanged(),
            mergeMap(canCreateDocuments => {
              const {cursor} = action.payload;
              const {rows} = table.config;

              const createdDocuments = filterNewlyCreatedDocuments(rows, documents);
              const unknownDocuments = filterUnknownDocuments(rows, documents);

              const actions: Action[] = [];

              if (createdDocuments.length > 0) {
                actions.push(
                  new TablesAction.InitRows({
                    cursor: {...cursor, rowPath: []},
                    documents: createdDocuments,
                    linkInstances: [],
                  })
                );
                if (moveCursorDown) {
                  actions.push(new TablesAction.MoveCursor({direction: Direction.Down}));
                }
              }

              const documentIds = new Set(documents.map(doc => doc.id));
              if (rows.some(row => row.documentId && !documentIds.has(row.documentId))) {
                actions.push(new TablesAction.CleanRows({cursor, documents, linkInstances: []}));
              }

              if (unknownDocuments.length > 0) {
                actions.push(
                  new TablesAction.AddPrimaryRows({
                    cursor,
                    rows: unknownDocuments.map(document => createTableRow(document)),
                    append: true,
                  })
                );
              }

              // add last empty row if user has write permissions
              if ((isLastTableRowInitialized(rows) || rows.length === 0) && canCreateDocuments) {
                actions.push(
                  new TablesAction.AddPrimaryRows({
                    cursor,
                    rows: [createEmptyTableRow()],
                    append: true,
                  })
                );
              }

              // remove last empty row when user loses write permissions
              if (
                !isLastTableRowInitialized(rows) &&
                !canCreateDocuments &&
                rows.length > 0 &&
                createdDocuments.length === 0 &&
                unknownDocuments.length === 0
              ) {
                actions.push(new TablesAction.RemoveRow({cursor: {...cursor, rowPath: [rows.length - 1]}}));
              }

              return actions.concat(new TablesAction.OrderPrimaryRows({cursor, documents}));
            })
          );
        })
      )
    )
  );

  @Effect()
  public syncLinkedRows$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.SyncLinkedRows>(TablesActionType.SYNC_LINKED_ROWS),
    mergeMap(action => {
      const {cursor} = action.payload;
      return combineLatest(
        this.store$.pipe(select(selectTablePart(cursor))),
        this.store$.pipe(select(selectTableRows(cursor.tableId)))
      ).pipe(
        take(1),
        filter(([part]) => !!part),
        mergeMap(([part, rows]) => {
          const rowsWithPath = findTableRowsIncludingCollapsed(rows, cursor.rowPath);
          const rowDocumentIds = rowsWithPath
            .map(rowWithPath => rowWithPath.row.documentId)
            .filter(documentId => !!documentId);
          if (rowDocumentIds.length === 0) {
            return [];
          }

          const linkedRows = findLinkedTableRows(rows, cursor.rowPath);
          return this.store$.pipe(
            select(selectLinkInstancesByTypeAndDocuments(part.linkTypeId, rowDocumentIds)),
            take(1),
            mergeMap(linkInstances => {
              const documentIds = linkInstances.reduce((ids, linkInstance) => {
                const documentId = getOtherDocumentIdFromLinkInstance(linkInstance, ...rowDocumentIds);
                if (!ids.includes(documentId)) {
                  ids.push(documentId);
                }
                return ids;
              }, []);
              return this.store$.pipe(
                select(selectDocumentsByQueryAndIds(documentIds)),
                take(1),
                map(documents =>
                  documents.map(document => {
                    const linkInstance = linkInstances.find(link => link.documentIds.includes(document.id));
                    return {
                      ...document,
                      correlationId: document.correlationId || (linkInstance && linkInstance.correlationId),
                    };
                  })
                ),
                mergeMap(documents => {
                  const createdLinkInstances = filterNewlyCreatedLinkInstances(linkedRows, linkInstances);
                  const unknownLinkInstances = filterUnknownLinkInstances(linkedRows, linkInstances);

                  const actions: Action[] = [];

                  if (createdLinkInstances.length > 0) {
                    actions.push(new TablesAction.InitLinkedRows({cursor, linkInstances}));
                  }

                  if (unknownLinkInstances.length > 0) {
                    rowsWithPath.forEach(rowWithPath => {
                      const addedLinkedRows = unknownLinkInstances
                        .filter(linkInstance => linkInstance.documentIds.includes(rowWithPath.row.documentId))
                        .reduce((newRows, linkInstance) => {
                          const document = documents.find(doc => linkInstance.documentIds.includes(doc.id));
                          if (document) {
                            newRows.push(createTableRow(document, linkInstance));
                          }
                          return newRows;
                        }, []);

                      if (addedLinkedRows.length === 0) {
                        return;
                      }

                      actions.push(
                        new TablesAction.AddLinkedRows({
                          cursor: {...cursor, rowPath: rowWithPath.path},
                          linkedRows: addedLinkedRows,
                          append: true,
                        })
                      );
                    });
                  }

                  return actions;
                })
              );
            })
          );
        })
      );
    })
  );

  @Effect()
  public cloneRow$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.CloneRow>(TablesActionType.CLONE_ROW),
    mergeMap(action => {
      const {cursor} = action.payload;
      return this.store$.pipe(
        select(selectTableRow(cursor)),
        take(1),
        filter(row => row && !!row.documentId),
        withLatestFrom(
          this.store$.pipe(select(selectDocumentsDictionary)),
          this.store$.pipe(select(selectLinkInstancesDictionary))
        ),
        mergeMap(([row, documentsMap, linkInstancesMap]) => {
          const document = documentsMap[row.documentId];
          if (!document) {
            return [];
          }

          const emptyRow = createEmptyTableRow();

          const duplicateLinkInstances = (newDocumentId, documents: DocumentModel[]) => {
            const linkInstanceIds = (row.linkedRows || [])
              .map(linkedRow => linkedRow.linkInstanceId)
              .filter(id => id && linkInstancesMap[id]);
            const documentIdsMap = documents.reduce((idsMap, doc) => {
              idsMap[doc.metaData.originalDocumentId] = doc.id;
              return idsMap;
            }, {});

            this.store$.dispatch(
              new LinkInstancesAction.Duplicate({
                originalDocumentId: row.documentId,
                newDocumentId,
                linkInstanceIds,
                documentIdsMap,
              })
            );
          };

          const duplicateLinkedDocuments = (documentId: string) => {
            const linkedDocumentIds = (row.linkedRows || [])
              .map(linkedRow => linkedRow.documentId)
              .filter(id => id && documentsMap[id]);

            if (linkedDocumentIds.length > 0) {
              this.store$.dispatch(
                new DocumentsAction.Duplicate({
                  collectionId: documentsMap[linkedDocumentIds[0]].collectionId,
                  documentIds: linkedDocumentIds,
                  onSuccess: documents => duplicateLinkInstances(documentId, documents),
                })
              );
            }
          };

          return [
            new TablesAction.AddPrimaryRows({cursor: {...cursor, rowPath: [cursor.rowPath[0] + 1]}, rows: [emptyRow]}),
            new DocumentsAction.Duplicate({
              correlationId: emptyRow.correlationId,
              collectionId: document.collectionId,
              documentIds: [document.id],
              onSuccess: documents => duplicateLinkedDocuments(documents[0].id),
            }),
          ];
        })
      );
    })
  );

  @Effect()
  public indentRow$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.IndentRow>(TablesActionType.INDENT_ROW),
    map(action => action.payload.cursor),
    filter(cursor => cursor.partIndex === 0 && cursor.rowPath[0] > 0),
    withLatestFrom(this.store$.pipe(select(selectDocumentsDictionary))),
    mergeMap(([cursor, documentsMap]) =>
      this.store$.pipe(
        select(selectTableRowsWithHierarchyLevels(cursor.tableId)),
        first(),
        map(rows => {
          const rowIndex = cursor.rowPath[0];
          const {row, level} = rows[rowIndex];
          const {row: newParentRow = undefined} =
            rows
              .slice(0, cursor.rowPath[0])
              .reverse()
              .find(hierarchyRow => hierarchyRow.level === level) || {};
          const parentDocumentId = newParentRow && newParentRow.documentId;

          if (row.documentId) {
            const {collectionId, id: documentId} = documentsMap[row.documentId];
            return new DocumentsAction.PatchMetaData({
              collectionId,
              documentId,
              metaData: {parentId: parentDocumentId},
            });
          } else {
            const updatedRow: TableConfigRow = {...row, parentDocumentId};
            return new TablesAction.ReplaceRows({cursor, deleteCount: 1, rows: [updatedRow]});
          }
        })
      )
    )
  );

  @Effect()
  public outdentRow$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.OutdentRow>(TablesActionType.OUTDENT_ROW),
    map(action => action.payload.cursor),
    filter(cursor => cursor.partIndex === 0),
    withLatestFrom(this.store$.pipe(select(selectDocumentsDictionary))),
    mergeMap(([cursor, documentsMap]) =>
      this.store$.pipe(
        select(selectTableRowsWithHierarchyLevels(cursor.tableId)),
        first(),
        map(rows => {
          const rowIndex = cursor.rowPath[0];
          const {row, level} = rows[rowIndex];
          const {row: previousParentRow = undefined} =
            rows
              .slice(0, cursor.rowPath[0])
              .reverse()
              .find(hierarchyRow => hierarchyRow.level === level - 1) || {};
          const previousParentDocument = documentsMap[previousParentRow && previousParentRow.documentId];
          const parentDocumentId =
            (previousParentDocument && previousParentDocument.metaData && previousParentDocument.metaData.parentId) ||
            null;

          if (row.documentId) {
            const {collectionId, id: documentId} = documentsMap[row.documentId];
            return new DocumentsAction.PatchMetaData({
              collectionId,
              documentId,
              metaData: {parentId: parentDocumentId},
            });
          } else {
            const updatedRow: TableConfigRow = {...row, parentDocumentId};
            return new TablesAction.ReplaceRows({cursor, deleteCount: 1, rows: [updatedRow]});
          }
        })
      )
    )
  );

  @Effect()
  public moveRowUp$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.MoveRowUp>(TablesActionType.MOVE_ROW_UP),
    mergeMap(action => {
      const {cursor} = action.payload;
      const {parentPath, rowIndex} = splitRowPath(cursor.rowPath);
      if (rowIndex === 0) {
        return [];
      }

      return combineLatest(
        this.store$.pipe(select(selectTableRows(cursor.tableId))),
        this.store$.pipe(select(selectDocumentsDictionary))
      ).pipe(
        first(),
        mergeMap(([rows, documentsMap]) => {
          const row = findTableRow(rows, cursor.rowPath);
          const document = documentsMap[row && row.documentId];
          const parentId =
            (document && document.metaData && document.metaData.parentId) || (row && row.parentDocumentId) || null;

          const previousCursor: TableBodyCursor = {...cursor, rowPath: parentPath.concat(rowIndex - 1)};
          const previousRow = findTableRow(rows, previousCursor.rowPath);
          const previousDocument = documentsMap[previousRow && previousRow.documentId];
          const previousParentId =
            (previousDocument && previousDocument.metaData && previousDocument.metaData.parentId) ||
            (previousRow && previousRow.parentDocumentId) ||
            null;

          const actions: Action[] = [
            new TablesAction.RemoveRow({cursor}),
            new TablesAction.ReplaceRows({cursor: previousCursor, rows: [row], deleteCount: 0}),
          ];

          if (cursor.partIndex === 0 && parentId !== previousParentId) {
            if (row.documentId) {
              return [
                new DocumentsAction.PatchMetaData({
                  collectionId: document.collectionId,
                  documentId: document.id,
                  metaData: {parentId: previousParentId},
                  onSuccess: () => actions.forEach(a => this.store$.dispatch(a)),
                }),
              ];
            } else {
              return [
                new TablesAction.RemoveRow({cursor}),
                new TablesAction.ReplaceRows({
                  cursor: previousCursor,
                  rows: [{...row, parentDocumentId: previousParentId}],
                  deleteCount: 0,
                }),
              ];
            }
          }

          return actions;
        })
      );
    })
  );

  @Effect()
  public moveRowDown$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.MoveRowDown>(TablesActionType.MOVE_ROW_DOWN),
    mergeMap(action => {
      const {cursor} = action.payload;
      const {parentPath, rowIndex} = splitRowPath(cursor.rowPath);

      return combineLatest(
        this.store$.pipe(select(selectTableRows(cursor.tableId))),
        this.store$.pipe(select(selectTableRowsWithHierarchyLevels(cursor.tableId))),
        this.store$.pipe(select(selectDocumentsDictionary))
      ).pipe(
        first(),
        mergeMap(([rows, hierarchyRows, documentsMap]) => {
          if (cursor.partIndex > 0) {
            const row = findTableRow(rows, cursor.rowPath);
            const nextLinkedCursor: TableBodyCursor = {...cursor, rowPath: parentPath.concat(rowIndex + 1)};
            const nextLinkedRow = findTableRow(rows, nextLinkedCursor.rowPath);
            if (!nextLinkedRow) {
              return [];
            }

            const targetLinkedCursor: TableBodyCursor = {...cursor, rowPath: parentPath.concat(rowIndex + 2)};

            return [
              new TablesAction.ReplaceRows({cursor: targetLinkedCursor, rows: [row], deleteCount: 0}),
              new TablesAction.RemoveRow({cursor}),
            ];
          }

          const sourceRow = hierarchyRows[cursor.rowPath[0]];
          const document = documentsMap[sourceRow && sourceRow.row.documentId];
          const parentId =
            (document && document.metaData && document.metaData.parentId) ||
            (sourceRow && sourceRow.row.parentDocumentId) ||
            null;

          const nextRow = hierarchyRows.slice(rowIndex + 1).find(row => row.level <= sourceRow.level);
          if (!nextRow) {
            return [];
          }

          const targetRowIndex = hierarchyRows.indexOf(nextRow) + 1;
          const targetRow = hierarchyRows[targetRowIndex];
          const targetCursor: TableBodyCursor = {...cursor, rowPath: [targetRowIndex]};
          const targetDocument = documentsMap[targetRow && targetRow.row.documentId];
          const targetParentId =
            (targetDocument && targetDocument.metaData && targetDocument.metaData.parentId) ||
            (targetRow && targetRow.row.parentDocumentId) ||
            null;

          const deleteCount = targetRowIndex - rowIndex - 1;
          const childRows = rows.slice(rowIndex + 1, rowIndex + deleteCount);

          const actions: Action[] = [
            new TablesAction.ReplaceRows({cursor: targetCursor, rows: [sourceRow.row, ...childRows], deleteCount: 0}),
            new TablesAction.ReplaceRows({cursor, rows: [], deleteCount}),
          ];

          if (parentId !== targetParentId) {
            if (sourceRow.row.documentId) {
              return [
                new DocumentsAction.PatchMetaData({
                  collectionId: document.collectionId,
                  documentId: document.id,
                  metaData: {parentId: targetParentId},
                  onSuccess: () => actions.forEach(a => this.store$.dispatch(a)),
                }),
              ];
            } else {
              return [
                new TablesAction.ReplaceRows({
                  cursor: targetCursor,
                  rows: [{...sourceRow.row, parentDocumentId: targetParentId}, ...childRows],
                  deleteCount: 0,
                }),
                new TablesAction.ReplaceRows({cursor, rows: [], deleteCount}),
              ];
            }
          }

          return actions;
        })
      );
    })
  );

  @Effect()
  public moveCursor$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.MoveCursor>(TablesActionType.MOVE_CURSOR),
    withLatestFrom(this.store$.select(selectTableCursor).pipe(filter(cursor => !!cursor))),
    concatMap(([action, cursor]) =>
      this.store$.select(selectTableById(cursor.tableId)).pipe(
        first(),
        map(table => ({action, cursor, table}))
      )
    ),
    mergeMap(({action, cursor, table}) => {
      try {
        const nextCursor = moveTableCursor(table, cursor, action.payload.direction);
        return [new TablesAction.SetCursor({cursor: nextCursor})];
      } catch (error) {
        return [];
      }
    })
  );

  public constructor(
    private actions$: Actions,
    private collectionPermissionsPipe: CollectionPermissionsPipe,
    private store$: Store<AppState>
  ) {}

  private getLatestTable<A extends TablesAction.TableCursorAction>(
    action: A
  ): Observable<{action: A; table: TableModel}> {
    return this.store$.select(selectTableById(action.payload.cursor.tableId)).pipe(
      first(),
      filter(table => !!table),
      map(table => ({action, table}))
    );
  }

  private createViewCursorFromTable(table: TableModel, cursor: TableCursor): Observable<ViewCursor> {
    if (!cursor || !cursor.rowPath) {
      return of(null);
    }

    const part = table.config && table.config.parts && table.config.parts[cursor.partIndex];
    if (!part || !part.collectionId) {
      return of(null);
    }

    const column = part.columns[cursor.columnIndex];
    if (column.type !== TableColumnType.COMPOUND) {
      return of(null);
    }

    const attributeId = column.attributeIds[0];
    const row = findTableRow(table.config.rows, cursor.rowPath);
    if (!row || !row.documentId) {
      return of(null);
    }

    if (cursor.rowPath.length > 1) {
      const linkedRow = findTableRow(table.config.rows, cursor.rowPath);
      const {linkTypeId} = table.config.parts[cursor.partIndex - 1];
      const linkedDocumentId = linkedRow.documentId;
      return this.store$.select(selectLinkInstancesByTypeAndDocuments(linkTypeId, [linkedDocumentId])).pipe(
        first(),
        map(linkInstances => ({
          linkInstanceId: linkInstances.length ? linkInstances[0].id : null,
          collectionId: part.collectionId,
          documentId: row.documentId,
          attributeId,
        }))
      );
    }

    return of({
      collectionId: part.collectionId,
      documentId: row.documentId,
      attributeId,
    });
  }
}

function createReplaceColumnAction(
  splitAction: TablesAction.SplitColumn,
  oldColumn: TableConfigColumn,
  parentName: string,
  childNames: string[]
): TablesAction.ReplaceColumns {
  const children: TableConfigColumn[] = childNames.map(name => ({
    type: TableColumnType.COMPOUND,
    attributeIds: [`${parentName}.${name}`],
    children: [],
  }));
  const column: TableConfigColumn = {...oldColumn, children};

  return new TablesAction.ReplaceColumns({cursor: splitAction.payload.cursor, deleteCount: 1, columns: [column]});
}

function createParentAttributeAction(
  collection: Collection,
  oldAttribute: Attribute,
  nextAction: TablesAction.ReplaceColumns
): CollectionsAction.ChangeAttribute {
  return new CollectionsAction.ChangeAttribute({
    collectionId: collection.id,
    attributeId: oldAttribute.id,
    attribute: {
      id: oldAttribute.id,
      name: oldAttribute.name,
    },
    nextAction,
  });
}

function createSecondChildAttributeAction(
  collection: Collection,
  oldAttribute: Attribute,
  name: string,
  nextAction: CollectionsAction.ChangeAttribute
): CollectionsAction.ChangeAttribute {
  return new CollectionsAction.ChangeAttribute({
    collectionId: collection.id,
    attributeId: `${oldAttribute.id}.${name}`,
    attribute: {
      id: `${oldAttribute.id}.${name}`,
      name,
    },
    nextAction,
  });
}

function createFirstChildAttributeAction(
  collection: Collection,
  oldAttribute: Attribute,
  name: string,
  nextAction: CollectionsAction.ChangeAttribute
): CollectionsAction.ChangeAttribute {
  return new CollectionsAction.ChangeAttribute({
    collectionId: collection.id,
    attributeId: `${oldAttribute.id}.${name}`,
    attribute: {...oldAttribute, id: `${oldAttribute.id}.${name}`, name},
    nextAction,
  });
}
