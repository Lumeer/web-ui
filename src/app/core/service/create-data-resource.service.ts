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
import {
  ConditionType,
  Constraint,
  ConstraintData,
  ConstraintType,
  DocumentsAndLinksData,
  UnknownConstraint,
} from '@lumeer/data-filters';
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
import {findLastIndex, isArray, isNotNullOrUndefined, objectsByIdMap} from '../../shared/utils/common.utils';
import {LinkInstance} from '../store/link-instances/link.instance';
import {DataResourcesChain} from '../../shared/modal/data-resource-detail/model/data-resources-chain';
import {findAttributeConstraint} from '../store/collections/collection.util';
import {DocumentsAction} from '../store/documents/documents.action';
import {LinkInstancesAction} from '../store/link-instances/link-instances.action';

export interface CreateDataResourceData {
  stem: QueryStem;
  grouping: CreateDataResourceDataGrouping[];
  queryResource: QueryResource;
  dataResourcesChains: DataResourceChain[][];
  data: Record<string, Record<string, any>>;
  failureMessage: string;
  onCreated?: (dataResource: DataResource) => void;
}

export interface UpdateDataResourceData extends CreateDataResourceData {
  dataResource: DataResource;
  dataResourceChain: DataResourceChain[];
  previousValue: any;
  newValue: any;
  attributeId: string;
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
    const chainRange = createChainRange(createData.queryResource, groupingAttributes);

