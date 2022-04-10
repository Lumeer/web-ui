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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {DropdownDirective} from '../../../../../../../../shared/dropdown/dropdown.directive';
import {SelectItemModel} from '../../../../../../../../shared/select/select-item/select-item.model';
import {
  TaskConfigAttribute,
  TasksConfigGroupBy,
  TasksConfigSort,
  TasksConfigSortBy,
} from '../../../../../../../../core/store/searches/search';
import {AttributeSortType} from '../../../../../../../../core/store/views/view';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';

@Component({
  selector: 'tasks-sort-dropdown',
  templateUrl: './tasks-sort-dropdown.component.html',
  styleUrls: ['./tasks-sort-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksSortDropdownComponent extends DropdownDirective {
  @Input()
  public sortBy: TasksConfigSortBy;

  @Input()
  public groupBy: TasksConfigGroupBy;

  @Output()
  public sortByChanged = new EventEmitter<TasksConfigSortBy>();

  @Output()
  public groupByChanged = new EventEmitter<TasksConfigGroupBy>();

  private readonly taskConfigItems: SelectItemModel[] = [
    {id: TaskConfigAttribute.DueDate, value: $localize`:@@collections.purpose.tasks.dueDate:Due Date`},
    {id: TaskConfigAttribute.Assignee, value: $localize`:@@collections.purpose.tasks.assignee:Assignee`},
    {id: TaskConfigAttribute.State, value: $localize`:@@collections.purpose.tasks.state:State`},
    {id: TaskConfigAttribute.Priority, value: $localize`:@@collections.purpose.tasks.priority:Priority`},
  ];

  public readonly sortByItems = [
    {id: null, value: $localize`:@@tasks.config.sortBy.default:Default Sorting`, classList: 'fst-italic'},
    ...this.taskConfigItems,
  ];

  public readonly sortByAdditionalItems = [...this.taskConfigItems];

  public readonly groupByItems = [
    {id: null, value: $localize`:@@tasks.config.groupBy.noGrouping:No Grouping`, classList: 'fst-italic'},
    ...this.taskConfigItems,
  ];
  public sortType = AttributeSortType;
  public sortPlaceholder: boolean;

  public onSortBySelected(index: number, configAttribute: TaskConfigAttribute, placeholder?: boolean) {
    if (index === 0 && !configAttribute) {
      if (this.sortBy?.length) {
        this.sortByChanged.emit([]);
      }
    } else {
      const sortByArray = [...(this.sortBy || [])];
      if (sortByArray[index]?.attribute !== configAttribute) {
        sortByArray[index] = {...sortByArray[index], attribute: configAttribute};
        this.sortByChanged.emit(sortByArray);
      }
    }

    if (placeholder) {
      this.sortPlaceholder = false;
    }
  }

  public onGroupBySelected(groupBy: TaskConfigAttribute) {
    this.groupByChanged.emit(groupBy);
  }

  public onSortByRemoved(index: number) {
    const sortByArray = [...(this.sortBy || [])];
    sortByArray.splice(index, 1);
    this.sortByChanged.emit(sortByArray);
  }

  public onNewSort() {
    this.sortPlaceholder = true;
  }

  public onSortPlaceholderRemoved() {
    this.sortPlaceholder = false;
  }

  public onSortToggle(index: number) {
    const sortByArray = [...(this.sortBy || [])];
    const newSort = {...sortByArray[index]};
    if (newSort.type === AttributeSortType.Descending) {
      newSort.type = AttributeSortType.Ascending;
    } else {
      newSort.type = AttributeSortType.Descending;
    }

    sortByArray[index] = newSort;

    this.sortByChanged.emit(sortByArray);
  }

  public onSortDropped(event: CdkDragDrop<any>) {
    if (event.currentIndex !== event.previousIndex) {
      const sortByArray = [...(this.sortBy || [])];
      moveItemInArray(sortByArray, event.previousIndex, event.currentIndex);
      this.sortByChanged.emit(sortByArray);
    }
  }

  public trackBySort(index: number, sort: TasksConfigSort): string {
    return sort.attribute || '';
  }
}
