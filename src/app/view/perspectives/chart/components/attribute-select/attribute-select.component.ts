/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {Component, EventEmitter, Input, Output} from '@angular/core';
import {AxisSelectModel} from '../../model/axis-select-model';

@Component({
  selector: 'attribute-select',
  templateUrl: './attribute-select.component.html',
  styleUrls: ['./attribute-select.component.scss']
})
export class AttributeSelectComponent {

  @Input()
  public attributes: AxisSelectModel[];

  @Input()
  set preSelected(value: string) {
    this.selectedAttribute = this.attributes && this.attributes.find(attribute => attribute.attributeId === value);
  }

  @Input()
  public emptyDescription: string;

  @Output()
  public attributeSelected = new EventEmitter<string>();

  public selectedAttribute: AxisSelectModel;

  public selectAttribute(attribute: AxisSelectModel) {
    this.selectedAttribute = attribute;
    this.attributeSelected.emit(this.selectedAttribute.attributeId);
  }

}
