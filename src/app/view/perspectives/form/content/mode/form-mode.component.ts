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

import {Component, OnChanges, ChangeDetectionStrategy, Input, SimpleChanges, EventEmitter, Output} from '@angular/core';
import {FormMode} from './form-mode';
import {Collection} from '../../../../../core/store/collections/collection';
import {ResourcesPermissions} from '../../../../../core/model/allowed-permissions';
import {objectChanged} from '../../../../../shared/utils/common.utils';

@Component({
  selector: 'form-mode',
  templateUrl: './form-mode.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormModeComponent implements OnChanges {
  @Input()
  public selectedMode: FormMode;

  @Input()
  public collection: Collection;

  @Input()
  public resourcesPermissions: ResourcesPermissions;

  @Input()
  public canManageConfig: boolean;

  @Output()
  public modeChange = new EventEmitter<FormMode>();

  public modes: FormMode[];

  public ngOnChanges(changes: SimpleChanges) {
    if (objectChanged(changes.collection) || changes.resourcesPermissions || changes.canManageConfig) {
      this.checkModes();
    }
    this.checkSelectedMode();
  }

  private checkModes() {
    const newModes = [];
    if (this.canManageConfig) {
      newModes.push(FormMode.Build);
    }
    const permissions = this.resourcesPermissions?.collections?.[this.collection?.id];
    if (permissions?.rolesWithView?.DataContribute) {
      newModes.push(FormMode.Create);
    }
    if (
      permissions?.rolesWithView?.DataContribute ||
      permissions?.rolesWithView?.DataWrite ||
      permissions?.rolesWithView?.DataRead
    ) {
      newModes.push(FormMode.Update);
    }
    this.modes = newModes;
  }

  private checkSelectedMode() {
    if (!this.modes.includes(this.selectedMode) && this.modes.length > 0) {
      this.selectedMode = this.modes[0];
      this.modeChange.emit(this.selectedMode);
    }
  }
}
