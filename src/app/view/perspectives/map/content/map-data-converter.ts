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

import {Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {AllowedPermissionsMap} from '../../../../core/model/allowed-permissions';
import {Query} from '../../../../core/store/navigation/query/query';
import {
  DataObjectAggregator,
  DataObjectAttribute,
  DataObjectInfo,
} from '../../../../shared/utils/data/data-object-aggregator';
import {MapAttributeModel, MapConfig, MapMarkerData, MapStemConfig} from '../../../../core/store/maps/map.model';
import {mapMarkerDataId} from './map-content.utils';

enum DataObjectInfoKeyType {
  Color = 'color',
  Attribute = 'attribute',
}

export class MapDataConverter {
  private config: MapConfig;

  private dataObjectAggregator = new DataObjectAggregator<any>();

  public convert(
    config: MapConfig,
    collections: Collection[],
    documents: DocumentModel[],
    linkTypes: LinkType[],
    linkInstances: LinkInstance[],
    permissions: AllowedPermissionsMap,
    query: Query
  ): MapMarkerData[] {
    this.config = config;

    const data = (query?.stems || []).reduce((allData, stem, index) => {
      this.dataObjectAggregator.updateData(collections, documents, linkTypes, linkInstances, stem, permissions);
      allData.push(...this.convertByStem(index));
      return allData;
    }, []);
    return filterUniqueData(data);
  }

  private convertByStem(index: number): MapMarkerData[] {
    const stemConfig = this.config?.stemsConfigs?.[index];
    return this.aggregateStem(stemConfig, index);
  }

  private aggregateStem(stemConfig: MapStemConfig, index: number) {
    const metaAttributes: DataObjectAttribute[] = stemConfig.color
      ? [
          {
            ...stemConfig.color,
            key: DataObjectInfoKeyType.Color,
          },
        ]
      : [];

    return (stemConfig?.attributes || [])
      .filter(attr => !!attr)
      .reduce((data, attribute) => {
        const objectAttributes = [{...attribute, key: DataObjectInfoKeyType.Attribute}];

        const dataObjectsInfo = this.dataObjectAggregator.convert({
          groupingAttributes: [],
          objectAttributes,
          metaAttributes,
        });
        data.push(...this.createMapDataForStem(attribute, stemConfig, dataObjectsInfo));
        return data;
      }, []);
  }

  private createMapDataForStem(
    attribute: MapAttributeModel,
    stemConfig: MapStemConfig,
    dataObjectsInfo: DataObjectInfo<any>[]
  ): MapMarkerData[] {
    const resource = this.dataObjectAggregator.getResource(attribute);
    const resourceColor = this.dataObjectAggregator.getAttributeResourceColor(attribute);
    const resourceIcons = this.dataObjectAggregator.getAttributeIcons(attribute);
    const editable = this.dataObjectAggregator.isAttributeEditable(attribute);
    const resourceType = attribute.resourceType;

    return dataObjectsInfo.reduce<MapMarkerData[]>((data, item) => {
      const dataResource = item.objectDataResources[DataObjectInfoKeyType.Attribute];

      const colorDataResources = item.metaDataResources[DataObjectInfoKeyType.Color] || [];
      const color = this.dataObjectAggregator.getAttributeColor(stemConfig.color, colorDataResources) || resourceColor;

      data.push({
        resource,
        dataResource,
        resourceType,
        color,
        editable,
        attributeId: attribute.attributeId,
        icons: resourceIcons,
      });
      return data;
    }, []);
  }
}

function filterUniqueData(allData: MapMarkerData[]): MapMarkerData[] {
  const usedIds = new Set();
  const filteredData = [];
  for (const data of allData) {
    const id = mapMarkerDataId(data);
    if (usedIds.has(id)) {
      continue;
    }
    usedIds.add(id);
    filteredData.push(data);
  }

  return filteredData;
}
