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
import {ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output} from '@angular/core';

import {AttributesResource, AttributesResourceType} from '../../../../../core/model/resource';
import {AttributesSettings, ViewSettings} from '../../../../../core/store/view-settings/view-settings';

@Component({
  selector: 'detail-settings-button',
  templateUrl: './detail-settings-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailSettingsButtonComponent {
  @Input()
  public resource: AttributesResource;

  @Input()
  public resourceType: AttributesResourceType;

  @Input()
  public attributesSettings: AttributesSettings;

  @Output()
  public attributesSettingsChanged = new EventEmitter<AttributesSettings>();

  constructor(public element: ElementRef) {}

  public onAttributesSettingsChanged(attributesSettings: AttributesSettings) {
    this.attributesSettingsChanged.emit(attributesSettings);
  }
}
