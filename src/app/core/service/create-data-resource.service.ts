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
import {ConditionType, ConstraintData, DocumentsAndLinksData} from '@lumeer/data-filters';
import {LinkType} from '../store/link-types/link.type';
import {Workspace} from '../store/navigation/workspace';
import {DocumentModel} from '../store/documents/document.model';
import {generateDocumentData} from '../store/documents/document.utils';
import {AttributesResource, AttributesResourceType, DataResource} from '../model/resource';
import {DataResourceChain} from '../../shared/utils/data/data-aggregator';
import {createRangeInclusive} from '../../shared/utils/array.utils';
import {
  getQueryFiltersForCollection,
  getQueryFiltersForLinkType,
  queryStemAttributesResourcesOrder,
} from '../store/navigation/query/query.util';
import {objectsByIdMap} from '../../shared/utils/common.utils';
import {LinkInstance} from '../store/link-instances/link.instance';
import {DataResourcesChain} from '../../shared/modal/data-resource-detail/model/data-resources-chain';

export interface CreateDataResourceData {
  stem: QueryStem;
  grouping: CreateDataResourceDataGrouping[];
  resource: QueryResource;
  dataResourcesChains: DataResourceChain[][];
  data: Record<string, Record<string, any>>;
  failureMessage: string;
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
  private collectionsMap: Record<string, Collection>;
  private linkTypes: LinkType[];
  private constraintData: ConstraintData;
  private workspace: Workspace;

  constructor(private store$: Store<AppState>, private modalService: ModalService) {}

  public setData(
    data: DocumentsAndLinksData,
    query: Query,
    collections: Collection[],
    linkTypes: LinkType[],
    constraintData: ConstraintData,
    workspace: Workspace
  ) {
    this.data = data;
    this.query = query;
    this.collections = collections;
    this.collectionsMap = objectsByIdMap(collections);
    this.linkTypes = linkTypes;
    this.constraintData = constraintData;
    this.workspace = workspace;
  }

  public create(createData: CreateDataResourceData) {
    const groupingAttributes = createData.grouping.map(g => g.attribute);
    const chainRange = createChainRange(createData.resource, groupingAttributes);

    if (chainRange.length > 1) {
      const choosePathStems = this.createChoosePathStems(createData, chainRange);
      this.modalService.showChooseDocumentsPath(choosePathStems, this.workspace?.viewId, documents => {
        const chain = this.createDataResourcesChain(createData, chainRange, documents);
        const dataResource =
          chain.type === AttributesResourceType.Collection
            ? chain.documents[chain.index]
            : chain.linkInstances[chain.index];
        const resource = this.getResourceInStem(createData.stem, createData.resource.resourceIndex);
        this.modalService.showDataResourceDetailWithChain(dataResource, resource, chain, this.workspace?.viewId);
      });
    } else {
      const {dataResource, resource} = this.prepareDataResource(
        createData,
        createData.resource.resourceType,
        createData.resource.resourceIndex
      );
      this.modalService.showDataResourceDetail(dataResource, resource, this.workspace?.viewId);
    }
  }

  private createChoosePathStems(createData: CreateDataResourceData, chainRange: number[]): QueryStem[] {
    const choosePathStems: QueryStem[] = [];
    for (const resourceIndex of chainRange) {
      if (isCollectionIndex(resourceIndex) && resourceIndex !== createData.resource.resourceIndex) {
        const grouping = this.getGroupingByResourceIndex(createData, resourceIndex);
        const collectionId = this.getResourceInStem(createData.stem, resourceIndex).id;
        const collectionsFilters = getQueryFiltersForCollection(this.query, collectionId);
        if (grouping) {
          collectionsFilters.push({
            attributeId: grouping.attribute.attributeId,
            collectionId: grouping.attribute.resourceId,
            condition: ConditionType.Equals,
            conditionValues: [{value: grouping.value}],
          });
        }

        choosePathStems.push({collectionId, filters: collectionsFilters});
      }
    }
    return choosePathStems;
  }

