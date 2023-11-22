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

import {Store, select} from '@ngrx/store';

import {forkJoin, switchMap} from 'rxjs';
import {take} from 'rxjs/operators';

import {
  ConditionType,
  Constraint,
  ConstraintData,
  ConstraintType,
  DataResourceChain,
  DocumentsAndLinksData,
  QueryAttribute,
  QueryResource,
  UnknownConstraint,
} from '@lumeer/data-filters';
import {findLastIndex, isArray, isNotNullOrUndefined, objectsByIdMap} from '@lumeer/utils';

import {DataResourcesChain} from '../../shared/modal/data-resource-detail/model/data-resources-chain';
import {ModalService} from '../../shared/modal/modal.service';
import {createRangeInclusive} from '../../shared/utils/array.utils';
import {AttributesResource, AttributesResourceType, DataResource} from '../model/resource';
import {AppState} from '../store/app.state';
import {Collection} from '../store/collections/collection';
import {findAttributeConstraint} from '../store/collections/collection.util';
import {selectDocumentsByCollectionAndQuery} from '../store/common/permissions.selectors';
import {DocumentModel} from '../store/documents/document.model';
import {generateDocumentData} from '../store/documents/document.utils';
import {DocumentsAction} from '../store/documents/documents.action';
import {LinkInstancesAction} from '../store/link-instances/link-instances.action';
import {LinkInstance} from '../store/link-instances/link.instance';
import {LinkType} from '../store/link-types/link.type';
import {Query, QueryStem} from '../store/navigation/query/query';
import {
  getQueryFiltersForCollection,
  getQueryFiltersForLinkType,
  queryStemAttributesResourcesOrder,
} from '../store/navigation/query/query.util';
import {Workspace} from '../store/navigation/workspace';
import {selectViewById} from '../store/views/views.state';

export interface CreateDataResourceData {
  stem: QueryStem;
  grouping: QueryAttributeGrouping[];
  additionalAttributes?: QueryAttribute[];
  queryResource: QueryResource;
  dataResourcesChains: DataResourceChain[][];
  data: Record<string, Record<string, any>>;
  failureMessage: string;
  onCreated?: (dataResource: DataResource) => void;
  onCancel?: () => void;
}

export interface UpdateDataResourceData extends CreateDataResourceData {
  dataResource: DataResource;
  dataResourceChain: DataResourceChain[];
  previousValue: any;
  newValue: any;
  attributeId: string;
}

export interface QueryAttributeGrouping {
  attribute: QueryAttribute;
  value: any;
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

  constructor(
    private store$: Store<AppState>,
    private modalService: ModalService
  ) {}

