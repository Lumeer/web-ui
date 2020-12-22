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
import {ConstraintData, ConstraintType} from '../../model/data/constraint';
import {Query, QueryStem} from '../navigation/query/query';
import {groupLinkInstancesByLinkTypes, mergeLinkInstances} from '../link-instances/link-instance.utils';
import {AttributesResource, AttributesResourceType, DataResource} from '../../model/resource';
import {getAttributesResourceType, hasRoleByPermissions} from '../../../shared/utils/resource.utils';
import {DataValue} from '../../model/data-value';
import {UnknownConstraint} from '../../model/constraint/unknown.constraint';
import {AttributeFilter, ConditionType, EquationOperator} from '../../model/attribute-filter';
import {AllowedPermissions} from '../../model/allowed-permissions';
import {ActionConstraintConfig} from '../../model/data/constraint-config';

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
  constraintData: ConstraintData,
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

  stems.forEach(stem => {
    const {allDocuments, allLinkInstances} = filterDocumentsAndLinksByStem(
      collections,
      documentsByCollections,
      linkTypes,
      linkInstancesByLinkTypes,
      collectionsPermissions,
      linkTypePermissions,
      constraintData,
      stem,
      query.fulltexts?.map(fullText => escapeHtml(fullText)),
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
  constraintData: ConstraintData,
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

    return {resource, fulltexts, filters, dataResources, permissions};
  });

  if (!pipeline[0]) {
    return filtered;
  }

  const pushedIds = [];
  const attributesMap = objectsByIdMap(pipeline[0].resource?.attributes);
  for (const dataResource of pipeline[0].dataResources) {
    const dataValues = createDataValuesMap(dataResource.data, pipeline[0].resource?.attributes, constraintData);
    if (
      dataValuesMeetsFilters2(dataValues, pipeline[0].filters, attributesMap, pipeline[0].permissions, constraintData)
    ) {
      const searchDocuments = includeChildren
        ? getDocumentsWithChildren(dataResource as DocumentModel, pipeline[0].dataResources as DocumentModel[])
        : [dataResource as DocumentModel];
      for (const document of searchDocuments) {
        if (
          !pushedIds.includes(document.id) &&
          checkAndFillDataResources(
            document,
            pipeline,
            filtered,
            constraintData,
            1,
            !pipeline[0].fulltexts.length || dataValuesMeetsFulltexts(dataValues, pipeline[0].fulltexts)
          )
        ) {
          pushedIds.push(document.id);
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
  constraintData: ConstraintData,
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
        dataMeetsFilters(
          linkInstance.data,
          currentPipeline.resource?.attributes,
          currentPipeline.filters,
          currentPipeline.permissions,
          constraintData
        )
    );
    if (linkedLinks.length === 0 && containsAnyFilterInPipeline(pipeline, pipelineIndex)) {
      return false;
    }

    let someLinkPassed = (!currentPipeline.fulltexts.length || fulltextFound) && linkedLinks.length === 0;
    for (const linkedLink of linkedLinks) {
      const dataValues = createDataValuesMap(linkedLink.data, currentPipeline.resource?.attributes, constraintData);
      if (
        checkAndFillDataResources(
          linkedLink,
          pipeline,
          filtered,
          constraintData,
          pipelineIndex + 1,
          fulltextFound || dataValuesMeetsFulltexts(dataValues, currentPipeline.fulltexts)
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
        dataMeetsFilters(
          document.data,
          currentPipeline.resource?.attributes,
          currentPipeline.filters,
          currentPipeline.permissions,
          constraintData
        )
    );
    if (linkedDocuments.length === 0 && containsAnyFilterInPipeline(pipeline, pipelineIndex)) {
      return false;
    }

    let someDocumentPassed = (!currentPipeline.fulltexts.length || fulltextFound) && linkedDocuments.length === 0;
    for (const linkedDocument of linkedDocuments) {
      const dataValues = createDataValuesMap(linkedDocument.data, currentPipeline.resource?.attributes, constraintData);
      if (
        checkAndFillDataResources(
          linkedDocument,
          pipeline,
          filtered,
          constraintData,
          pipelineIndex + 1,
          fulltextFound || dataValuesMeetsFulltexts(dataValues, currentPipeline.fulltexts)
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

export function someDocumentMeetFulltexts(
  documents: DocumentModel[],
  collection: Collection,
  fulltexts: string[],
  constraintData: ConstraintData
): boolean {
  for (const document of documents) {
    const dataValues = createDataValuesMap(document.data, collection?.attributes, constraintData);
    if (dataValuesMeetsFulltexts(dataValues, fulltexts)) {
      return true;
    }
  }
  return false;
}

export function createDataValuesMap(
  data: Record<string, any>,
  attributes: Attribute[],
  constraintData: ConstraintData
): Record<string, DataValue> {
  return (attributes || []).reduce(
    (map, attribute) => ({
      ...map,
      [attribute.id]: (attribute.constraint || new UnknownConstraint()).createDataValue(
        data?.[attribute.id],
        constraintData
      ),
    }),
    {}
  );
}

function dataValuesMeetsFilters(
  dataValues: Record<string, DataValue>,
  attributesMap: Record<string, Attribute>,
  filters: AttributeFilter[],
  permissions: AllowedPermissions,
  constraintData: ConstraintData,
  operator: EquationOperator = EquationOperator.And
): boolean {
  const definedFilters = filters?.filter(fil => !!attributesMap[fil.attributeId]);
  if (operator === EquationOperator.Or) {
    return (
      !definedFilters ||
      definedFilters.length === 0 ||
      definedFilters.reduce(
        (result, filter) =>
          result || dataValuesMeetsFilters2(dataValues, [filter], attributesMap, permissions, constraintData),
        false
      )
    );
  }
  return dataValuesMeetsFilters2(dataValues, definedFilters, attributesMap, permissions, constraintData);
}

function dataMeetsFilters(
  data: Record<string, any>,
  attributes: Attribute[],
  filters: AttributeFilter[],
  permissions: AllowedPermissions,
  constraintData: ConstraintData,
  operator: EquationOperator = EquationOperator.And
): boolean {
  const dataValues = createDataValuesMap(data, attributes, constraintData);
  const attributesMap = objectsByIdMap(attributes);
  return dataValuesMeetsFilters(dataValues, attributesMap, filters, permissions, constraintData, operator);
}

function dataValuesMeetsFilters2(
  dataValues: Record<string, DataValue>,
  filters: AttributeFilter[],
  attributesMap: Record<string, Attribute>,
  permissions: AllowedPermissions,
  constraintData?: ConstraintData
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
          return isActionButtonEnabled(dataValues, attributesMap, permissions, config, constraintData);
        } else if (filter.condition === ConditionType.Disabled) {
          return !isActionButtonEnabled(dataValues, attributesMap, permissions, config, constraintData);
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
  config: ActionConstraintConfig,
  constraintData?: ConstraintData
): boolean {
  if (!dataValues || !attributesMap) {
    return false;
  }
  const filters = config.equation?.equations?.map(eq => eq.filter) || [];
  return (
    dataValuesMeetsFilters(
      dataValues,
      attributesMap,
      filters,
      permissions,
      constraintData,
      config.equation?.operator
    ) && hasRoleByPermissions(config.role, permissions)
  );
}

function dataValuesMeetsFulltexts(dataValues: Record<string, DataValue>, fulltexts: string[]): boolean {
  if (!fulltexts || fulltexts.length === 0) {
    return true;
  }

  return fulltexts.some(fulltext => objectValues(dataValues).some(dataValue => dataValue.meetFullTexts([fulltext])));
}

function paginate(documents: DocumentModel[], query: Query) {
  if (!query || isNullOrUndefined(query.page) || isNullOrUndefined(query.pageSize)) {
    return documents;
  }

  return [...documents].slice(query.page * query.pageSize, (query.page + 1) * query.pageSize);
}
