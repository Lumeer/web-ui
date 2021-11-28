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
import {FormConfig, FormMode} from '../../../../core/store/form/form-model';
import {Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {Query} from '../../../../core/store/navigation/query/query';
import {AttributesSettings, View} from '../../../../core/store/views/view';
import {ResourcesPermissions} from '../../../../core/model/allowed-permissions';
import {objectChanged} from '../../../../shared/utils/common.utils';

@Component({
  selector: 'form-perspective-content',
  templateUrl: './form-perspective-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormPerspectiveContentComponent implements OnChanges {
  @Input()
  public config: FormConfig;

  @Input()
  public collection: Collection;

  @Input()
  public collectionLinkTypes: LinkType[];

  @Input()
  public query: Query;

  @Input()
  public view: View;

  @Input()
  public attributesSettings: AttributesSettings;

  @Input()
  public permissions: ResourcesPermissions;

  @Input()
  public canManageConfig: boolean;

  @Output()
  public configChange = new EventEmitter<FormConfig>();

  public readonly mode = FormMode;

  private selectedMode: FormMode; // user selected mode

  public currentMode: FormMode;
  public modes: FormMode[] = [];

  public ngOnChanges(changes: SimpleChanges) {
    let modesChanged = false;
    if (objectChanged(changes.collection) || changes.permissions || changes.canManageConfig) {
      this.checkModes();
      modesChanged = true;
    }
    if (modesChanged || changes.config) {
      this.checkSelectedMode();
    }
  }

  private checkModes() {
    const newModes = [];
    if (this.canManageConfig) {
      newModes.push(FormMode.Build);
    }
    const permissions = this.permissions?.collections?.[this.collection?.id];
    if (
      permissions?.rolesWithView?.DataContribute ||
      permissions?.rolesWithView?.DataWrite ||
      permissions?.rolesWithView?.DataRead ||
      this.canManageConfig
    ) {
      newModes.push(FormMode.CreateUpdate);
    }
    this.modes = newModes;
  }

  private checkSelectedMode() {
    if (this.modes.includes(this.currentMode || this.config?.mode)) {
      this.currentMode = this.currentMode || this.config?.mode;
    } else if (this.modes.length > 0) {
      this.currentMode = this.modes[0];
    } else {
      this.currentMode = null;
    }
  }

  public onModeChange(mode: FormMode) {
    this.currentMode = mode;
    this.configChange.next({...this.config, mode});
  }
}
