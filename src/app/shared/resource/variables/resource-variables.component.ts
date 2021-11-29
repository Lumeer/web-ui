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

import {Component, ChangeDetectionStrategy, Input} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {generateId} from '../../utils/resource.utils';

export interface ResourceVariable {
  id: string;
  key: string;
  value: any;
  type: 'string';
  hidden?: boolean;
}

@Component({
  selector: 'resource-variables',
  templateUrl: './resource-variables.component.html',
  styleUrls: ['./resource-variables.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResourceVariablesComponent {

  @Input()
  public variables: ResourceVariable[];

  public variables$ = new BehaviorSubject<ResourceVariable[]>([]);

  public onAdd() {
    this.variables$.next([...this.variables$.value, {id: generateId(), key: '', value: '', type: 'string'}]);
  }

  public onDelete(index: number) {
    const variables = [...this.variables$.value];
    variables.splice(index, 1);
    this.variables$.next(variables);
  }

  public trackByVariable(index: number, variable: ResourceVariable): string {
    return variable.id;
  }

  public onChange(variable: ResourceVariable, index: number) {
    const variables = [...this.variables$.value];
    variables[index] = variable;
    this.variables$.next(variables);
  }
}
