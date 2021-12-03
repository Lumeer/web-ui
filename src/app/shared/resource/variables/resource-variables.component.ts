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
import {Resource} from '../../../core/model/resource';
import {ResourceType} from '../../../core/model/resource-type';

export interface ResourceVariable {
  id: string;
  key: string;
  value: any;
  type: 'string';
  secure?: boolean;
}

@Component({
  selector: 'resource-variables',
  templateUrl: './resource-variables.component.html',
  styleUrls: ['./resource-variables.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceVariablesComponent {
  @Input()
  public resource: Resource;

  @Input()
  public resourceType: ResourceType;

  public variables$ = new BehaviorSubject<ResourceVariable[]>([]);

  public onDelete(variable: ResourceVariable) {
    const variables = [...this.variables$.value];
    const index = variables.findIndex(v => v.id === variable.id);
    variables.splice(index, 1);
    this.variables$.next(variables);
  }

  public onChange(variable: ResourceVariable) {
    const variables = [...this.variables$.value];
    const index = variables.findIndex(v => v.id === variable.id);
    variables[index] = variable;
    this.variables$.next(variables);
  }

  public onAddVariable(variable: ResourceVariable) {
    this.variables$.next([variable, ...this.variables$.value]);
  }
}
