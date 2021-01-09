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

import {DocumentModel} from './document.model';
import {groupDocumentsByCollection, mergeDocuments} from './document.utils';
import {queryIsEmptyExceptPagination, queryStemAttributesResourcesOrder} from '../navigation/query/query.util';
import {Attribute, Collection} from '../collections/collection';
import {LinkType} from '../link-types/link.type';
import {LinkInstance} from '../link-instances/link.instance';
import {escapeHtml, isNullOrUndefined, objectsByIdMap, objectValues} from '../../../shared/utils/common.utils';
import {ConstraintType} from '../../model/data/constraint';
import {Query, QueryStem} from '../navigation/query/query';
import {groupLinkInstancesByLinkTypes, mergeLinkInstances} from '../link-instances/link-instance.utils';
import {AttributesResource, AttributesResourceType, DataResource} from '../../model/resource';
import {getAttributesResourceType, hasRoleByPermissions} from '../../../shared/utils/resource.utils';
import {DataValue} from '../../model/data-value';
import {AttributeFilter, ConditionType, EquationOperator} from '../../model/attribute-filter';
import {AllowedPermissions} from '../../model/allowed-permissions';
import {ActionConstraintConfig} from '../../model/data/constraint-config';
import {filterAttributesByFilters} from '../../../shared/utils/attribute.utils';

interface FilteredDataResources {
  allDocuments: DocumentModel[];
  pipelineDocuments: DocumentModel[][];
  allLinkInstances: LinkInstance[];
  pipelineLinkInstances: LinkInstance[][];
}

interface FilterPipeline {
  resource: AttributesResource;
  dataResources: DataResource[];
  filters: AttributeFilter[];
  fulltexts: string[];
  attributes: Attribute[];
  permissions: AllowedPermissions;
}

export function filterDocumentsAndLinksByQuery(
  documents: DocumentModel[],
  collections: Collection[],
  linkTypes: LinkType[],
  linkInstances: LinkInstance[],
  query: Query,
  collectionsPermissions: Record<string, AllowedPermissions>,
  linkTypePermissions: Record<string, AllowedPermissions>,
  includeChildren?: boolean
): {documents: DocumentModel[]; linkInstances: LinkInstance[]} {
  if (!query || queryIsEmptyExceptPagination(query)) {
    return {documents: paginate(documents, query), linkInstances};
  }

  let documentsByStems: DocumentModel[] = [];
  let linkInstancesByStems: LinkInstance[] = [];

  const stems =
    (query.stems || []).length > 0
      ? [...query.stems]
      : (collections || []).map(collection => ({collectionId: collection.id}));
  const documentsByCollections = groupDocumentsByCollection(documents);
  const linkInstancesByLinkTypes = groupLinkInstancesByLinkTypes(linkInstances);

  const escapedFulltexts = query.fulltexts?.map(fullText => escapeHtml(fullText));
  stems.forEach(stem => {
    const {allDocuments, allLinkInstances} = filterDocumentsAndLinksByStem(
      collections,
      documentsByCollections,
      linkTypes,
      linkInstancesByLinkTypes,
      collectionsPermissions,
      linkTypePermissions,
      stem,
      escapedFulltexts,
      includeChildren
    );
    documentsByStems = mergeDocuments(documentsByStems, allDocuments);
    linkInstancesByStems = mergeLinkInstances(linkInstancesByStems, allLinkInstances);
  });

  return {documents: paginate(documentsByStems, query), linkInstances: linkInstancesByStems};
}

