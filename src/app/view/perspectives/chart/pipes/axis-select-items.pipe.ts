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

import {Pipe, PipeTransform} from '@angular/core';
import {ChartAxis, ChartAxisType, ChartConfig} from '../../../../core/store/charts/chart';
import {Attribute, Collection} from '../../../../core/store/collections/collection';
import {SelectItemModel} from '../../../../shared/select/select-item/select-item.model';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {Query} from '../../../../core/store/navigation/query';
import {getOtherLinkedCollectionId} from '../../../../shared/utils/link-type.utils';
import {isNotNullOrUndefind} from '../../../../shared/utils/common.utils';

@Pipe({
  name: 'axisSelectItems',
})
export class AxisSelectItemsPipe implements PipeTransform {
  public transform(
    axisType: ChartAxisType,
    config: ChartConfig,
    collections: Collection[],
    linkTypes: LinkType[],
    query: Query
  ): SelectItemModel[] {
    const items: SelectItemModel[] = [];

    const restrictedCollectionIndexes = this.getRestrictedCollectionIndexes(config, axisType);
    const restrictedAxes = Object.entries(config.axes)
      .filter(entry => entry[0] !== axisType)
      .map(entry => entry[1]);

    const stem = query.stems[0];
    const baseCollection = collections.find(collection => collection.id === stem.collectionId);

    if (!restrictedCollectionIndexes.includes(0)) {
      // it's not base collection
      const filteredAttributes = this.filterAttributesByRestrictedAxes(
        baseCollection.attributes,
        baseCollection,
        0,
        restrictedAxes
      );
      items.push(...filteredAttributes.map(attribute => this.attributeToItem(baseCollection, attribute, 0)));
    }

    if ((stem.linkTypeIds || []).length === 0) {
      return items;
    }

    let previousCollection = baseCollection;
    for (let i = 0; i < stem.linkTypeIds.length; i++) {
      const linkType = linkTypes.find(lt => lt.id === stem.linkTypeIds[i]);
      const otherCollectionId = getOtherLinkedCollectionId(linkType, previousCollection.id);
      const otherCollection = collections.find(collection => collection.id === otherCollectionId);

      const collectionIndex = i + 1;
      if (restrictedCollectionIndexes.includes(collectionIndex)) {
        previousCollection = otherCollection;
        continue;
      }

      const filteredAttributes = this.filterAttributesByRestrictedAxes(
        otherCollection.attributes,
        otherCollection,
        collectionIndex,
        restrictedAxes
      );
      items.push(
        ...filteredAttributes.map(attribute =>
          this.linkedAttributeToItem(previousCollection, otherCollection, attribute, collectionIndex)
        )
      );

      previousCollection = otherCollection;
    }

    return items;
  }

  private getRestrictedCollectionIndexes(config: ChartConfig, axisType: ChartAxisType): number[] {
    if (axisType === ChartAxisType.X) {
      const y1Name = config.names && config.names[ChartAxisType.Y1];
      const y2Name = config.names && config.names[ChartAxisType.Y2];
      return [y1Name && y1Name.collectionIndex, y2Name && y2Name.collectionIndex].filter(value =>
        isNotNullOrUndefind(value)
      );
    }

    const yName = config.names && config.names[axisType];
    return (yName && [yName.collectionIndex]) || [];
  }

  private filterAttributesByRestrictedAxes(
    attributes: Attribute[],
    collection: Collection,
    collectionIndex: number,
    restrictedAxes: ChartAxis[]
  ): Attribute[] {
    return (attributes || []).filter(
      attribute =>
        !restrictedAxes.find(
          axis =>
            axis.collectionId === collection.id &&
            axis.attributeId === attribute.id &&
            axis.collectionIndex === collectionIndex
        )
    );
  }

  private attributeToItem(collection: Collection, attribute: Attribute, collectionIndex: number): SelectItemModel {
    const axis: ChartAxis = {collectionId: collection.id, attributeId: attribute.id, collectionIndex};
    return {id: axis, value: attribute.name, icons: [collection.icon], iconColors: [collection.color]};
  }

  private linkedAttributeToItem(
    collectionFrom: Collection,
    collectionTo: Collection,
    attribute: Attribute,
    collectionIndex: number
  ): SelectItemModel {
    const axis: ChartAxis = {collectionId: collectionTo.id, attributeId: attribute.id, collectionIndex};
    return {
      id: axis,
      value: attribute.name,
      icons: [collectionFrom.icon, collectionTo.icon],
      iconColors: [collectionFrom.color, collectionTo.color],
    };
  }
}
