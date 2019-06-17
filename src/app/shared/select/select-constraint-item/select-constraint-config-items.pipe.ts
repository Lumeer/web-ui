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

import {Pipe, PipeTransform} from '@angular/core';
import {AttributesResource} from '../../../core/model/resource';
import {SelectConstraintItemId} from './select-constraint-item.component';
import {findAttribute} from '../../../core/store/collections/collection.util';
import {createSelectConstraintItems} from './select-constraint-items.util';
import {SelectItemModel} from '../select-item/select-item.model';
import {I18n} from '@ngx-translate/i18n-polyfill';

@Pipe({
  name: 'selectConstraintConfigItems'
})
export class SelectConstraintConfigItemsPipe implements PipeTransform {

  private readonly defaultTitle: string;

  constructor(private i18n: I18n) {
    this.defaultTitle = i18n({id: 'default', value: 'Default'});
  }

  public transform(attributesResources: AttributesResource[], selectedAttribute: SelectConstraintItemId): SelectItemModel[] {
    const resource = selectedAttribute && attributesResources[selectedAttribute.resourceIndex];
    const attribute = selectedAttribute && resource && findAttribute(resource.attributes, selectedAttribute.attributeId);
    console.log(attribute, attribute && createSelectConstraintItems(attribute, this.defaultTitle));
    return attribute && createSelectConstraintItems(attribute, this.defaultTitle) || [];
  }

}