export function filterDocumentsAndLinksByStem(
  collections: Collection[],
  documentsByCollections: Record<string, DocumentModel[]>,
  linkTypes: LinkType[],
  linkInstancesByLinkTypes: Record<string, LinkInstance[]>,
  collectionsPermissions: Record<string, AllowedPermissions>,
  linkTypePermissions: Record<string, AllowedPermissions>,
  stem: QueryStem,
  fulltexts: string[] = [],
  includeChildren?: boolean
): FilteredDataResources {
  const filtered: FilteredDataResources = {
    allDocuments: [],
    pipelineDocuments: [],
    allLinkInstances: [],
    pipelineLinkInstances: [],
  };

  const attributesResources = queryStemAttributesResourcesOrder(stem, collections, linkTypes);
  const pipeline: FilterPipeline[] = attributesResources.map(resource => {
    const type = getAttributesResourceType(resource);
    const filters =
      type === AttributesResourceType.Collection
        ? (stem.filters || []).filter(filter => filter.collectionId === resource.id)
        : (stem.linkFilters || []).filter(filter => filter.linkTypeId === resource.id);
    const dataResources =
      type === AttributesResourceType.Collection
        ? documentsByCollections[resource.id] || []
        : linkInstancesByLinkTypes[resource.id] || [];
    const permissions =
      type === AttributesResourceType.Collection
        ? collectionsPermissions?.[resource.id]
        : linkTypePermissions?.[resource.id];

    const attributes = filterAttributesByFilters(resource.attributes, filters);

    return {resource, fulltexts, filters, dataResources, permissions, attributes};
  });

  if (!pipeline[0]) {
    return filtered;
  }

  const pushedIds = new Set();
  const attributesMap = objectsByIdMap(pipeline[0].resource?.attributes);
  for (const dataResource of pipeline[0].dataResources) {
    if (dataValuesMeetsFilters(dataResource.dataValues, pipeline[0].filters, attributesMap, pipeline[0].permissions)) {
      const searchDocuments = includeChildren
        ? getDocumentsWithChildren(dataResource as DocumentModel, pipeline[0].dataResources as DocumentModel[])
        : [dataResource as DocumentModel];
      for (const document of searchDocuments) {
        if (
          !pushedIds.has(document.id) &&
          checkAndFillDataResources(
            document,
            pipeline,
            filtered,
            1,
            !pipeline[0].fulltexts.length || dataMeetsFulltexts(dataResource.dataValues, pipeline[0].fulltexts)
          )
        ) {
          pushedIds.add(document.id);
          filtered.allDocuments.push(<DocumentModel>document);
          pushToMatrix(filtered.pipelineDocuments, document, 0);
        }
      }
    }
  }

  return filtered;
}

function pushToMatrix(matrix: any[][], value: any, index: number) {
  if (!matrix[index]) {
    matrix[index] = [];
  }
  matrix[index].push(value);
}

function checkAndFillDataResources(
  previousDataResource: DataResource,
  pipeline: FilterPipeline[],
  filtered: FilteredDataResources,
  pipelineIndex: number,
  fulltextFound: boolean
): boolean {
  if (pipelineIndex >= pipeline.length) {
    return !pipeline[0].fulltexts.length || fulltextFound;
  }

  const currentPipeline = pipeline[pipelineIndex];
  const type = getAttributesResourceType(currentPipeline.resource);
  if (type === AttributesResourceType.LinkType) {
    const previousDocument = previousDataResource as DocumentModel;
    const linkInstances = pipeline[pipelineIndex].dataResources as LinkInstance[];
    const linkedLinks = linkInstances.filter(
      linkInstance =>
        linkInstance.documentIds.includes(previousDocument.id) &&
        dataValuesMeetsFilters(
          linkInstance.dataValues,
          currentPipeline.filters,
          objectsByIdMap(currentPipeline.attributes),
          currentPipeline.permissions
        )
    );
    if (linkedLinks.length === 0 && containsAnyFilterInPipeline(pipeline, pipelineIndex)) {
      return false;
    }

    let someLinkPassed = (!currentPipeline.fulltexts.length || fulltextFound) && linkedLinks.length === 0;
    for (const linkedLink of linkedLinks) {
      if (
        checkAndFillDataResources(
          linkedLink,
          pipeline,
          filtered,
          pipelineIndex + 1,
          fulltextFound || dataMeetsFulltexts(linkedLink.dataValues, currentPipeline.fulltexts)
        )
      ) {
        someLinkPassed = true;
        filtered.allLinkInstances.push(linkedLink);
        pushToMatrix(filtered.pipelineLinkInstances, linkedLink, Math.floor(pipelineIndex / 2));
      }
    }
    return someLinkPassed;
  } else {
    const previousLink = previousDataResource as LinkInstance;
    const documents = pipeline[pipelineIndex].dataResources as DocumentModel[];
    const linkedDocuments = documents.filter(
      document =>
        previousLink.documentIds.includes(document.id) &&
        dataValuesMeetsFilters(
          document.dataValues,
          currentPipeline.filters,
          objectsByIdMap(currentPipeline.attributes),
          currentPipeline.permissions
        )
    );
    if (linkedDocuments.length === 0 && containsAnyFilterInPipeline(pipeline, pipelineIndex)) {
      return false;
    }

    let someDocumentPassed = (!currentPipeline.fulltexts.length || fulltextFound) && linkedDocuments.length === 0;
    for (const linkedDocument of linkedDocuments) {
      if (
        checkAndFillDataResources(
          linkedDocument,
          pipeline,
          filtered,
          pipelineIndex + 1,
          fulltextFound || dataMeetsFulltexts(linkedDocument.dataValues, currentPipeline.fulltexts)
        )
      ) {
        someDocumentPassed = true;
        filtered.allDocuments.push(linkedDocument);
        pushToMatrix(filtered.pipelineDocuments, linkedDocument, Math.floor(pipelineIndex / 2));
      }
    }
    return someDocumentPassed;
  }
}