  public setData(
    data: DocumentsAndLinksData,
    query: Query,
    collections: Collection[],
    linkTypes: LinkType[],
    constraintData: ConstraintData,
    workspace?: Workspace
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
    const groupingAttributes = [
      ...createData.grouping.map(g => g.attribute),
      ...(createData.additionalAttributes || []),
    ];
    const chainRange = createChainRange(createData.queryResource, groupingAttributes);

    if (chainRange.length > 1) {
      const choosePathStems = this.createChoosePathStemsByData(createData, chainRange);
      this.chooseDocumentsPath(
        choosePathStems,
        this.workspace?.viewId,
        documents => {
          const chain = this.createDataResourcesChain(
            createData.stem,
            createData.queryResource,
            createData.data,
            createData.dataResourcesChains,
            chainRange,
            documents,
            createData.failureMessage
          );
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
            createData.onCreated,
            createData.onCancel
          );
        },
        createData.onCancel
      );
    } else {
      const {dataResource, resource} = this.prepareDataResource(
        createData.stem,
        createData.data,
        createData.queryResource.resourceType,
        createData.queryResource.resourceIndex
      );
      this.modalService.showDataResourceDetail(
        dataResource,
        resource,
        this.workspace?.viewId,
        createData.onCreated,
        createData.onCancel
      );
    }
  }

  public update(updateData: UpdateDataResourceData) {
    const groupingAttributes = updateData.grouping.map(g => g.attribute);
    const chainRange = createChainRange(updateData.queryResource, groupingAttributes);
    const resourceType = updateData.queryResource.resourceType;
    if (chainRange.length > 1) {
      const choosePathStems = this.createChoosePathStemsByData(updateData, chainRange);
      this.modalService.showChooseDocumentsPath(
        choosePathStems,
        this.workspace?.viewId,
        documents => {
          const selectedDocuments = [...documents];
          const selectedLinkInstances = [];

          if (resourceType === AttributesResourceType.Collection) {
            selectedDocuments.push(updateData.dataResource as DocumentModel);
            selectedLinkInstances.push(this.findLastLink(updateData));
          } else if (resourceType === AttributesResourceType.LinkType) {
            selectedLinkInstances.push(updateData.dataResource as LinkInstance);
          }
          const chain = this.createDataResourcesChain(
            updateData.stem,
            updateData.queryResource,
            updateData.data,
            updateData.dataResourcesChains,
            chainRange,
            selectedDocuments,
            updateData.failureMessage,
            selectedLinkInstances
          );
          this.store$.dispatch(new DocumentsAction.CreateChain({...chain, workspace: this.workspace}));
        },
        updateData.onCancel
      );
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

  private createChoosePathStemsByData(createData: CreateDataResourceData, chainRange: number[]): QueryStem[] {
    return this.createChoosePathStems(
      createData.stem,
      this.query,
      createData.queryResource,
      createData.grouping,
      createData.additionalAttributes,
      chainRange
    );
  }

  private createChoosePathStems(
    stem: QueryStem,
    query: Query,
    queryResource: QueryResource,
    groupingAttributes: QueryAttributeGrouping[],
    additionalAttributes: QueryAttribute[],
    chainRange: number[]
  ): QueryStem[] {
    const choosePathStems: QueryStem[] = [];
    for (const resourceIndex of chainRange) {
      if (
        isCollectionIndex(resourceIndex) &&
        this.shouldChoosePathStem(queryResource, groupingAttributes, additionalAttributes, resourceIndex)
      ) {
        const grouping = this.getGroupingByResourceIndex(groupingAttributes, resourceIndex);
        const collectionId = this.getResourceInStem(stem, resourceIndex).id;
        const collectionsFilters = getQueryFiltersForCollection(query, collectionId);
        if (grouping?.attribute?.attributeId) {
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

  private shouldChoosePathStem(
    queryResource: QueryResource,
    grouping: QueryAttributeGrouping[],
    attributes: QueryAttribute[],
    resourceIndex: number
  ): boolean {
    if (resourceIndex === queryResource.resourceIndex) {
      return false;
    }

    if (grouping.some(grouping => grouping.attribute.resourceIndex === resourceIndex)) {
      return true;
    }

    if (attributes.some(attribute => attribute.resourceIndex === resourceIndex)) {
      return false;
    }

    return true;
  }

  private createDataResourcesChain(
    stem: QueryStem,
    queryResource: QueryResource,
    dataMap: Record<string, Record<string, any>>,
    dataResourcesChains: DataResourceChain[][],
    chainRange: number[],
    selectedDocuments: DocumentModel[],
    failureMessage = '',
    selectedLinkInstances: LinkInstance[] = []
  ): DataResourcesChain {
    const chainDocuments: DocumentModel[] = [];
    const chainLinkInstances: LinkInstance[] = [];
    let mainIndex: number;

    for (let i = 0; i < chainRange.length; i++) {
      const resourceIndex = chainRange[i];
      const isMainResource = resourceIndex === queryResource.resourceIndex;

      if (isCollectionIndex(resourceIndex)) {
        const {dataResource, resource} = this.prepareDataResource(
          stem,
          dataMap,
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
      const isMainResource = resourceIndex === queryResource.resourceIndex;

      if (isLinkIndex(resourceIndex)) {
        const linkIndex = chainLinkInstances.length;
        const previousDocument = chainDocuments[linkIndex];
        const nextDocument = chainDocuments[linkIndex + 1];
        const {dataResource, resource} = this.prepareDataResource(
          stem,
          dataMap,
          AttributesResourceType.LinkType,
          resourceIndex
        );
        const linkInstance = dataResource as LinkInstance;
        linkInstance.documentIds = [previousDocument?.id, nextDocument?.id];

        if (isMainResource) {
          mainIndex = chainLinkInstances.length;
        }

        const selectedLinkInstance = selectedLinkInstances.find(link => link?.linkTypeId === resource.id);
        if (selectedLinkInstance) {
          chainLinkInstances.push({...selectedLinkInstance, documentIds: linkInstance.documentIds});
        } else {
          if (isMainResource) {
            chainLinkInstances.push(linkInstance);
          } else {
            chainLinkInstances.push(
              this.findLinkInstanceByExistingChains(dataResourcesChains, i, previousDocument, nextDocument) ||
                linkInstance
            );
          }
        }
      }
    }

    return {
      index: mainIndex,
      type: queryResource.resourceType,
      documents: chainDocuments,
      linkInstances: chainLinkInstances,
      failureMessage,
    };
  }

  private prepareDataResource(
    stem: QueryStem,
    dataMap: Record<string, Record<string, any>>,
    resourceType: AttributesResourceType,
    resourceIndex: number
  ): {dataResource: DataResource; resource: AttributesResource} {
    if (resourceType === AttributesResourceType.Collection) {
      const collection = this.getResourceInStem(stem, resourceIndex);
      const collectionsFilters = getQueryFiltersForCollection(this.query, collection.id);
      const queryData = generateDocumentData(collection, collectionsFilters, this.constraintData, false);
      const documentData = {...queryData, ...dataMap[collection.id]};
      const document: DocumentModel = {collectionId: collection.id, data: documentData};
      return {dataResource: document, resource: collection};
    } else {
      const linkType = this.getResourceInStem(stem, resourceIndex);
      const linkTypeFilters = getQueryFiltersForLinkType(this.query, linkType.id);
      const queryData = generateDocumentData(linkType, linkTypeFilters, this.constraintData, false);
      const linkData = {...queryData, ...dataMap[linkType.id]};
      const linkInstance: LinkInstance = {linkTypeId: linkType.id, data: linkData, documentIds: [null, null]};
      return {dataResource: linkInstance, resource: linkType};
    }
  }

  private findLinkInstanceByExistingChains(
    dataResourcesChains: DataResourceChain[][],
    index: number,
    previousDocument: DocumentModel,
    nextDocument: DocumentModel
  ): LinkInstance {
    if (!previousDocument?.id || !nextDocument?.id) {
      return null;
    }
    for (const chain of dataResourcesChains) {
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

  private getGroupingByResourceIndex(grouping: QueryAttributeGrouping[], index: number): QueryAttributeGrouping {
    return grouping.find(gr => gr.attribute.resourceIndex === index);
  }

  public chooseStemConfig<T extends {stem: QueryStem}>(
    stemConfigs: T[],
    callback: (config: T) => void,
    cancel?: () => void
  ) {
    if (stemConfigs.length === 1) {
      callback(stemConfigs[0]);
    } else if (stemConfigs.length) {
      const title = $localize`:@@query.stem.choose:The New Record Belongs to...`;
      this.modalService.showChooseStem(
        stemConfigs.map(config => config.stem),
        title,
        index => {
          callback(stemConfigs[index]);
        },
        cancel
      );
    } else {
      cancel?.();
    }
  }

  public chooseDataResourcesChain(
    stem: QueryStem,
    query: Query,
    queryResource: QueryResource,
    groupingAttributes: QueryAttributeGrouping[],
    dataResourcesChains: DataResourceChain[][],
    viewId: string,
    callback: (chain: DataResourcesChain) => void,
    cancel?: () => void
  ) {
    const chainRange = createChainRange(
      queryResource,
      groupingAttributes.map(g => g.attribute)
    );
    const pathStems = this.createChoosePathStems(stem, query, queryResource, groupingAttributes, [], chainRange);
    this.chooseDocumentsPath(
      pathStems,
      viewId,
      documents => {
        const dataResourcesChain = this.createDataResourcesChain(
          stem,
          queryResource,
          {},
          dataResourcesChains,
          chainRange,
          documents
        );
        callback(dataResourcesChain);
      },
      cancel
    );
  }

  private chooseDocumentsPath(
    pathStems: QueryStem[],
    viewId: string,
    callback: (documents: DocumentModel[]) => void,
    cancel?: () => void
  ) {
    if (!pathStems.length) {
      callback([]);
      return;
    }

    const filterDocumentsObservables = pathStems.map(stem =>
      this.store$.pipe(
        select(selectViewById(viewId)),
        switchMap(view =>
          this.store$.pipe(select(selectDocumentsByCollectionAndQuery(stem.collectionId, {stems: [stem]}, view)))
        ),
        take(1)
      )
    );

    forkJoin(filterDocumentsObservables)
      .pipe(take(1))
      .subscribe(pathsDocuments => {
        const dialogStems = [];
        const dialogStemsOriginalIndexes = [];
        const resultDocuments = [];
        for (let i = 0; i < pathStems.length; i++) {
          const pathDocuments = pathsDocuments[i];
          if (pathDocuments.length === 1) {
            resultDocuments[i] = pathDocuments[0];
          } else {
            dialogStems.push(pathStems[i]);
            dialogStemsOriginalIndexes.push(i);
          }
        }

        if (dialogStems.length > 0) {
          this.modalService.showChooseDocumentsPath(
            dialogStems,
            this.workspace?.viewId,
            chosenDocuments =>
              callback(
                mapPartlyChosenDocumentsFromDialog(chosenDocuments, resultDocuments, dialogStemsOriginalIndexes)
              ),
            cancel
          );
        } else {
          callback(resultDocuments);
        }
      });
  }
}

function mapPartlyChosenDocumentsFromDialog(
  dialogDocuments: DocumentModel[],
  resultDocuments: DocumentModel[],
  dialogStemsOriginalIndexes: number[]
): DocumentModel[] {
  return dialogStemsOriginalIndexes.reduce((result, originalIndex, index) => {
    result[originalIndex] = dialogDocuments[index];
    return result;
  }, resultDocuments);
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
