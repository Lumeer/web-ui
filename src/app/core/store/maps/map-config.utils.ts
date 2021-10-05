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
import {Attribute, Collection} from '../collections/collection';
import {MapAttributeModel, MapConfig, MapConfigVersion, MapPosition, MapStemConfig} from './map.model';
import {Query, QueryStem} from '../navigation/query/query';
import {LinkType} from '../link-types/link.type';
import {
  checkOrTransformQueryAttribute,
  collectionIdsChainForStem,
  findBestStemConfigIndex,
  queryStemAttributesResourcesOrder,
  queryStemsAreSame,
} from '../navigation/query/query.util';
import {getAttributesResourceType} from '../../../shared/utils/resource.utils';
import {ConstraintType} from '@lumeer/data-filters';

export function mapAttributesAreInAllowedRange(model: MapAttributeModel, otherModel: MapAttributeModel): boolean {
  if (!model || !otherModel) {
    return true;
  }

  const resourceIndex = model.resourceIndex;
  const allowedResourceIndexes =
    resourceIndex % 2 === 0 ? [resourceIndex, resourceIndex - 1] : [resourceIndex, resourceIndex + 1];
  return allowedResourceIndexes.includes(otherModel.resourceIndex);
}

export function filterLocationAttributes(attributes: Attribute[], includeAddress = true): Attribute[] {
  const constraintTypes = includeAddress
    ? [ConstraintType.Address, ConstraintType.Coordinates]
    : [ConstraintType.Coordinates];
  return (attributes || []).filter(
    attribute => attribute.constraint && constraintTypes.includes(attribute.constraint.type)
  );
}

export function isMapConfigChanged(viewConfig: MapConfig, perspectiveConfig: MapConfig): boolean {
  if (mapStemConfigsChanged(viewConfig.stemsConfigs, perspectiveConfig.stemsConfigs)) {
    return true;
  }

  if (
    Boolean(viewConfig.positionSaved) !== Boolean(perspectiveConfig.positionSaved) ||
    viewConfig.imageUrl !== perspectiveConfig.imageUrl
  ) {
    return true;
  }

  if (viewConfig.positionSaved || perspectiveConfig.positionSaved) {
    return mapPositionChanged(viewConfig.position, perspectiveConfig.position);
  }

  return false;
}

export function mapPositionChanged(p1: MapPosition, p2: MapPosition): boolean {
  return !deepObjectsEquals(p1, p2);
}

function mapStemConfigsChanged(c1: MapStemConfig[], c2: MapStemConfig[]): boolean {
  if (c1.length !== c2.length) {
    return true;
  }

  return c1.some((config, index) => mapStemConfigChanged(config, c2[index]));
}

function mapStemConfigChanged(config: MapStemConfig, mapStemConfig: MapStemConfig) {
  if (!queryStemsAreSame(config?.stem, mapStemConfig?.stem)) {
    return true;
  }
  if (!deepObjectsEquals(config?.color, mapStemConfig?.color)) {
    return true;
  }
  if (!deepObjectsEquals(config?.attributes, mapStemConfig?.attributes)) {
    return true;
  }
  return false;
}

export function checkOrTransformMapConfig(
  config: MapConfig,
  query: Query,
  collections: Collection[],
  linkTypes: LinkType[]
): MapConfig {
  if (!config) {
    return createMapDefaultConfig(query, collections, linkTypes);
  }

  return {
    ...config,
    stemsConfigs: checkOrTransformMapStemsConfig(
      config.stemsConfigs || [],
      query,
      collections,
      linkTypes,
      !config.imageUrl
    ),
  };
}

function checkOrTransformMapStemsConfig(
  stemsConfigs: MapStemConfig[],
  query: Query,
  collections: Collection[],
  linkTypes: LinkType[],
  allowAddressAttributes: boolean
): MapStemConfig[] {
  const stemsConfigsCopy = [...(stemsConfigs || [])];
  return (query?.stems || []).map(stem => {
    const stemCollectionIds = collectionIdsChainForStem(stem, linkTypes);
    const stemConfigIndex = findBestStemConfigIndex(stemsConfigsCopy, stemCollectionIds, linkTypes);
    const stemConfig = stemsConfigsCopy.splice(stemConfigIndex, 1);
    return checkOrTransformMapStemConfig(stemConfig[0], stem, collections, linkTypes, allowAddressAttributes);
  });
}

function checkOrTransformMapStemConfig(
  stemConfig: MapStemConfig,
  stem: QueryStem,
  collections: Collection[],
  linkTypes: LinkType[],
  allowAddressAttributes: boolean
): MapStemConfig {
  if (!stemConfig) {
    return createMapDefaultStemConfig(stem, collections, linkTypes, allowAddressAttributes);
  }

  const attributesResourcesOrder = queryStemAttributesResourcesOrder(stem, collections, linkTypes);
  return {
    stem,
    attributes: stemConfig.attributes?.map(attribute =>
      checkOrTransformQueryAttribute(attribute, attributesResourcesOrder)
    ),
    color: checkOrTransformQueryAttribute(stemConfig.color, attributesResourcesOrder),
  };
}

function createMapDefaultConfig(query: Query, collections: Collection[], linkTypes: LinkType[]): MapConfig {
  const stems = query?.stems || [];
  const stemsConfigs = stems.map(stem => createMapDefaultStemConfig(stem, collections, linkTypes));
  return {
    version: MapConfigVersion.V1,
    stemsConfigs,
  };
}

export function createMapDefaultStemConfig(
  stem?: QueryStem,
  collections?: Collection[],
  linkTypes?: LinkType[],
  allowAddressAttributes?: boolean
): MapStemConfig {
  if (stem && collections) {
    const attributesResourcesOrder = queryStemAttributesResourcesOrder(stem, collections, linkTypes);
    for (let i = 0; i < attributesResourcesOrder.length; i++) {
      const resource = attributesResourcesOrder[i];
      const locationAttributes = filterLocationAttributes(resource.attributes, allowAddressAttributes);
      if (locationAttributes.length) {
        const mapAttributes = locationAttributes.map(attribute => ({
          attributeId: attribute.id,
          resourceId: resource.id,
          resourceType: getAttributesResourceType(resource),
          resourceIndex: i,
        }));
        return {stem, attributes: mapAttributes};
      }
    }
    return {stem, attributes: []};
  }
  return {stem};
}
