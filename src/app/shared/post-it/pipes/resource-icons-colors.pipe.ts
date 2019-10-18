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
import {AttributesResource, AttributesResourceType} from '../../../core/model/resource';
import {getAttributesResourceType} from '../../utils/resource.utils';
import {Collection} from '../../../core/store/collections/collection';
import {LinkType} from '../../../core/store/link-types/link.type';

@Pipe({
  name: 'resourceIconsColors'
})
export class ResourceIconsColorsPipe implements PipeTransform {

  public transform(resource: AttributesResource): { colors: string[], icons: string[] } {
    if (!resource) {
      return {colors: [], icons: []};
    }

    if (getAttributesResourceType(resource) === AttributesResourceType.Collection) {
      return {colors: [(<Collection>resource).color], icons: [(<Collection>resource).icon]}
    } else if (getAttributesResourceType(resource) === AttributesResourceType.LinkType) {
      // collections must be set in resource object in order to work properly
      const collections: Collection[] = ((<LinkType>resource).collections || []);
      return {colors: collections.map(coll => coll.color), icons: collections.map(coll => coll.icon)};
    }


    return {colors: [], icons: []};
  }

}
