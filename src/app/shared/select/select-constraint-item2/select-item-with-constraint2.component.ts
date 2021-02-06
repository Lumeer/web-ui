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
import {AttributesResource} from '../../../core/model/resource';
import {SelectItemWithConstraintId} from '../select-constraint-item/select-item-with-constraint.component';
import {SelectItem2Model} from '../select-item2/select-item2.model';
import {Constraint} from '@lumeer/data-filters';

@Component({
  selector: 'select-item-with-constraint2',
  templateUrl: './select-item-with-constraint2.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectItemWithConstraint2Component {
  @Input()
  public attributesResources: AttributesResource[];

  @Input()
  public restrictedIds: SelectItemWithConstraintId[];

  @Input()
  public selectedId: SelectItemWithConstraintId;

  @Input()
  public selectedConstraint: Constraint;

  @Input()
  public emptyValue: string = '';

  @Input()
  public disabled: boolean;

  @Input()
  public removable: boolean = false;

  @Output()
  public select = new EventEmitter<{id: SelectItemWithConstraintId; constraint?: Constraint}>();

  @Output()
  public selectConstraint = new EventEmitter<Constraint>();

  @Output()
  public remove = new EventEmitter();

  public onRemove() {
    this.remove.emit();
  }

  public onSelectPath(path: SelectItem2Model[]) {
    const id = path[0].id;
    const constraint = path[1]?.id;
    this.select.emit({id, constraint});
  }
}
