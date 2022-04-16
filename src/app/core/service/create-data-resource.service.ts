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

import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../store/app.state';
import {ModalService} from '../../shared/modal/modal.service';
import {Query, QueryStem} from '../store/navigation/query/query';
import {QueryAttribute, QueryResource} from '../model/query-attribute';
import {Collection} from '../store/collections/collection';
import {ConditionType, ConstraintData, DocumentsAndLinksData, filterDocumentsAndLinksByStem} from '@lumeer/data-filters';
import {LinkType} from '../store/link-types/link.type';
import {Workspace} from '../store/navigation/workspace';
import {DocumentModel} from '../store/documents/document.model';
import {groupDocumentsByCollection} from '../store/documents/document.utils';
import {groupLinkInstancesByLinkTypes} from '../store/link-instances/link-instance.utils';
import {ResourcesPermissions} from '../model/allowed-permissions';
import {AttributesResourceType} from '../model/resource';
import {DataResourceChain} from '../../shared/utils/data/data-aggregator';
import {createRangeInclusive, uniqueValues} from '../../shared/utils/array.utils';
import {KanbanCreateResource} from '../../view/perspectives/kanban/util/kanban-data';
import {queryStemAttributesResourcesOrder} from '../store/navigation/query/query.util';

export interface CreateDataResourceData {
  stem: QueryStem;
  grouping: CreateDataResourceDataGrouping[];
  resource: QueryResource;
  dataResourcesChains: DataResourceChain[][];
}

export interface CreateDataResourceDataGrouping {
  attribute: QueryAttribute;
  value: any;
  data?: Record<string, any>;
}

@Injectable({
  providedIn: 'root',
})
export class CreateDataResourceService {

  private data: DocumentsAndLinksData;
  private query: Query;
  private collections: Collection[];
  private linkTypes: LinkType[];
  private constraintData: ConstraintData;
  private permissions: ResourcesPermissions;
  private workspace: Workspace;

  constructor(private store$: Store<AppState>, private modalService: ModalService) {
  }

  public setData(data: DocumentsAndLinksData, query: Query, collections: Collection[], linkTypes: LinkType[], permissions: ResourcesPermissions, constraintData: ConstraintData, workspace: Workspace) {
    this.data = data;
    this.query = query;
    this.collections = collections;
    this.linkTypes = linkTypes;
    this.constraintData = constraintData;
    this.workspace = workspace;
  }

  public create(data: CreateDataResourceData) {
    const groupingAttributes = data.grouping.map(g => g.attribute);
    const chainRange = createChainRange(data.resource, groupingAttributes);
    console.log(chainRange);
    if (chainRange.length > 1) {
      const documentIdsArray = [];
      const collectionIds = [];
      for (const resourceIndex of chainRange) {
        if (resourceIndex % 2 === 0) {
          const grouping = this.getGroupingByResourceIndex(data, resourceIndex);
          const documents = this.getPreviousOrNextDocuments(data.stem, data.resource, grouping?.attribute || {resourceIndex}, grouping?.value);
          const ids = uniqueValues(documents.map(document => document.id));
          documentIdsArray.push(ids);
          collectionIds.push(this.getCollectionInStem(data.stem, resourceIndex).id);
        }
      }

      this.modalService.showChooseDocumentsPath(documentIdsArray, collectionIds, this.workspace?.viewId, documents => {
        console.log(documents);
      })

    } else {
      // TODO create document or link basic
    }

  }

  private getCollectionInStem(stem: QueryStem, index: number): Collection {
    const attributesResourcesOrder = queryStemAttributesResourcesOrder(
      stem,
      this.collections,
      this.linkTypes
    );
    return attributesResourcesOrder[index];
  }

  private getGroupingByResourceIndex(data: CreateDataResourceData, index: number): CreateDataResourceDataGrouping {
    return data.grouping.find(gr => gr.attribute.resourceIndex === index);
  }

  private getPreviousOrNextDocuments(
    stem: QueryStem,
    resource: QueryResource,
    attribute?: Partial<QueryAttribute>,
    value?: any
  ): DocumentModel[] {
    const offset = attribute.resourceIndex > resource.resourceIndex ? +1 : 0;
    const pipelineIndex = Math.floor((attribute.resourceIndex + offset) / 2);

    const linkFilters = [...(stem.linkFilters || [])];
    const filters = [...(stem.filters || [])];
    if (attribute?.resourceType === AttributesResourceType.Collection) {
      filters.push({
        attributeId: attribute.attributeId,
        collectionId: attribute.resourceId,
        condition: ConditionType.Equals,
        conditionValues: [{value}],
      });
    } else if (attribute?.resourceType === AttributesResourceType.LinkType) {
      linkFilters.push({
        attributeId: attribute.attributeId,
        linkTypeId: attribute.resourceId,
        condition: ConditionType.Equals,
        conditionValues: [{value}],
      });
    }

    return this.getPipelineDocuments(pipelineIndex, {...stem, filters, linkFilters});
  }

  private getPipelineDocuments(pipelineIndex: number, stem: QueryStem): DocumentModel[] {
    const {pipelineDocuments} = filterDocumentsAndLinksByStem(
      this.collections,
      groupDocumentsByCollection(this.data?.uniqueDocuments),
      this.linkTypes,
      groupLinkInstancesByLinkTypes(this.data?.uniqueLinkInstances),
      this.permissions?.collections,
      this.permissions?.linkTypes,
      this.constraintData,
      stem,
      this.query?.fulltexts || []
    );
    return pipelineDocuments[pipelineIndex] || [];
  }
}

function createChainRange(resource: QueryResource, attributes: QueryAttribute[]): number[] {
  if (!attributes.length) {
    return [resource.resourceIndex];
  }

  let fromIndex = resource.resourceIndex;
  let toIndex = resource.resourceIndex;

  for (const attribute of attributes) {
    if (attribute.resourceIndex < fromIndex) {
      fromIndex = attribute.resourceIndex;
      if (attribute.resourceType === AttributesResourceType.LinkType) {
        fromIndex += fromIndex < toIndex ? -1 : 1;
      }
    }
    if (attribute.resourceIndex > toIndex) {
      toIndex = attribute.resourceIndex;
      if (resource.resourceType === AttributesResourceType.LinkType) {
        toIndex += fromIndex < toIndex ? 1 : -1;
      }
    }
  }

  return createRangeInclusive(fromIndex, toIndex);
}
