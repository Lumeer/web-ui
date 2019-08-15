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

import {Component, ChangeDetectionStrategy, Input, EventEmitter, Output} from '@angular/core';
import {KanbanColumn} from '../../../../../../core/store/kanbans/kanban';
import {ConstraintType} from '../../../../../../core/model/data/constraint';

@Component({
  selector: 'kanban-column-header',
  templateUrl: './kanban-column-header.component.html',
  styleUrls: ['./kanban-column-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanColumnHeaderComponent {
  @Input()
  public column: KanbanColumn;

  @Output()
  public remove = new EventEmitter();

  public readonly constraintTypes = ConstraintType;

  public onRemove() {
    this.remove.emit();
  }
}
