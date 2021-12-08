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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ViewChild} from '@angular/core';
import {InputBoxComponent, TRIM_REGEX} from '../../../../input/input-box/input-box.component';
import {ResourceVariable} from '../../../../../core/store/resource-variables/resource-variable';
import {NotificationService} from '../../../../../core/notifications/notification.service';

@Component({
  selector: 'resource-variable-row',
  templateUrl: './resource-variable-row.component.html',
  styleUrls: ['./resource-variable-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceVariableRowComponent {
  @Input()
  public variable: ResourceVariable;

  @Input()
  public otherKeys: string[];

  @Output()
  public delete = new EventEmitter();

  @Output()
  public variableChange = new EventEmitter<ResourceVariable>();

  @ViewChild('nameInput')
  public inputBoxComponent: InputBoxComponent;

  public readonly secureTooltip: string;
  public readonly unsecureTooltip: string;
  public readonly keyFilter = TRIM_REGEX;

  constructor(private notificationService: NotificationService) {
    this.secureTooltip = $localize`:@@resource.variables.row.secure:Secured`;
    this.unsecureTooltip = $localize`:@@resource.variables.row.unsecure:Unsecured`;
  }

  public onNewKey(key: string) {
    if (this.variable.key === key) {
      return;
    }
    if (this.otherKeys?.includes(key)) {
      this.inputBoxComponent?.setValue(this.variable.key);
      this.showDuplicateWarning(key);
      return;
    }
    this.variableChange.emit({...this.variable, key});
  }

  private showDuplicateWarning(key: string) {
    const warning = $localize`:@@resource.variables.validation.duplication.name:Variable with name '${key}' already exists.`;
    this.notificationService.warning(warning);
  }

  public onNewValue(value: string) {
    if (value && value !== this.variable.value) {
      this.variableChange.emit({...this.variable, value});
    }
  }
}
