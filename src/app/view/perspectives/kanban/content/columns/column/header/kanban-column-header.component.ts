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
import {KanbanConfig} from '../../../../../../../core/store/kanbans/kanban';
import {DataInputConfiguration} from '../../../../../../../shared/data-input/data-input-configuration';
import {KanbanDataColumn} from '../../../../util/kanban-data';
import {ConstraintData, ConstraintType} from '@lumeer/data-filters';

@Component({
  selector: 'kanban-column-header',
  templateUrl: './kanban-column-header.component.html',
  styleUrls: ['./kanban-column-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanColumnHeaderComponent {
  @Input()
  public config: KanbanConfig;

  @Input()
  public column: KanbanDataColumn;

  @Input()
  public constraintData: ConstraintData;

  @Output()
  public remove = new EventEmitter();

  public readonly constraintTypes = ConstraintType;

  public readonly dataInputConfiguration: DataInputConfiguration = {common: {inline: true}};

  public onRemove() {
    this.remove.emit();
  }
}
