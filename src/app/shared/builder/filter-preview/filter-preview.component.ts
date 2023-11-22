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
import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';

import {ConditionType, ConditionValue, ConstraintData} from '@lumeer/data-filters';

import {Attribute} from '../../../core/store/collections/collection';
import {modifyAttributeForQueryBuilder} from '../../../core/store/navigation/query/query.util';
import {DataInputConfiguration} from '../../data-input/data-input-configuration';

@Component({
  selector: 'filter-preview',
  templateUrl: './filter-preview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'd-inline-flex text-truncate text-nowrap align-items-center'},
})
export class FilterPreviewComponent implements OnChanges {
  @Input()
  public condition: ConditionType;

  @Input()
  public attribute: Attribute;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public conditionValues: ConditionValue[];

  public conditionAttribute: Attribute;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.attribute || changes.condition) {
      this.conditionAttribute = modifyAttributeForQueryBuilder(this.attribute, this.condition);
    }
  }

  public readonly configuration: DataInputConfiguration = {
    common: {inline: true, skipValidation: true, inheritColor: true},
    color: {limitWidth: true},
  };
}
