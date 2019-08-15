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
import {BehaviorSubject} from 'rxjs';
import {DRAG_DELAY} from '../../../../../core/constants';

import {KanbanColumn, KanbanConfig} from '../../../../../core/store/kanbans/kanban';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {SelectionHelper} from '../../../../../shared/document/post-it/util/selection-helper';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {Collection} from '../../../../../core/store/collections/collection';
import {Query} from '../../../../../core/store/navigation/query';
import {DataResource} from '../../../../../core/model/resource';
import {KanbanResourceCreate} from './footer/kanban-column-footer.component';
import {generateId} from '../../../../../shared/utils/resource.utils';

export interface KanbanCard {
  dataResource: DataResource;
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
  public cards: KanbanCard[];

  @Input()
  public config: KanbanConfig;

  @Input()
  public column: KanbanColumn;

  @Input()
  public dragColumnsIds: string[];

  @Input()
  public collections: Collection[];

  @Input()
  public canManageConfig: boolean;

  @Input()
  public permissions: Record<string, AllowedPermissions>;

  @Input()
  public query: Query;

  @Output()
  public removeDocument = new EventEmitter<DocumentModel>();

  @Output()
  public updateDocument = new EventEmitter<{document: DocumentModel; newValue: string; attributeId: string}>();

  @Output()
  public columnsChange = new EventEmitter<{columns: KanbanColumn[]; otherColumn: KanbanColumn}>();

  @Output()
  public createResource = new EventEmitter<KanbanResourceCreate>();

  @Output()
  public removeColumn = new EventEmitter();

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
    const document = (this.cards || []).find(card => card.dataResource.id === key);
    return (document && Object.keys(document.dataResource.data).length - 1) || 0;
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.documents) {
      this.documentsIds$.next((this.cards || []).map(card => card.dataResource.id));
    }
  }

  public trackByCard(index: number, card: KanbanCard) {
    return card.dataResource.id;
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
    const columns = this.config.columns.map(col => ({...col, resourcesOrder: [...col.resourcesOrder]}));
    const otherColumn = {...this.config.otherColumn, resourcesOrder: this.config.otherColumn.resourcesOrder};
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
    const document = card.dataResource as DocumentModel;
    const newValue = event.container.data.title;

    this.updateDocument.emit({document, newValue, attributeId: card.attributeId});
  }

  public createObjectInResource(resourceCreate: KanbanResourceCreate) {
    this.createResource.emit(resourceCreate);
  }

  public onDocumentCreated(id: string) {
    setTimeout(() => {
      const postIt = document.getElementById(`${this.columnSelectionId}#${id}`);
      postIt && postIt.scrollIntoView();
    });
  }

  public onRemoveDocument(document: DocumentModel) {
    this.removeDocument.emit(document);
  }

  public onRemoveColumn() {
    this.removeColumn.emit();
  }
}