  private createDataResourcesChain(
    createData: CreateDataResourceData,
    chainRange: number[],
    selectedDocuments: DocumentModel[]
  ): DataResourcesChain {
    const chainDocuments: DocumentModel[] = [];
    const chainLinkInstances: LinkInstance[] = [];
    let mainIndex: number;

    for (let i = 0; i < chainRange.length; i++) {
      const resourceIndex = chainRange[i];
      const isMainResource = resourceIndex === createData.resource.resourceIndex;
      const resource = this.getResourceInStem(createData.stem, resourceIndex);

      if (isCollectionIndex(resourceIndex)) {
        const {dataResource} = this.prepareDataResource(createData, AttributesResourceType.Collection, resourceIndex);
        if (isMainResource) {
          mainIndex = chainDocuments.length;
          chainDocuments.push(dataResource as DocumentModel);
        } else {
          const selectedDocument = selectedDocuments.find(doc => doc.collectionId === resource.id) || dataResource;
          chainDocuments.push(selectedDocument as DocumentModel);
        }
      }
    }

    for (let i = 0; i < chainRange.length; i++) {
      const resourceIndex = chainRange[i];
      const isMainResource = resourceIndex === createData.resource.resourceIndex;

      if (isLinkIndex(resourceIndex)) {
        const {dataResource} = this.prepareDataResource(createData, AttributesResourceType.LinkType, resourceIndex);
        if (isMainResource) {
          mainIndex = chainLinkInstances.length;
          chainLinkInstances.push(dataResource as LinkInstance);
        } else {
          const linkIndex = chainLinkInstances.length;
          const previousDocument = chainDocuments[linkIndex];
          const nextDocument = chainDocuments[linkIndex + 1];
          const linkInstance =
            this.findLinkInstanceByExistingChains(createData, i, previousDocument, nextDocument) || dataResource;
          chainLinkInstances.push(linkInstance as LinkInstance);
        }
      }
    }

    return {
      index: mainIndex,
      type: createData.resource.resourceType,
      documents: chainDocuments,
      linkInstances: chainLinkInstances,
      failureMessage: createData.failureMessage,
    };
  }

  private findLinkInstanceByExistingChains(
    createData: CreateDataResourceData,
    index: number,
    previousDocument: DocumentModel,
    nextDocument: DocumentModel
  ): LinkInstance {
    if (!previousDocument?.id || !nextDocument?.id) {
      return null;
    }
    for (const chain of createData.dataResourcesChains) {
      if (chain[index - 1]?.documentId === previousDocument.id && chain[index + 1]?.documentId === nextDocument.id) {
        const linkInstanceId = chain[index]?.linkInstanceId;
        return this.data.uniqueLinkInstances.find(linkInstance => linkInstance.id === linkInstanceId);
      }
    }
    return null;
  }

  private prepareDataResource(
    createData: CreateDataResourceData,
    resourceType: AttributesResourceType,
    resourceIndex: number
  ): {dataResource: DataResource; resource: AttributesResource} {
    if (resourceType === AttributesResourceType.Collection) {
      const collection = this.getResourceInStem(createData.stem, resourceIndex);
      const collectionsFilters = getQueryFiltersForCollection(this.query, collection.id);
      const queryData = generateDocumentData(collection, collectionsFilters, this.constraintData, false);
      const documentData = {...queryData, ...createData.data[collection.id]};
      const document: DocumentModel = {collectionId: collection.id, data: documentData};
      return {dataResource: document, resource: collection};
    } else {
      const linkType = this.getResourceInStem(createData.stem, resourceIndex);
      const linkTypeFilters = getQueryFiltersForLinkType(this.query, linkType.id);
      const queryData = generateDocumentData(linkType, linkTypeFilters, this.constraintData, false);
      const linkData = {...queryData, ...createData.data[linkType.id]};
      const linkInstance: LinkInstance = {linkTypeId: linkType.id, data: linkData, documentIds: [null, null]};
      return {dataResource: linkInstance, resource: linkType};
    }
  }

  private getResourceInStem(stem: QueryStem, index: number): AttributesResource {
    const attributesResourcesOrder = queryStemAttributesResourcesOrder(stem, this.collections, this.linkTypes);
    return attributesResourcesOrder[index];
  }

  private getGroupingByResourceIndex(data: CreateDataResourceData, index: number): CreateDataResourceDataGrouping {
    return data.grouping.find(gr => gr.attribute.resourceIndex === index);
  }
}

function createChainRange(resource: QueryResource, attributes: QueryAttribute[]): number[] {
  let fromIndex = resource.resourceIndex;
  let toIndex = resource.resourceIndex;

  for (const attribute of attributes) {
    if (attribute.resourceIndex < fromIndex) {
      fromIndex = attribute.resourceIndex;
    }
    if (attribute.resourceIndex > toIndex) {
      toIndex = attribute.resourceIndex;
    }
  }

  if (isLinkIndex(fromIndex % 2)) {
    fromIndex += fromIndex <= toIndex ? -1 : 1;
  }

  if (isLinkIndex(toIndex)) {
    toIndex += fromIndex < toIndex ? 1 : -1;
  }

  if (fromIndex === toIndex) {
    return [fromIndex];
  }

  return createRangeInclusive(fromIndex, toIndex);
}

function isCollectionIndex(index: number): boolean {
  return index % 2 === 0;
}

function isLinkIndex(index: number): boolean {
  return index % 2 === 1;
}
