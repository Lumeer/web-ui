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

import {deepObjectsEquals} from '../../../shared/utils/common.utils';
import {ConstraintType} from '../../model/data/constraint';
import {Attribute, Collection} from '../collections/collection';
import {AttributeIdsMap, MapConfig} from './map.model';

export function filterLocationAttributes(attributes: Attribute[]): Attribute[] {
  return (attributes || []).filter(
    attribute =>
      attribute.constraint && [ConstraintType.Address, ConstraintType.Coordinates].includes(attribute.constraint.type)
  );
}

export function isMapConfigChanged(viewConfig: MapConfig, perspectiveConfig: MapConfig): boolean {
  if (!deepObjectsEquals(viewConfig.attributeIdsMap, perspectiveConfig.attributeIdsMap)) {
    return true;
  }

  if (Boolean(viewConfig.positionSaved) !== Boolean(perspectiveConfig.positionSaved)) {
    return true;
  }

  if (viewConfig.positionSaved || perspectiveConfig.positionSaved) {
    return !deepObjectsEquals(viewConfig.position, perspectiveConfig.position);
  }

  return false;
}
