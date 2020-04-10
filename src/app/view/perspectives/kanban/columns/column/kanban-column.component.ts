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
import {ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {DRAG_DELAY} from '../../../../../core/constants';
import {ConstraintData} from '../../../../../core/model/data/constraint';

import {KanbanColumn, KanbanConfig} from '../../../../../core/store/kanbans/kanban';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {Collection} from '../../../../../core/store/collections/collection';
import {Query} from '../../../../../core/store/navigation/query/query';
import {DataResource} from '../../../../../core/model/resource';
import {KanbanResourceCreate} from './footer/kanban-column-footer.component';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {generateId} from '../../../../../shared/utils/resource.utils';

export interface KanbanCard {
  dataResource: DataResource;
  attributeId: string;
  dueHours?: number;
}

@Component({
  selector: 'kanban-column',
  templateUrl: './kanban-column.component.html',
  styleUrls: ['./kanban-column.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanColumnComponent {
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
  public linkTypes: LinkType[];

  @Input()
  public canManageConfig: boolean;

  @Input()
  public permissions: Record<string, AllowedPermissions>;

  @Input()
  public summary: any;

  @Input()
  public query: Query;

  @Input()
  public constraintData: ConstraintData;

  @Output()
  public updateDocument = new EventEmitter<{
    document: DocumentModel;
    newValue: string;
    previousValue: string;
    attributeId: string;
  }>();

  @Output()
  public columnsChange = new EventEmitter<{columns: KanbanColumn[]; otherColumn: KanbanColumn}>();

  @Output()
  public createResource = new EventEmitter<KanbanResourceCreate>();

  @Output()
  public removeColumn = new EventEmitter();

  @Output()
  public toggleFavorite = new EventEmitter<DataResource>();

  public readonly dragDelay = DRAG_DELAY;
  public readonly postItIdPrefix = generateId();

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
    const previousValue = event.previousContainer.data.title;

    this.updateDocument.emit({document, newValue, previousValue, attributeId: card.attributeId});
  }

  public createObjectInResource(resourceCreate: KanbanResourceCreate) {
    this.createResource.emit(resourceCreate);
  }

  public onDocumentCreated(id: string) {
    setTimeout(() => {
      const postIt = document.getElementById(`${this.postItIdPrefix}#${id}`);
      postIt?.scrollIntoView();
    }, 300);
  }

  public onRemoveColumn() {
    this.removeColumn.emit();
  }

  public onToggleFavorite(card: KanbanCard) {
    this.toggleFavorite.emit(card.dataResource);
  }
}
