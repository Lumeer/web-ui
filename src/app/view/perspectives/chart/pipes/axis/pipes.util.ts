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

import {ChartAxis, ChartAxisType, ChartConfig} from '../../../../../core/store/charts/chart';
import {Attribute, Collection} from '../../../../../core/store/collections/collection';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {Query} from '../../../../../core/store/navigation/query';
import {SelectItemModel} from '../../../../../shared/select/select-item/select-item.model';
import {isNotNullOrUndefined} from '../../../../../shared/utils/common.utils';
import {getOtherLinkedCollectionId} from '../../../../../shared/utils/link-type.utils';
import {AttributesResourceType} from '../../../../../core/model/resource';

type AxisResource = Collection | LinkType;

export function createSelectItemsForAxisType(
  axisType: ChartAxisType,
  config: ChartConfig,
  collections: Collection[],
  linkTypes: LinkType[],
  query: Query,
  isDataSet?: boolean
): SelectItemModel[] {
  const items: SelectItemModel[] = [];

  const restrictedResourceIndexes = isDataSet
    ? getRestrictedCollectionIndexesForDataset(config, axisType)
    : getRestrictedResourceIndexes(config, axisType);
  const axisResourcesChain: AxisResource[] = createAxisResourceChain(query, collections, linkTypes);

  for (let i = 0; i < axisResourcesChain.length; i++) {
    if (restrictedResourceIndexes.includes(i)) {
      continue;
    }

    const axisResource = axisResourcesChain[i];
    if (i % 2 === 0) {
      // chain is always: Collection, LinkType, Collection, LinkType, Collection...
      const collection = axisResource as Collection;
      items.push(...collection.attributes.map(attribute => collectionAttributeToItem(collection, attribute, i)));
    } else {
      const linkType = axisResource as LinkType;
      const collection1 = axisResourcesChain[i - 1] as Collection;
      const collection2 = axisResourcesChain[i + 1] as Collection;
      items.push(
        ...linkType.attributes.map(attribute =>
          linkTypeAttributeToItem(linkType, [collection1, collection2], attribute, i)
        )
      );
    }
  }

  return items;
}

function createAxisResourceChain(query: Query, collections: Collection[], linkTypes: LinkType[]): AxisResource[] {
  const stem = query.stems[0];
  const baseCollection = collections.find(collection => collection.id === stem.collectionId);
  if (!baseCollection) {
    return [];
  }
  const chain = [baseCollection];
  let previousCollectionId = baseCollection.id;
  for (let i = 0; i < (stem.linkTypeIds || []).length; i++) {
    const linkType = linkTypes.find(lt => lt.id === stem.linkTypeIds[i]);
    const otherCollectionId = getOtherLinkedCollectionId(linkType, previousCollectionId);
    const otherCollection = collections.find(collection => collection.id === otherCollectionId);

    if (otherCollection && linkType) {
      chain.push(linkType, otherCollection);
      previousCollectionId = otherCollection.id;
    } else {
      break;
    }
  }

  return chain;
}

function getRestrictedResourceIndexes(config: ChartConfig, axisType: ChartAxisType): number[] {
  if (axisType === ChartAxisType.X) {
    const y1Name = config.names && config.names[ChartAxisType.Y1];
    const y2Name = config.names && config.names[ChartAxisType.Y2];
    return [y1Name && y1Name.resourceIndex, y2Name && y2Name.resourceIndex].filter(value =>
      isNotNullOrUndefined(value)
    );
  }

  const yName = config.names && config.names[axisType];
  return (yName && [yName.resourceIndex]) || [];
}

function getRestrictedCollectionIndexesForDataset(config: ChartConfig, axisType: ChartAxisType): number[] {
  const xAxis = config.axes[ChartAxisType.X];
  const yAxis = config.axes[axisType];

  return [xAxis && xAxis.resourceIndex, yAxis && yAxis.resourceIndex].filter(value => isNotNullOrUndefined(value));
}

export function collectionAttributeToItem(
  collection: Collection,
  attribute: Attribute,
  index?: number
): SelectItemModel {
  const axis: ChartAxis = {
    resourceId: collection.id,
    attributeId: attribute.id,
    resourceType: AttributesResourceType.Collection,
    resourceIndex: index,
  };
  return {id: axis, value: attribute.name, icons: [collection.icon], iconColors: [collection.color]};
}

export function linkTypeAttributeToItem(
  linkType: LinkType,
  collections: [Collection, Collection],
  attribute: Attribute,
  index?: number
): SelectItemModel {
  const axis: ChartAxis = {
    resourceId: linkType.id,
    attributeId: attribute.id,
    resourceType: AttributesResourceType.LinkType,
    resourceIndex: index,
  };
  return {
    id: axis,
    value: attribute.name,
    icons: [collections[0].icon, collections[1].icon],
    iconColors: [collections[0].color, collections[1].color],
  };
}
