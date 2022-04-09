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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter} from '@angular/core';
import {DropdownDirective} from '../../../../../../../../shared/dropdown/dropdown.directive';
import {SelectItemModel} from '../../../../../../../../shared/select/select-item/select-item.model';
import {
  TaskConfigAttribute,
  TasksConfigGroupBy,
  TasksConfigSortBy,
} from '../../../../../../../../core/store/searches/search';

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

  public taskConfigItems: SelectItemModel[] = [
    {id: null, value: $localize`:@@default:Default`, classList: 'fst-italic'},
    {id: TaskConfigAttribute.DueDate, value: $localize`:@@collections.purpose.tasks.dueDate:Due Date`},
    {id: TaskConfigAttribute.Assignee, value: $localize`:@@collections.purpose.tasks.assignee:Assignee`},
    {id: TaskConfigAttribute.State, value: $localize`:@@collections.purpose.tasks.state:State`},
    {id: TaskConfigAttribute.Priority, value: $localize`:@@collections.purpose.tasks.priority:Priority`},
  ];

  public onGroupBySelected(groupBy: TaskConfigAttribute) {
    this.groupByChanged.emit(groupBy);
  }
}
