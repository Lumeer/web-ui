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
import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';

import {AttributesResource} from '../../../core/model/resource';

@Component({
  selector: 'preview-results-tabs',
  templateUrl: './preview-results-tabs.component.html',
  styleUrls: ['./preview-results-tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewResultsTabsComponent {
  @Input()
  public resources: AttributesResource[];

  @Input()
  public selectedId: string;

  @Output()
  public selectResource = new EventEmitter<AttributesResource>();

  public setActiveResource(resource: AttributesResource) {
    this.selectedId = resource.id;
    this.selectResource.emit(resource);
  }
}
