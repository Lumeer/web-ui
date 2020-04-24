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
import {Attribute} from '../../../../core/store/collections/collection';
import {ViewResourceAttributeSettings} from '../../../../core/store/views/view';

@Pipe({
  name: 'createAttributesSettingsOrder',
})
export class CreateAttributesSettingsOrderPipe implements PipeTransform {
  public transform(
    attributes: Attribute[],
    settings: ViewResourceAttributeSettings[]
  ): ViewResourceAttributeSettings[] {
    const attributesCopy = [...(attributes || [])];
    const modifiedSettings = [];
    settings?.forEach(setting => {
      const index = attributesCopy.findIndex(attribute => attribute.id === setting.attributeId);
      if (index >= 0) {
        modifiedSettings.push(setting);
        attributesCopy.splice(index, 1);
      }
    });

    attributesCopy.forEach(attribute => modifiedSettings.push({attributeId: attribute.id}));

    return modifiedSettings;
  }
}
