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

import {Component, ChangeDetectionStrategy, ElementRef, Input} from '@angular/core';
import {AttributesSettings, ViewSettings} from '../../../../../core/store/views/view';
import {BehaviorSubject} from 'rxjs';
import {AttributesResource, AttributesResourceType} from '../../../../../core/model/resource';

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

  public viewSettings$ = new BehaviorSubject<ViewSettings>({});

  constructor(public element: ElementRef) {}

  public onAttributesSettingsChanged(attributesSettings: AttributesSettings) {
    const changedSettings: ViewSettings = {...this.viewSettings$.value, attributes: attributesSettings};
    this.viewSettings$.next(changedSettings);
  }
}
