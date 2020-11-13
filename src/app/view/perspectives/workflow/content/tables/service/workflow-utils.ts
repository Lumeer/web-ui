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

import {WorkflowStemConfig} from '../../../../../../core/store/workflows/workflow';
import {Collection} from '../../../../../../core/store/collections/collection';
import {AllowedPermissions} from '../../../../../../core/model/allowed-permissions';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {queryStemAttributesResourcesOrder} from '../../../../../../core/store/navigation/query/query.util';
import {queryAttributePermissions} from '../../../../../../core/model/query-attribute';
import {AttributesResourceType} from '../../../../../../core/model/resource';
import {AggregatedDataItem} from '../../../../../../shared/utils/data/data-aggregator';
import {uniqueValues} from '../../../../../../shared/utils/array.utils';
import {TABLE_ROW_HEIGHT} from '../../../../../../shared/table/model/table-model';
import {generateId} from '../../../../../../shared/utils/resource.utils';
import {TableNewRow} from '../../../../../../shared/table/model/table-row';

export function createEmptyNewRow(tableId: string): TableNewRow {
  const id = generateId();
  return {
    id,
    tableId,
    data: null,
    correlationId: id,
    height: TABLE_ROW_HEIGHT,
    documentMenuItems: [],
    linkMenuItems: [],
  };
}

export function createLinkTypeData(
  stemConfig: WorkflowStemConfig,
  collections: Collection[],
  permissions: Record<string, AllowedPermissions>,
  linkTypesMap: Record<string, LinkType>
): {linkType?: LinkType; permissions?: AllowedPermissions} {
  if (stemConfig?.attribute && stemConfig.collection.resourceIndex !== stemConfig.attribute.resourceIndex) {
    const attributesResourcesOrder = queryStemAttributesResourcesOrder(
      stemConfig.stem,
      collections,
      Object.values(linkTypesMap)
    );
    const resourceIndex = stemConfig.collection.resourceIndex;
    const linkIndex = resourceIndex + (resourceIndex < stemConfig.attribute.resourceIndex ? 1 : -1);
    const linkType = <LinkType>attributesResourcesOrder[linkIndex];
    const linkTypePermissions = queryAttributePermissions(
      {
        resourceId: linkType.id,
        resourceType: AttributesResourceType.LinkType,
      },
      permissions,
      linkTypesMap
    );
    return {linkType, permissions: linkTypePermissions};
  }
  return {};
}

export function createLinkingCollectionId(
  stemConfig: WorkflowStemConfig,
  collections: Collection[],
  linkTypesMap: Record<string, LinkType>
): string | null {
  const isNearResource =
    stemConfig.attribute && Math.abs(stemConfig.collection.resourceIndex - stemConfig.attribute?.resourceIndex) === 1;
  if (isNearResource) {
    const attributesResourcesOrder = queryStemAttributesResourcesOrder(
      stemConfig.stem,
      collections,
      Object.values(linkTypesMap)
    );
    const resourceIndex = stemConfig.collection.resourceIndex;
    const collectionIndex = resourceIndex + (resourceIndex < stemConfig.attribute.resourceIndex ? 2 : -2);
    return attributesResourcesOrder[collectionIndex]?.id;
  }
  return null;
}

export function createAggregatedLinkingDocumentsIds(item: AggregatedDataItem, childItem: AggregatedDataItem): string[] {
  const linkingDocumentIds = [];
  for (const parentChain of item.dataResourcesChains) {
    for (const childChain of childItem.dataResourcesChains) {
      const chain = [...parentChain, ...childChain];
      if (chain.length > 2) {
        // sequence of documentId, linkId, documentId
        chain.reverse();
        // skip first documentId which is showed in table
        const documentId = chain.slice(1).find(ch => ch.documentId)?.documentId;
        if (documentId) {
          linkingDocumentIds.push(documentId);
        }
      }
    }
  }
  return uniqueValues(linkingDocumentIds);
}
