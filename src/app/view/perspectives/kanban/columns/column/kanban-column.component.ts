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
import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {DRAG_DELAY} from '../../../../../core/constants';
import {ConstraintData} from '../../../../../core/model/data/constraint';

import {KanbanColumn, KanbanConfig} from '../../../../../core/store/kanbans/kanban';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {Query} from '../../../../../core/store/navigation/query/query';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../../../core/model/resource';
import {KanbanResourceCreate} from './footer/kanban-column-footer.component';
import {generateId} from '../../../../../shared/utils/resource.utils';
import {KanbanCard, KanbanDataColumn} from '../../util/kanban-data';

@Component({
  selector: 'kanban-column',
  templateUrl: './kanban-column.component.html',
  styleUrls: ['./kanban-column.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanColumnComponent {
  @Input()
  public config: KanbanConfig;

  @Input()
  public column: KanbanDataColumn;

  @Input()
  public dragColumnsIds: string[];

  @Input()
  public canManageConfig: boolean;

  @Input()
  public query: Query;

  @Input()
  public createResources: KanbanResourceCreate[];

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
    // const columns = this.config.columns.map(col => ({...col, resourcesOrder: [...col.ca]}));
    // const otherColumn = {...this.config.otherColumn, resourcesOrder: this.config.otherColumn.resourcesOrder};
    // const column = columns.find(col => col.id === event.container.id) || otherColumn;
    //
    // if (event.container.id === event.previousContainer.id) {
    //   moveItemInArray(column.resourcesOrder, event.previousIndex, event.currentIndex);
    // } else {
    //   const previousColumn = columns.find(col => col.id === event.previousContainer.id);
    //   if (previousColumn) {
    //     transferArrayItem(
    //       previousColumn.resourcesOrder,
    //       column.resourcesOrder,
    //       event.previousIndex,
    //       event.currentIndex
    //     );
    //   } else {
    //     // it's Other column
    //     transferArrayItem(otherColumn.resourcesOrder, column.resourcesOrder, event.previousIndex, event.currentIndex);
    //   }
    // }
    // this.columnsChange.emit({columns, otherColumn});
  }

  private postItContainerChanged(event: CdkDragDrop<KanbanColumn, KanbanColumn>): boolean {
    return event.container.id !== event.previousContainer.id;
  }

  private updatePostItValue(event: CdkDragDrop<KanbanColumn, KanbanColumn>) {
    const card = event.item.data as KanbanCard;
    const document = card.dataResource as DocumentModel;
    const newValue = event.container.data.title;
    const previousValue = event.previousContainer.data.title;

    // this.updateDocument.emit({document, newValue, previousValue, attributeId: card.attributeId});
  }

  public createObjectInResource(resourceCreate: KanbanResourceCreate) {
    this.createResource.emit(resourceCreate);
  }

  public onDataResourceCreated(id: string) {
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
