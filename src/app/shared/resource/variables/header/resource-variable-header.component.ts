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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {generateId} from '../../../utils/resource.utils';
import {ResourceVariable, ResourceVariableType} from '../../../../core/store/resource-variables/resource-variable';
import {ResourceType} from '../../../../core/model/resource-type';

@Component({
  selector: 'resource-variable-header',
  templateUrl: './resource-variable-header.component.html',
  styleUrls: ['./resource-variable-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceVariableHeaderComponent implements OnChanges {
  @Input()
  public currentKeys: string[];

  @Input()
  public resourceId: string;

  @Input()
  public resourceType: ResourceType;

  @Output()
  public addVariable = new EventEmitter<ResourceVariable>();

  public key: string = '';
  public value: string = '';

  public duplicate: boolean;
  public valid: boolean;

  public secured$ = new BehaviorSubject(false);

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.currentKeys) {
      this.checkValid(this.key, this.value);
    }
  }

  public onAddVariable() {
    this.addVariable.emit({
      id: generateId(),
      key: this.key.trim(),
      value: this.value,
      type: ResourceVariableType.String,
      secure: this.secured$.value,
      resourceId: this.resourceId,
      resourceType: this.resourceType,
    });
    this.clearForm();
  }

  private clearForm() {
    this.key = '';
    this.value = '';
  }

  public onKeyChange(key: string) {
    this.checkValid(key, this.value);
  }

  public onValueChange(value: string) {
    this.checkValid(this.key, value);
  }

  private checkValid(key: string, value: string) {
    const keyTrimmed = (key || '').trim();
    this.duplicate = (this.currentKeys || []).some(k => k === keyTrimmed);

    const valueTrimmed = (value || '').trim();

    this.valid = (keyTrimmed || '').trim().length > 0 && (valueTrimmed || '').length > 0 && !this.duplicate;
  }
}