    if (chainRange.length > 1) {
      const choosePathStems = this.createChoosePathStems(createData, chainRange);
      this.modalService.showChooseDocumentsPath(choosePathStems, this.workspace?.viewId, documents => {
        const chain = this.createDataResourcesChain(createData, chainRange, documents, []);
        const dataResource =
          chain.type === AttributesResourceType.Collection
            ? chain.documents[chain.index]
            : chain.linkInstances[chain.index];
        const resource = this.getResourceInStem(createData.stem, createData.queryResource.resourceIndex);
        this.modalService.showDataResourceDetailWithChain(
          dataResource,
          resource,
          chain,
          this.workspace?.viewId,
          createData.onCreated
        );
      });
    } else {
      const {dataResource, resource} = this.prepareDataResource(
        createData,
        createData.queryResource.resourceType,
        createData.queryResource.resourceIndex
      );
      this.modalService.showDataResourceDetail(dataResource, resource, this.workspace?.viewId, createData.onCreated);
    }
  }

  public update(updateData: UpdateDataResourceData) {
    const groupingAttributes = updateData.grouping.map(g => g.attribute);
    const chainRange = createChainRange(updateData.queryResource, groupingAttributes);
    const resourceType = updateData.queryResource.resourceType;
    if (chainRange.length > 1) {
      const choosePathStems = this.createChoosePathStems(updateData, chainRange);
      this.modalService.showChooseDocumentsPath(choosePathStems, this.workspace?.viewId, documents => {
        const selectedDocuments = [...documents];
        const selectedLinkInstances = [];

        if (resourceType === AttributesResourceType.Collection) {
          selectedDocuments.push(updateData.dataResource as DocumentModel);
          selectedLinkInstances.push(this.findLastLink(updateData));
        } else if (resourceType === AttributesResourceType.LinkType) {
          selectedLinkInstances.push(updateData.dataResource as LinkInstance);
        }
        const chain = this.createDataResourcesChain(updateData, chainRange, selectedDocuments, selectedLinkInstances);
        this.store$.dispatch(new DocumentsAction.CreateChain({...chain, workspace: this.workspace}));
      });
    } else if (resourceType === AttributesResourceType.Collection) {
      this.updateDocument(updateData);
    } else if (resourceType === AttributesResourceType.LinkType) {
      this.updateLink(updateData);
    }
  }

  private findLastLink(updateData: UpdateDataResourceData): LinkInstance {
    const linkChainIndex = findLastIndex(updateData.dataResourceChain, chain => !!chain.linkInstanceId);
    const linkChain = updateData.dataResourceChain[linkChainIndex];
    return linkChain && (this.data.uniqueLinkInstances || []).find(li => li.id === linkChain.linkInstanceId);
  }

  private updateDocument(updateData: UpdateDataResourceData) {
    const document = <DocumentModel>updateData.dataResource;
    const collection = (this.collections || []).find(coll => coll.id === document.collectionId);
    const attributeId = updateData.attributeId;
    const constraint = findAttributeConstraint(collection?.attributes, attributeId);
    const value = createValueByConstraint(
      constraint,
      updateData.newValue,
      updateData.previousValue,
      document.data?.[attributeId]
    );
    const data = {...document.data, [attributeId]: value};
    this.store$.dispatch(new DocumentsAction.PatchData({document: {...document, data}, workspace: this.workspace}));
  }

  private updateLink(updateData: UpdateDataResourceData) {
    const linkInstance = <LinkInstance>updateData.dataResource;
    const linkType = (this.linkTypes || []).find(coll => coll.id === linkInstance.linkTypeId);
    const attributeId = updateData.attributeId;
    const constraint = findAttributeConstraint(linkType?.attributes, attributeId);
    const value = createValueByConstraint(
      constraint,
      updateData.newValue,
      updateData.previousValue,
      linkInstance.data?.[attributeId]
    );
    const data = {...linkInstance.data, [attributeId]: value};
    this.store$.dispatch(
      new LinkInstancesAction.PatchData({linkInstance: {...linkInstance, data}, workspace: this.workspace})
    );
  }

  private createChoosePathStems(createData: CreateDataResourceData, chainRange: number[]): QueryStem[] {
    const choosePathStems: QueryStem[] = [];
    for (const resourceIndex of chainRange) {
      if (isCollectionIndex(resourceIndex) && resourceIndex !== createData.queryResource.resourceIndex) {
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
    selectedDocuments: DocumentModel[],
    selectedLinkInstances: LinkInstance[]
  ): DataResourcesChain {
    const chainDocuments: DocumentModel[] = [];
    const chainLinkInstances: LinkInstance[] = [];
    let mainIndex: number;

    for (let i = 0; i < chainRange.length; i++) {
      const resourceIndex = chainRange[i];
      const isMainResource = resourceIndex === createData.queryResource.resourceIndex;

      if (isCollectionIndex(resourceIndex)) {
        const {dataResource, resource} = this.prepareDataResource(
          createData,
          AttributesResourceType.Collection,
          resourceIndex
        );
        const selectedDocument = selectedDocuments.find(doc => doc?.collectionId === resource.id);
        if (isMainResource) {
          mainIndex = chainDocuments.length;
        }
        chainDocuments.push(selectedDocument || (dataResource as DocumentModel));
      }
    }

    for (let i = 0; i < chainRange.length; i++) {
      const resourceIndex = chainRange[i];
      const isMainResource = resourceIndex === createData.queryResource.resourceIndex;

      if (isLinkIndex(resourceIndex)) {
        const linkIndex = chainLinkInstances.length;
        const previousDocument = chainDocuments[linkIndex];
        const nextDocument = chainDocuments[linkIndex + 1];
        const {dataResource, resource} = this.prepareDataResource(
          createData,
          AttributesResourceType.LinkType,
          resourceIndex
        );
        const selectedLinkInstance = selectedLinkInstances.find(link => link?.linkTypeId === resource.id);

        if (isMainResource) {
          mainIndex = chainLinkInstances.length;
        }

        if (selectedLinkInstance) {
          chainLinkInstances.push({...selectedLinkInstance, documentIds: [previousDocument?.id, nextDocument?.id]});
        } else {
          if (isMainResource) {
            chainLinkInstances.push(dataResource as LinkInstance);
          } else {
            chainLinkInstances.push(
              this.findLinkInstanceByExistingChains(createData, i, previousDocument, nextDocument) ||
                (dataResource as LinkInstance)
            );
          }
        }
      }
    }

    return {
      index: mainIndex,
      type: createData.queryResource.resourceType,
      documents: chainDocuments,
      linkInstances: chainLinkInstances,
      failureMessage: createData.failureMessage,
    };
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

function createValueByConstraint(
  constraint: Constraint,
  newValue: any,
  previousValue?: any,
  documentValue?: any,
  constraintData?: ConstraintData
): any {
  if (
    constraint &&
    (constraint.type === ConstraintType.Select ||
      constraint.type === ConstraintType.User ||
      constraint.type === ConstraintType.View) &&
    isNotNullOrUndefined(previousValue) &&
    isArray(documentValue)
  ) {
    const changedIndex = documentValue.findIndex(value => String(value) === String(previousValue));
    const newArray = [...documentValue];
    if (newArray.some(value => String(value) === String(newValue))) {
      newArray.splice(changedIndex, 1);
    } else {
      newArray[changedIndex] = newValue;
    }
    return constraint.createDataValue(newArray, constraintData).serialize();
  } else {
    return (constraint || new UnknownConstraint()).createDataValue(newValue).serialize();
  }
}

function isCollectionIndex(index: number): boolean {
  return index % 2 === 0;
}

function isLinkIndex(index: number): boolean {
  return index % 2 === 1;
}
