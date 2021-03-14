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
  HostListener,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {DRAG_DELAY} from '../../../../../../core/constants';
import {Query} from '../../../../../../core/store/navigation/query/query';
import {DataResource} from '../../../../../../core/model/resource';
import {generateId} from '../../../../../../shared/utils/resource.utils';
import {KanbanCard, KanbanCreateResource, KanbanData, KanbanDataColumn} from '../../../util/kanban-data';
import {PostItLayoutType} from '../../../../../../shared/post-it/post-it-layout-type';
import {ViewSettings} from '../../../../../../core/store/views/view';
import {BehaviorSubject, Observable} from 'rxjs';
import {distinctUntilChanged, throttleTime} from 'rxjs/operators';
import {ConstraintData} from '@lumeer/data-filters';

@Component({
  selector: 'kanban-column',
  templateUrl: './kanban-column.component.html',
  styleUrls: ['./kanban-column.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanColumnComponent implements OnInit {
  @Input()
  public postItLayout: PostItLayoutType;

  @Input()
  public kanbanData: KanbanData;

  @Input()
  public column: KanbanDataColumn;

  @Input()
  public dragColumnsIds: string[];

  @Input()
  public canManageConfig: boolean;

  @Input()
  public query: Query;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public viewSettings: ViewSettings;

  @Output()
  public updateDataResource = new EventEmitter<{
    card: KanbanCard;
    fromColumn: KanbanDataColumn;
    toColumn: KanbanDataColumn;
  }>();

  @Output()
  public createDataResource = new EventEmitter<KanbanCreateResource>();

  @Output()
  public removeColumn = new EventEmitter();

  @Output()
  public columnsChange = new EventEmitter<{columns: KanbanDataColumn[]; otherColumn: KanbanDataColumn}>();

  @Output()
  public toggleFavorite = new EventEmitter<DataResource>();

  public readonly dragDelay = DRAG_DELAY;
  public readonly postItIdPrefix = generateId();

  public currentPage$ = new BehaviorSubject(0);
  public elementHeight$: Observable<number>;
  public elementHeightSubject$ = new BehaviorSubject<number>(0);

  constructor(public element: ElementRef) {}

  public trackByCard(index: number, card: KanbanCard) {
    return card.dataResource.id;
  }

  public ngOnInit() {
    this.elementHeight$ = this.elementHeightSubject$.pipe(throttleTime(100), distinctUntilChanged());
    this.checkElementHeight();
  }

  private checkElementHeight() {
    this.elementHeightSubject$.next(this.element.nativeElement.offsetHeight);
  }

  @HostListener('window:resize')
  public onWindowResize() {
    this.checkElementHeight();
  }

  public onDropPostIt(event: CdkDragDrop<KanbanDataColumn, KanbanDataColumn>) {
    if (this.postItPositionChanged(event)) {
      this.updatePostItsPosition(event);

      if (this.postItContainerChanged(event)) {
        this.updatePostItValue(event);
      }
    }
  }

  private postItPositionChanged(event: CdkDragDrop<KanbanDataColumn, KanbanDataColumn>): boolean {
    return this.postItContainerChanged(event) || event.previousIndex !== event.currentIndex;
  }

  private updatePostItsPosition(event: CdkDragDrop<KanbanDataColumn, KanbanDataColumn>) {
    const columns = this.kanbanData.columns.map(col => ({...col, cards: [...col.cards]}));
    const otherColumn = {...this.kanbanData.otherColumn, cards: this.kanbanData.otherColumn.cards};
    const column = columns.find(col => col.id === event.container.id) || otherColumn;

    if (event.container.id === event.previousContainer.id) {
      moveItemInArray(column.cards, event.previousIndex, event.currentIndex);
    } else {
      const previousColumn = columns.find(col => col.id === event.previousContainer.id);
      if (previousColumn) {
        transferArrayItem(previousColumn.cards, column.cards, event.previousIndex, event.currentIndex);
      } else {
        // it's Other column
        transferArrayItem(otherColumn.cards, column.cards, event.previousIndex, event.currentIndex);
      }
    }
    this.columnsChange.emit({columns, otherColumn});
  }

  private postItContainerChanged(event: CdkDragDrop<KanbanDataColumn, KanbanDataColumn>): boolean {
    return event.container.id !== event.previousContainer.id;
  }

  private updatePostItValue(event: CdkDragDrop<KanbanDataColumn, KanbanDataColumn>) {
    const card = event.item.data as KanbanCard;
    const toColumn = event.container.data;
    const fromColumn = event.previousContainer.data;

    this.updateDataResource.emit({card, fromColumn, toColumn});
  }

  public createObjectInResource(createResource: KanbanCreateResource) {
    this.createDataResource.emit(createResource);
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

  public onScrolled() {
    this.currentPage$.next(this.currentPage$.value + 1);
  }
}
