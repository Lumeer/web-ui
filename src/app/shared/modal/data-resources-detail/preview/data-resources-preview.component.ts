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

import {Component, ChangeDetectionStrategy, Input, EventEmitter, Output} from '@angular/core';
import {AttributesResource, DataResource} from '../../../../core/model/resource';
import {ConstraintData} from '@lumeer/data-filters';
import {View} from '../../../../core/store/views/view';

@Component({
  selector: 'data-resources-preview',
  templateUrl: './data-resources-preview.component.html',
  styleUrls: ['./data-resources-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataResourcesPreviewComponent {
  @Input()
  public showDuplicates: boolean;

  @Input()
  public hasDuplicates: boolean;

  @Input()
  public resources: AttributesResource[];

  @Input()
  public dataResources: DataResource[];

  @Input()
  public selectedResource: AttributesResource;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public view: View;

  @Output()
  public showDuplicatesChange = new EventEmitter<boolean>();

  @Output()
  public selectResource = new EventEmitter<AttributesResource>();

  @Output()
  public selectDataResource = new EventEmitter<DataResource>();
}
