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
import {Action, select, Store} from '@ngrx/store';
import {combineLatest, Observable, of} from 'rxjs';
import {
  concatMap,
  debounceTime,
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
import {getArrayDifference} from '../../../shared/utils/array.utils';
import {generateAttributeName} from '../../../shared/utils/attribute.utils';
import {AppState} from '../app.state';
import {Attribute, Collection} from '../collections/collection';
import {CollectionsAction} from '../collections/collections.action';
import {
  selectCollectionById,
  selectCollectionsDictionary,
  selectCollectionsLoaded,
} from '../collections/collections.state';
import {selectDocumentsByCustomQuery} from '../common/permissions.selectors';
import {DocumentModel} from '../documents/document.model';
import {DocumentsAction} from '../documents/documents.action';
import {selectDocumentsByIds, selectDocumentsDictionary} from '../documents/documents.state';
import {findLinkInstanceByDocumentId, getOtherDocumentIdFromLinkInstance} from '../link-instances/link-instance.utils';
import {LinkInstancesAction} from '../link-instances/link-instances.action';
import {selectLinkInstancesByTypeAndDocuments} from '../link-instances/link-instances.state';
import {LinkTypeHelper} from '../link-types/link-type.helper';
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

@Injectable()
export class TablesEffects {
  @Effect()
  public createTable$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.CreateTable>(TablesActionType.CREATE_TABLE),
    filter(action => {
      const {query} = action.payload;
      return isSingleCollectionQuery(query);
    }),
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
      this.store$.pipe(select(selectViewCode))
    ),
    mergeMap(([action, collectionsMap, linkTypesMap, viewCode]) => {
      const {config, query} = action.payload;

      const queryStem = query.stems[0];
      const primaryCollection = collectionsMap[queryStem.collectionId];
      const linkTypeIds = queryStem.linkTypeIds || [];

      let lastCollectionId = queryStem.collectionId;
      const parts: TableConfigPart[] = [
        createCollectionPart(primaryCollection, 0, !viewCode && linkTypeIds.length === 0, config),
      ];
      const loadDataActions: Action[] = [];

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

        // TODO load in guard instead
        const dataQuery: Query = {
          stems: [{collectionId: collection.id, linkTypeIds: [linkTypeId]}],
        };
        loadDataActions.push(
          new DocumentsAction.Get({query: dataQuery}),
          new LinkInstancesAction.Get({query: dataQuery})
        );
      });

      const rows = filterTableRowsByDepth(
        (config && config.rows) || [createEmptyTableRow()],
        Math.round(parts.length / 2)
      );
      const addTableAction: Action = new TablesAction.AddTable({
        table: {
          id: action.payload.tableId,
          config: {parts, rows},
        },
      });
      return [addTableAction].concat(loadDataActions);
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
            query: convertQueryModelToString(newQuery),
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
      const linkTypeIds = table.config.parts
        .slice(0, action.payload.cursor.partIndex)
        .reduce((ids, part) => (part.linkTypeId ? ids.concat(part.linkTypeId) : ids), []);

      const stem = {...query.stems[0], linkTypeIds};
      const newQuery: Query = {...query, stems: [stem]};

      return new RouterAction.Go({
        path: [],
        queryParams: {
          query: convertQueryModelToString(newQuery),
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

        const uninitializedAttributeNames = columns.reduce((attributeNames, column) => {
          return column.attributeName ? attributeNames.concat(column.attributeName) : attributeNames;
        }, []);

        const attributeName = generateAttributeName(attributes, uninitializedAttributeNames, parentName);
        return {
          type: TableColumnType.COMPOUND,
          attributeIds: [],
          attributeName,
          children: [],
          uniqueId: Math.random()
            .toString(36)
            .substr(2, 9),
        };
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
        map(table => ({action, table}))
      )
    ),
    flatMap(({action, table}) => {
      const {cursor} = action.payload;
      const part = table.config.parts[cursor.partIndex];
      const column = findTableColumn(part.columns, cursor.columnPath);
      const attributeId = getAttributeIdFromColumn(column);

      return [
        new TablesAction.ReplaceColumns({cursor, deleteCount: 1}),
        new CollectionsAction.RemoveAttribute({collectionId: part.collectionId, attributeId}),
      ];
    })
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
  public initColumn$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.InitColumn>(TablesActionType.INIT_COLUMN),
    mergeMap(action => this.getLatestTable(action)),
    mergeMap(({action, table}) => {
      const part = table.config.parts[action.payload.cursor.partIndex];
      const column = findTableColumn(part.columns, action.payload.cursor.columnPath);
      const columns = [{...column, attributeIds: [action.payload.attributeId]}];

      const {cursor} = action.payload;
      const actions: Action[] = [
        new TablesAction.ReplaceColumns({
          cursor,
          deleteCount: 1,
          columns,
        }),
      ];

      if (cursor.columnPath.length === 1) {
        actions.push(new TablesAction.AddColumn({cursor: {...cursor, columnPath: [cursor.columnPath[0] + 1]}}));
      }

      return actions;
    })
  );

  @Effect()
  public syncColumns$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.SyncColumns>(TablesActionType.SYNC_COLUMNS),
    mergeMap(action =>
      this.store$.pipe(
        select(selectTablePart(action.payload.cursor)),
        filter(part => !!part),
        take(1),
        mergeMap((part: TableConfigPart) =>
          this.store$.pipe(
            select(part.collectionId ? selectCollectionById(part.collectionId) : selectLinkTypeById(part.linkTypeId)),
            filter(entity => !!entity),
            take(1),
            withLatestFrom(this.store$.pipe(select(selectViewCode))),
            mergeMap(([entity, viewCode]) => {
              const filteredColumns = filterTableColumnsByAttributes(part.columns, entity.attributes);
              const columns = addMissingTableColumns(filteredColumns, entity.attributes, !!viewCode);

              if (areTableColumnsListsEqual(part.columns, columns)) {
                return [];
              }

              // TODO double check if deletion works as expected
              return [new TablesAction.UpdateColumns({cursor: action.payload.cursor, columns})];
            })
          )
        )
      )
    )
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

          return actions.concat(new TablesAction.OrderPrimaryRows({cursor, documents}));
        })
      )
    )
  );

  @Effect()
  public syncLinkedRows$: Observable<Action> = this.actions$.pipe(
    ofType<TablesAction.SyncLinkedRows>(TablesActionType.SYNC_LINKED_ROWS),
    mergeMap(action =>
      combineLatest(
        this.store$.pipe(select(selectTablePart(action.payload.cursor))),
        this.store$.pipe(select(selectTableRow(action.payload.cursor)))
      ).pipe(
        first(),
        filter(([part, row]) => !!part && !!row),
        mergeMap(([part, row]) => {
          const linkedRows = row.linkedRows || [];
          return this.store$.pipe(
            select(selectLinkInstancesByTypeAndDocuments(part.linkTypeId, [row.documentId])),
            first(),
            mergeMap(linkInstances => {
              const documentIds = linkInstances.reduce((ids, linkInstance) => {
                const documentId = getOtherDocumentIdFromLinkInstance(linkInstance, row.documentId);
                return ids.includes(documentId) ? ids : ids.concat(documentId);
              }, []);
              return this.store$.pipe(
                select(selectDocumentsByIds(documentIds)),
                first(),
                mergeMap(documents => {
                  const createdDocuments = filterNewlyCreatedDocuments(linkedRows, documents);
                  const unknownDocuments = filterUnknownDocuments(linkedRows, documents);

                  const actions: Action[] = [];

                  if (createdDocuments.length > 0) {
                    actions.push(
                      new TablesAction.InitRows({
                        cursor: action.payload.cursor,
                        documents: createdDocuments,
                        linkInstances,
                      })
                    );
                  }

                  if (
                    unknownDocuments.length > 0 &&
                    unknownDocuments.some(document => !!findLinkInstanceByDocumentId(linkInstances, document.id))
                  ) {
                    actions.push(
                      new TablesAction.AddLinkedRows({
                        cursor: action.payload.cursor,
                        linkedRows: unknownDocuments.reduce((rows, document) => {
                          const linkInstance = findLinkInstanceByDocumentId(linkInstances, document.id);
                          return linkInstance ? rows.concat(createTableRow(document, linkInstance)) : rows;
                        }, []),
                        append: true,
                      })
                    );
                  }

                  return actions;
                })
              );
            })
          );
        })
      )
    )
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

  public constructor(private actions$: Actions, private store$: Store<AppState>) {}

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

    const part = table.config.parts[cursor.partIndex];
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

function filterNewlyCreatedDocuments(rows: TableConfigRow[], documents: DocumentModel[]): DocumentModel[] {
  const rowCorrelationIds = rows.filter(row => row.correlationId && !row.documentId).map(row => row.correlationId);
  return documents
    .filter(document => !!document.id && !!document.correlationId)
    .filter(document => rowCorrelationIds.includes(document.correlationId));
}

function filterUnknownDocuments(rows: TableConfigRow[], documents: DocumentModel[]): DocumentModel[] {
  return documents.filter(
    document =>
      !rows.some(row => {
        return row.documentId === document.id || (row.correlationId && row.correlationId === document.correlationId);
      })
  );
}