function containsAnyFilterInPipeline(pipeline: FilterPipeline[], fromIndex: number): boolean {
  return pipeline.slice(fromIndex, pipeline.length).some(pipe => (pipe.filters || []).length > 0);
}

function getDocumentsWithChildren(currentDocument: DocumentModel, allDocuments: DocumentModel[]): DocumentModel[] {
  const documentsWithChildren = [currentDocument];
  const currentDocumentsIds = new Set(documentsWithChildren.map(doc => doc.id));
  let documentsToSearch = allDocuments.filter(document => !currentDocumentsIds.has(document.id));
  let foundParent = true;
  while (foundParent) {
    foundParent = false;
    for (const document of documentsToSearch) {
      if (document.metaData && currentDocumentsIds.has(document.metaData.parentId)) {
        documentsWithChildren.push(document);
        currentDocumentsIds.add(document.id);
        foundParent = true;
      }
    }
    documentsToSearch = documentsToSearch.filter(document => !currentDocumentsIds.has(document.id));
  }

  return documentsWithChildren;
}

export function someDocumentMeetFulltexts(documents: DocumentModel[], fulltexts: string[]): boolean {
  for (const document of documents) {
    if (dataMeetsFulltexts(document.dataValues, fulltexts)) {
      return true;
    }
  }
  return false;
}

function dataValuesMeetsFiltersWithOperator(
  dataValues: Record<string, DataValue>,
  attributesMap: Record<string, Attribute>,
  filters: AttributeFilter[],
  permissions: AllowedPermissions,
  operator: EquationOperator = EquationOperator.And
): boolean {
  const definedFilters = filters?.filter(fil => !!attributesMap[fil.attributeId]);
  if (operator === EquationOperator.Or) {
    return (
      !definedFilters ||
      definedFilters.length === 0 ||
      definedFilters.reduce(
        (result, filter) => result || dataValuesMeetsFilters(dataValues, [filter], attributesMap, permissions),
        false
      )
    );
  }
  return dataValuesMeetsFilters(dataValues, definedFilters, attributesMap, permissions);
}

function dataValuesMeetsFilters(
  dataValues: Record<string, DataValue>,
  filters: AttributeFilter[],
  attributesMap: Record<string, Attribute>,
  permissions: AllowedPermissions
): boolean {
  if (!filters || filters.length === 0) {
    return true;
  }
  return filters.every(filter => {
    if (!dataValues[filter.attributeId]) {
      return false;
    }

    const constraint = attributesMap[filter.attributeId]?.constraint;
    const constraintType = constraint?.type || ConstraintType.Unknown;
    switch (constraintType) {
      case ConstraintType.Action:
        const config = <ActionConstraintConfig>constraint.config;
        if (filter.condition === ConditionType.Enabled) {
          return isActionButtonEnabled(dataValues, attributesMap, permissions, config);
        } else if (filter.condition === ConditionType.Disabled) {
          return !isActionButtonEnabled(dataValues, attributesMap, permissions, config);
        }
        return false;
      default:
        return dataValues[filter.attributeId].meetCondition(filter.condition, filter.conditionValues);
    }
  });
}

export function isActionButtonEnabled(
  dataValues: Record<string, DataValue>,
  attributesMap: Record<string, Attribute>,
  permissions: AllowedPermissions,
  config: ActionConstraintConfig
): boolean {
  if (!dataValues || !attributesMap) {
    return false;
  }
  const filters = config.equation?.equations?.map(eq => eq.filter) || [];
  return (
    dataValuesMeetsFiltersWithOperator(dataValues, attributesMap, filters, permissions, config.equation?.operator) &&
    hasRoleByPermissions(config.role, permissions)
  );
}

function dataMeetsFulltexts(dataValues: Record<string, DataValue>, fulltexts: string[]): boolean {
  if (!fulltexts || fulltexts.length === 0) {
    return true;
  }

  return fulltexts.some(fulltext => objectValues(dataValues).some(dataValue => dataValue?.meetFullTexts([fulltext])));
}

function paginate(documents: DocumentModel[], query: Query) {
  if (!query || isNullOrUndefined(query.page) || isNullOrUndefined(query.pageSize)) {
    return documents;
  }

  return [...documents].slice(query.page * query.pageSize, (query.page + 1) * query.pageSize);
}
