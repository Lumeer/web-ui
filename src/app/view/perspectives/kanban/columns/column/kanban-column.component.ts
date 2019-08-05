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

import {CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {Store} from '@ngrx/store';
import {BehaviorSubject} from 'rxjs';
import {DRAG_DELAY} from '../../../../../core/constants';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {ConstraintData} from '../../../../../core/model/data/constraint';
import {AppState} from '../../../../../core/store/app.state';
import {Collection} from '../../../../../core/store/collections/collection';
import {findAttributeConstraint} from '../../../../../core/store/collections/collection.util';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {generateDocumentData} from '../../../../../core/store/documents/document.utils';
import {DocumentsAction} from '../../../../../core/store/documents/documents.action';

import {KanbanColumn, KanbanConfig} from '../../../../../core/store/kanbans/kanban';
import {Query} from '../../../../../core/store/navigation/query';
import {getQueryFiltersForCollection} from '../../../../../core/store/navigation/query.util';
import {User} from '../../../../../core/store/users/user';
import {SelectionHelper} from '../../../../../shared/document/post-it/util/selection-helper';
import {getSaveValue} from '../../../../../shared/utils/data.utils';
import {generateId} from '../../../../../shared/utils/resource.utils';
import {getSaveValue} from '../../../../../shared/utils/data.utils';
import {User} from '../../../../../core/store/users/user';
import {generateId} from '../../../../../shared/utils/resource.utils';
import {BehaviorSubject} from 'rxjs';
import {DRAG_DELAY} from '../../../../../core/constants';
import {ConstraintData} from '../../../../../core/model/data/constraint';
import {DataResource} from '../../../../../core/model/resource';

export interface KanbanCard {
  resource: DataResource;
  attributeId: string;
}

@Component({
  selector: 'kanban-column',
  templateUrl: './kanban-column.component.html',
  styleUrls: ['./kanban-column.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanColumnComponent implements OnInit, OnChanges {
  @ViewChild('cardWrapper', {static: true})
  public cardWrapperElement: ElementRef;

  @ViewChild('columnBody', {static: true})
  public columnBodyElement: ElementRef;

  @Input()
  public config: KanbanConfig;

  @Input()
  public column: KanbanColumn;

  @Input()
  public dragColumnsIds: string[];

  @Input()
  public collections: Collection[];

  @Input()
  public cards: KanbanCard[];

  @Input()
  public canManageConfig: boolean;

  @Input()
  public permissions: Record<string, AllowedPermissions>;

  @Input()
  public query: Query;

  @Input()
  public currentUser: User;

  @Input()
  public constraintData: ConstraintData;

  @Output()
  public patchDocumentData = new EventEmitter<DocumentModel>();

  @Output()
  public removeDocument = new EventEmitter<DocumentModel>();

  @Output()
  public columnsChange = new EventEmitter<{columns: KanbanColumn[]; otherColumn: KanbanColumn}>();

  public selectionHelper: SelectionHelper;
  public columnSelectionId: string;
  public documentsIds$ = new BehaviorSubject<string[]>([]);
  public readonly dragDelay = DRAG_DELAY;

  public ngOnInit() {
    this.columnSelectionId = this.column.id || generateId();
    this.selectionHelper = new SelectionHelper(
      this.documentsIds$,
      key => this.documentRows(key),
      () => 1,
      this.columnSelectionId
    );
  }

  private documentRows(key: string): number {
    const document = (this.cards || []).find(doc => doc.resource.id === key);
    return (document && Object.keys(document.resource.data).length - 1) || 0;
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.documents) {
      this.documentsIds$.next((this.cards || []).map(document => document.resource.id));
    }
  }

  public trackByCard(index: number, card: KanbanCard) {
    return card.resource.id;
  }

  public onDropPostIt(event: CdkDragDrop<KanbanColumn, KanbanColumn>) {
    if (this.postItPositionChanged(event)) {
      this.updatePostItsPosition(event);

      if (this.postItContainerChanged(event)) {
        this.updatePostItValue(event);
      }
    }
  }

  private postItPositionChanged(event: CdkDragDrop<KanbanColumn, KanbanColumn>): boolean {
    return this.postItContainerChanged(event) || event.previousIndex !== event.currentIndex;
  }

  private updatePostItsPosition(event: CdkDragDrop<KanbanColumn, KanbanColumn>) {
    const columns = this.config.columns.map(col => ({...col, documentsIdsOrder: [...col.documentsIdsOrder]}));
    const otherColumn = {...this.config.otherColumn, documentsIdsOrder: [...this.config.otherColumn.documentsIdsOrder]};
    const column = columns.find(col => col.id === event.container.id) || otherColumn;

    if (event.container.id === event.previousContainer.id) {
      moveItemInArray(column.resourcesOrder, event.previousIndex, event.currentIndex);
    } else {
      const previousColumn = columns.find(col => col.id === event.previousContainer.id);
      if (previousColumn) {
        transferArrayItem(
          previousColumn.resourcesOrder,
          column.resourcesOrder,
          event.previousIndex,
          event.currentIndex
        );
      } else {
        // it's Other column
        transferArrayItem(otherColumn.resourcesOrder, column.resourcesOrder, event.previousIndex, event.currentIndex);
      }
    }

    this.columnsChange.emit({columns, otherColumn});
  }

  private postItContainerChanged(event: CdkDragDrop<KanbanColumn, KanbanColumn>): boolean {
    return event.container.id !== event.previousContainer.id;
  }

  private updatePostItValue(event: CdkDragDrop<KanbanColumn, KanbanColumn>) {
    const card = event.item.data as KanbanCard;
    const document = card.resource as DocumentModel;
    const newValue = event.container.data.title;

    const collection = (this.collections || []).find(coll => coll.id === document.collectionId);
    if (collection) {
      const constraint = findAttributeConstraint(collection.attributes, configAttribute.attributeId);
      const value = getSaveValue(newValue, constraint, this.constraintData);
      const data = {...document.data, [card.attributeId]: value};
      this.patchDocumentData.emit({...document, data});
    }
  }

  public createDocumentInCollection(collection: Collection) {
    // TODO dialog
    // const document = this.createDocumentForCollection(collection);
    // if (document) {
    //   this.store$.dispatch(
    //     new DocumentsAction.Create({
    //       document,
    //       callback: documentId => this.onDocumentCreated(documentId),
    //     })
    //   );
    // }
  }

  private onDocumentCreated(id: string) {
    setTimeout(() => {
      const postIt = document.getElementById(`${this.columnSelectionId}#${id}`);
      postIt && postIt.scrollIntoView();
    });
  }

  // private createDocumentForCollection(collection: Collection): DocumentModel {
  //   const collectionConfig = this.config.collections[collection.id];
  //   const configAttribute = collectionConfig && collectionConfig.attribute;
  //   const collectionsFilters = getQueryFiltersForCollection(this.query, collection.id);
  //   const data = generateDocumentData(collection, collectionsFilters, this.currentUser);
  //   if (configAttribute) {
  //     const constraint = findAttributeConstraint(collection.attributes, configAttribute.attributeId);
  //     data[configAttribute.attributeId] = getSaveValue(this.column.title, constraint, this.constraintData);
  //   }
  //   return {collectionId: collection.id, data};
  // }

  public onRemoveDocument(document: DocumentModel) {
    this.removeDocument.emit(document);
  }
}
