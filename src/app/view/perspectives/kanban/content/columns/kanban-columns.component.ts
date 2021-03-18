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

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  ViewChildren,
} from '@angular/core';
import {CdkDragDrop} from '@angular/cdk/drag-drop';
import {Collection} from '../../../../../core/store/collections/collection';
import {KanbanColumn, KanbanConfig, KanbanResource, KanbanStemConfig} from '../../../../../core/store/kanbans/kanban';
import {DocumentModel} from '../../../../../core/store/documents/document.model';

import {Query, QueryStem} from '../../../../../core/store/navigation/query/query';
import {AppState} from '../../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {findLastItem, isArray, isNotNullOrUndefined} from '../../../../../shared/utils/common.utils';
import {DRAG_DELAY} from '../../../../../core/constants';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../../core/store/link-instances/link.instance';
import {generateDocumentData, groupDocumentsByCollection} from '../../../../../core/store/documents/document.utils';
import {
  getQueryFiltersForCollection,
  getQueryFiltersForLinkType,
  queryStemAttributesResourcesOrder,
} from '../../../../../core/store/navigation/query/query.util';
import {DocumentsAction} from '../../../../../core/store/documents/documents.action';
import {findAttributeConstraint} from '../../../../../core/store/collections/collection.util';
import {KanbanColumnComponent} from './column/kanban-column.component';
import {Workspace} from '../../../../../core/store/navigation/workspace';
import {DocumentFavoriteToggleService} from '../../../../../shared/toggle/document-favorite-toggle.service';
import {generateCorrelationId, getAttributesResourceType} from '../../../../../shared/utils/resource.utils';
import {ModalService} from '../../../../../shared/modal/modal.service';
import {groupLinkInstancesByLinkTypes} from '../../../../../core/store/link-instances/link-instance.utils';
import {KanbanCard, KanbanCreateResource, KanbanData, KanbanDataColumn} from '../../util/kanban-data';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../../../core/model/resource';
import {
  createPossibleLinkingDocuments,
  createPossibleLinkingDocumentsByChains,
} from '../../../../../shared/utils/data/data-aggregator-util';
import {createRangeInclusive} from '../../../../../shared/utils/array.utils';
import {ViewSettings} from '../../../../../core/store/views/view';
import {Observable} from 'rxjs';
import {selectViewSettings} from '../../../../../core/store/view-settings/view-settings.state';
import {
  ConditionType,
  Constraint,
  ConstraintData,
  ConstraintType,
  filterDocumentsAndLinksByStem,
  UnknownConstraint,
} from '@lumeer/data-filters';

@Component({
  selector: 'kanban-columns',
  templateUrl: './kanban-columns.component.html',
  styleUrls: ['./kanban-columns.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DocumentFavoriteToggleService],
})
export class KanbanColumnsComponent implements OnInit, OnDestroy {
  @ViewChildren('kanbanColumn')
  public columns: QueryList<KanbanColumnComponent>;

  @Input()
  public collections: Collection[];

  @Input()
  public config: KanbanConfig;

  @Input()
  public kanbanData: KanbanData;

  @Input()
  public documents: DocumentModel[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public linkInstances: LinkInstance[];

  @Input()
  public canManageConfig: boolean;

  @Input()
  public permissions: Record<string, AllowedPermissions>;

  @Input()
  public linkTypesPermissions: Record<string, AllowedPermissions>;

  @Input()
  public query: Query;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public workspace: Workspace;

  @Output()
  public columnsMoved = new EventEmitter<{previousIndex: number; currentIndex: number}>();

  @Output()
  public columnRemove = new EventEmitter<KanbanColumn>();

  @Output()
  public columnsChange = new EventEmitter<{columns: KanbanDataColumn[]; otherColumn: KanbanDataColumn}>();

  @Output()
  public patchDocumentData = new EventEmitter<DocumentModel>();

  @Output()
  public patchLinkInstanceData = new EventEmitter<LinkInstance>();

  @Output()
  public updateLinkDocuments = new EventEmitter<{linkInstanceId: string; documentIds: [string, string]}>();

  public viewSettings$: Observable<ViewSettings>;

  public readonly dragDelay = DRAG_DELAY;

  private unknownConstraint: Constraint = new UnknownConstraint();

  constructor(
    private store$: Store<AppState>,
    private modalService: ModalService,
    private toggleService: DocumentFavoriteToggleService
  ) {}

  public ngOnInit() {
    this.viewSettings$ = this.store$.pipe(select(selectViewSettings));
    this.toggleService.setWorkspace(this.workspace);
  }

  public dropColumn(event: CdkDragDrop<string[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    this.columnsMoved.emit({previousIndex: event.previousIndex, currentIndex: event.currentIndex});
  }

  public trackByColumn(index: number, column: KanbanColumn): string {
    return column.title || '';
  }

  public onCreateDataResource(resourceCreate: KanbanCreateResource, column: KanbanDataColumn) {
    if (this.stemConfigIsWithPath(resourceCreate.stemIndex)) {
      this.createDataResourceWithPath(resourceCreate, column);
    } else {
      this.createDataResourceInResource(resourceCreate, column);
    }
  }

  private stemConfigIsWithPath(stemIndex: number): boolean {
    const stemConfig = this.config?.stemsConfigs?.[stemIndex];
    return (
      stemConfig?.attribute &&
      stemConfig?.resource &&
      stemConfig.attribute.resourceIndex !== stemConfig.resource.resourceIndex
    );
  }

  private createDataResourceWithPath(resourceCreate: KanbanCreateResource, column: KanbanDataColumn) {
    const dataResourcesChains = column.cards.map(card => card.dataResourcesChain);
    if (dataResourcesChains.length > 0) {
      const possibleDocumentsIds = createPossibleLinkingDocuments(dataResourcesChains);
      const linkTypeId = this.getPreviousLinkType(resourceCreate)?.id;
      if (possibleDocumentsIds.length === 1) {
        this.createDataResource(resourceCreate, column, possibleDocumentsIds[0], linkTypeId);
      } else {
        this.chooseDocument(possibleDocumentsIds, document =>
          this.createDataResource(resourceCreate, column, document, linkTypeId)
        );
      }
    } else {
      // column is empty and we don't have any paths
      const resourceAttribute = this.config?.stemsConfigs?.[resourceCreate.stemIndex]?.resource;
      const startingDocuments = this.getPreviousOrNextDocuments(resourceCreate, resourceAttribute, column.title);
      if (startingDocuments.length > 1) {
        this.chooseDocument(
          startingDocuments.map(doc => doc.id),
          document => this.createDataResourceWithChain(document, resourceCreate, resourceAttribute, column.title)
        );
      } else {
        this.createDataResourceWithChain(startingDocuments[0], resourceCreate, resourceAttribute, column.title);
      }
    }
  }

  private createDataResourceWithChain(
    document: DocumentModel,
    createResource: KanbanCreateResource,
    kanbanResource: KanbanResource,
    value: any
  ) {
    const {documents, linkInstances} = this.createChainWithStartingDocument(
      document,
      createResource,
      kanbanResource,
      value
    );

    if (documents.length === 0 || linkInstances.length === 0) {
      return;
    }

    const failureMessage = $localize`:@@perspective.kanban.create.card.failure:Could not create card`;

    let lastDataResource: DataResource;
    const reversed = createResource.kanbanAttribute.resourceIndex > kanbanResource.resourceIndex;
    if (this.modifyingDocuments(createResource)) {
      lastDataResource = documents[reversed ? 0 : documents.length - 1];
    } else if (this.modifyingLinks(createResource)) {
      lastDataResource = linkInstances[reversed ? 0 : linkInstances.length - 1];
    }

    if (lastDataResource) {
      const ref = this.modalService.showDataResourceDetail(lastDataResource, createResource.resource, false);
      ref.content.onSubmit$.subscribe(modifiedDocument => {
        lastDataResource.data = modifiedDocument.data;
        this.store$.dispatch(new DocumentsAction.CreateChain({documents, linkInstances, failureMessage}));
      });
    }
  }

  private createChainWithStartingDocument(
    startingDocument: DocumentModel,
    createResource: KanbanCreateResource,
    kanbanResource: KanbanResource,
    value: any,
    card?: KanbanCard
  ): {documents: DocumentModel[]; linkInstances: LinkInstance[]} {
    const chain: DataResource[] = [];
    const chainRange = this.createChainRange(createResource, kanbanResource);

    if (startingDocument) {
      chain[chainRange[0]] = startingDocument;
    }
    if (card) {
      chain[kanbanResource.resourceIndex] = card.dataResource;
      if (card.resourceType === AttributesResourceType.Collection) {
        const linkInstanceChain = findLastItem(
          card.dataResourcesChain,
          dataResourceChain => !!dataResourceChain.linkInstanceId
        );
        const linkInstance =
          linkInstanceChain && (this.linkInstances || []).find(li => li.id === linkInstanceChain.linkInstanceId);
        if (linkInstance) {
          chain[chainRange[chainRange.length - 2]] = linkInstance;
        }
      }
    }

    const stemConfig = this.config.stemsConfigs?.[createResource.stemIndex];
    const attributesResourcesOrder = queryStemAttributesResourcesOrder(
      stemConfig.stem,
      this.collections,
      this.linkTypes
    );

    for (const rangeIndex of chainRange) {
      if (!chain[rangeIndex]) {
        const resource = attributesResourcesOrder[rangeIndex];
        const resourceType = getAttributesResourceType(resource);
        const filters =
          resourceType === AttributesResourceType.Collection ? stemConfig.stem.filters : stemConfig.stem.linkFilters;
        const data = generateDocumentData(resource, filters, this.constraintData, false);
        if (rangeIndex === createResource.kanbanAttribute.resourceIndex) {
          data[createResource.kanbanAttribute.attributeId] = value;
        }
        chain[rangeIndex] =
          resourceType === AttributesResourceType.Collection
            ? ({
                collectionId: resource.id,
                data,
              } as DataResource)
            : ({linkTypeId: resource.id, data, documentIds: []} as DataResource);
      }
    }

    return {
      documents: chain
        .filter((dataResource, index) => dataResource && index % 2 === 0)
        .map(dataResource => <DocumentModel>dataResource),
      linkInstances: chain
        .filter((dataResource, index) => dataResource && index % 2 === 1)
        .map(dataResource => <LinkInstance>dataResource),
    };
  }

  private createChainRange(createResource: KanbanCreateResource, kanbanResource: KanbanResource): number[] {
    let fromIndex = createResource.kanbanAttribute.resourceIndex;
    let toIndex = kanbanResource.resourceIndex;
    if (createResource.kanbanAttribute.resourceType === AttributesResourceType.LinkType) {
      fromIndex += fromIndex < toIndex ? -1 : 1;
    }
    if (kanbanResource.resourceType === AttributesResourceType.LinkType) {
      toIndex += fromIndex < toIndex ? 1 : -1;
    }

    return createRangeInclusive(fromIndex, toIndex);
  }

  private createDataResourceInResource(resourceCreate: KanbanCreateResource, column: KanbanDataColumn) {
    const previousDocuments = this.getPreviousDocuments(resourceCreate);
    if (previousDocuments.length > 0) {
      const linkTypeId = this.getPreviousLinkType(resourceCreate)?.id;
      if (previousDocuments.length === 1) {
        this.createDataResource(resourceCreate, column, previousDocuments[0].id, linkTypeId);
      } else {
        this.chooseDocument(
          previousDocuments.map(doc => doc.id),
          document => this.createDataResource(resourceCreate, column, document, linkTypeId)
        );
      }
    } else if (resourceCreate.kanbanAttribute.resourceType === AttributesResourceType.Collection) {
      this.createDataResource(resourceCreate, column);
    }
  }

  private chooseDocument(documentsIds: string[], callback: (document) => void) {
    this.modalService.showChooseLinkDocument(documentsIds, callback);
  }

  private modifyingDocuments(createResource: KanbanCreateResource): boolean {
    return getAttributesResourceType(createResource.resource) === AttributesResourceType.Collection;
  }

  private modifyingLinks(createResource: KanbanCreateResource): boolean {
    return getAttributesResourceType(createResource.resource) === AttributesResourceType.LinkType;
  }

  private createDataResource(
    createResource: KanbanCreateResource,
    column: KanbanColumn,
    linkDocumentId?: string,
    linkTypeId?: string
  ) {
    const {document, collection} = this.createDocumentData(createResource, column.title);
    const {linkInstance = null, linkType = null} =
      (linkTypeId && linkDocumentId && this.createLinkData(createResource, column.title)) || {};

    const creatingDocument = this.modifyingDocuments(createResource);
    const modalRef = creatingDocument
      ? this.modalService.showDataResourceDetail(document, collection, false)
      : this.modalService.showDataResourceDetail(linkInstance, linkType, false);

    modalRef.content.onSubmit$.subscribe(modifiedDataResource => {
      if (linkDocumentId && linkTypeId) {
        this.store$.dispatch(
          new DocumentsAction.CreateWithLink({
            document: creatingDocument ? {...document, data: modifiedDataResource.data} : document,
            otherDocumentId: linkDocumentId,
            linkInstance: {
              documentIds: [linkDocumentId, ''],
              linkTypeId,
              data: !creatingDocument ? modifiedDataResource.data : linkInstance.data,
              correlationId: generateCorrelationId(),
            },
            afterSuccess: ({documentId}) => this.onObjectCreated(documentId, column),
          })
        );
      } else {
        this.store$.dispatch(
          new DocumentsAction.Create({
            document: creatingDocument ? {...document, data: modifiedDataResource.data} : document,
            afterSuccess: documentId => this.onObjectCreated(documentId, column),
          })
        );
      }
    });
  }

  private getPreviousOrNextDocuments(
    resourceCreate: KanbanCreateResource,
    resource: KanbanResource,
    value: any
  ): DocumentModel[] {
    const kanbanAttribute = resourceCreate.kanbanAttribute;
    const offset = kanbanAttribute.resourceIndex > resource.resourceIndex ? +1 : 0;
    const pipelineIndex = Math.floor((kanbanAttribute.resourceIndex + offset) / 2);

    const currentStem = this.getStemByResourceCreate(resourceCreate);
    const linkFilters = [...(currentStem.linkFilters || [])];
    const filters = [...(currentStem.filters || [])];
    if (kanbanAttribute.resourceType === AttributesResourceType.Collection) {
      filters.push({
        attributeId: kanbanAttribute.attributeId,
        collectionId: kanbanAttribute.resourceId,
        condition: ConditionType.Equals,
        conditionValues: [{value}],
      });
    } else {
      linkFilters.push({
        attributeId: kanbanAttribute.attributeId,
        linkTypeId: kanbanAttribute.resourceId,
        condition: ConditionType.Equals,
        conditionValues: [{value}],
      });
    }

    return this.getPipelineDocuments(pipelineIndex, {...currentStem, filters, linkFilters});
  }

  private getPreviousDocuments(resourceCreate: KanbanCreateResource): DocumentModel[] {
    const pipelineIndex = Math.floor((resourceCreate.kanbanAttribute.resourceIndex - 1) / 2);
    return this.getPipelineDocuments(pipelineIndex, this.getStemByResourceCreate(resourceCreate));
  }

  private getStemByResourceCreate(resourceCreate: KanbanCreateResource): QueryStem {
    return this.query?.stems?.[resourceCreate.stemIndex];
  }

  private getPipelineDocuments(pipelineIndex: number, stem: QueryStem): DocumentModel[] {
    const {pipelineDocuments} = filterDocumentsAndLinksByStem(
      this.collections,
      groupDocumentsByCollection(this.documents),
      this.linkTypes,
      groupLinkInstancesByLinkTypes(this.linkInstances),
      this.permissions,
      this.linkTypesPermissions,
      this.constraintData,
      stem,
      this.query?.fulltexts || []
    );
    return pipelineDocuments[pipelineIndex] || [];
  }

  private onObjectCreated(id: string, column: KanbanColumn) {
    const component = this.columns.find(cmp => cmp.column.id === column.id);
    component?.onDataResourceCreated(id);
  }

  private createLinkData(
    createResource: KanbanCreateResource,
    value: any
  ): {linkType: LinkType; linkInstance: LinkInstance} {
    const linkType = this.getPreviousLinkType(createResource);
    const linkFilters = getQueryFiltersForLinkType(this.query, linkType.id);
    const linkData = generateDocumentData(linkType, linkFilters, this.constraintData, false);

    if (this.modifyingLinks(createResource) && !this.stemConfigIsWithPath(createResource.stemIndex)) {
      const constraint = findAttributeConstraint(linkType.attributes, createResource.kanbanAttribute.attributeId);
      linkData[createResource.kanbanAttribute.attributeId] = this.createValueByConstraint(constraint, value);
    }

    return {linkInstance: {linkTypeId: linkType.id, data: linkData, documentIds: [null, null]}, linkType};
  }

  private createDocumentData(
    createResource: KanbanCreateResource,
    value: any
  ): {document: DocumentModel; collection: Collection} {
    const collection = this.getNextCollection(createResource);
    const collectionsFilters = getQueryFiltersForCollection(this.query, collection.id);
    const documentData = generateDocumentData(collection, collectionsFilters, this.constraintData, false);

    if (this.modifyingDocuments(createResource) && !this.stemConfigIsWithPath(createResource.stemIndex)) {
      const constraint = findAttributeConstraint(collection.attributes, createResource.kanbanAttribute.attributeId);
      documentData[createResource.kanbanAttribute.attributeId] = this.createValueByConstraint(constraint, value);
    }

    return {document: {collectionId: collection.id, data: documentData}, collection};
  }

  private getNextCollection(createResource: KanbanCreateResource): Collection {
    if (this.modifyingDocuments(createResource)) {
      return <Collection>createResource.resource;
    }
    const stemConfig = this.config.stemsConfigs?.[createResource.stemIndex];
    const attributesResourcesOrder = queryStemAttributesResourcesOrder(
      this.query.stems[createResource.stemIndex],
      this.collections,
      this.linkTypes
    );
    return attributesResourcesOrder[(stemConfig?.resource || createResource.kanbanAttribute).resourceIndex + 1];
  }

  private getPreviousLinkType(createResource: KanbanCreateResource): LinkType {
    if (this.modifyingLinks(createResource)) {
      return <LinkType>createResource.resource;
    }
    const stemConfig = this.config.stemsConfigs?.[createResource.stemIndex];
    const attributesResourcesOrder = queryStemAttributesResourcesOrder(
      this.query.stems[createResource.stemIndex],
      this.collections,
      this.linkTypes
    );
    return <LinkType>(
      attributesResourcesOrder[(stemConfig?.resource || createResource.kanbanAttribute).resourceIndex - 1]
    );
  }

  public onUpdateDataResource(object: {card: KanbanCard; fromColumn: KanbanDataColumn; toColumn: KanbanDataColumn}) {
    const {card, fromColumn, toColumn} = object;
    const stemConfig = this.config.stemsConfigs?.[card.stemIndex];
    if (this.stemConfigIsWithPath(card.stemIndex)) {
      this.updateDataResourceWithPath(card, toColumn);
    } else {
      if (card.resourceType === AttributesResourceType.Collection) {
        this.patchDocument(card, toColumn.title, fromColumn.title, stemConfig);
      } else if (card.resourceType === AttributesResourceType.LinkType) {
        this.patchLinkInstance(card, toColumn.title, fromColumn.title, stemConfig);
      }
    }
  }

  private updateDataResourceWithPath(kanbanCard: KanbanCard, toColumn: KanbanDataColumn) {
    const dataResourcesChains = toColumn.cards.map(card => card.dataResourcesChain);
    if (dataResourcesChains.length > 0) {
      const {linkInstanceId, documentId, otherDocumentIds} = createPossibleLinkingDocumentsByChains(
        kanbanCard.dataResourcesChain,
        dataResourcesChains,
        this.linkInstances
      );
      if (otherDocumentIds.length === 1) {
        this.updateLinkDocuments.emit({linkInstanceId, documentIds: [documentId, otherDocumentIds[0]]});
      } else {
        this.chooseDocument(otherDocumentIds, document =>
          this.updateLinkDocuments.emit({
            linkInstanceId,
            documentIds: [documentId, document.id],
          })
        );
      }
    } else {
      // column is empty and we don't have any paths
      const stemConfig = this.config?.stemsConfigs?.[kanbanCard.stemIndex];
      const resourceAttribute = stemConfig?.resource;
      const createResource: KanbanCreateResource = {
        resource: this.findResource(resourceAttribute),
        stemIndex: kanbanCard.stemIndex,
        kanbanAttribute: stemConfig.attribute,
      };
      const startingDocuments = this.getPreviousOrNextDocuments(createResource, resourceAttribute, toColumn.title);
      if (startingDocuments.length > 1) {
        this.chooseDocument(
          startingDocuments.map(doc => doc.id),
          document =>
            this.updateDataResourceWithChain(document, kanbanCard, createResource, resourceAttribute, toColumn.title)
        );
      } else {
        this.updateDataResourceWithChain(
          startingDocuments[0],
          kanbanCard,
          createResource,
          resourceAttribute,
          toColumn.title
        );
      }
    }
  }

  private findResource(resourceAttribute: KanbanResource): AttributesResource {
    if (resourceAttribute.resourceType === AttributesResourceType.Collection) {
      return (this.collections || []).find(collection => collection.id === resourceAttribute.resourceId);
    }
    return (this.linkTypes || []).find(linkType => linkType.id === resourceAttribute.resourceId);
  }

  private updateDataResourceWithChain(
    startingDocument: DocumentModel,
    card: KanbanCard,
    resourceCreate: KanbanCreateResource,
    kanbanResource: KanbanResource,
    value: any
  ) {
    const {documents, linkInstances} = this.createChainWithStartingDocument(
      startingDocument,
      resourceCreate,
      kanbanResource,
      value,
      card
    );
    if (documents.length === 0 || linkInstances.length === 0) {
      return;
    }
    const failureMessage = $localize`:@@perspective.kanban.move.card.failure:Could not move card`;
    this.store$.dispatch(new DocumentsAction.CreateChain({documents, linkInstances, failureMessage}));
  }

  private patchDocument(card: KanbanCard, newValue: any, previousValue: any, stemConfig: KanbanStemConfig) {
    const document = <DocumentModel>card.dataResource;
    const attributeId = stemConfig?.attribute?.attributeId;
    const collection = (this.collections || []).find(coll => coll.id === document.collectionId);
    const constraint = findAttributeConstraint(collection?.attributes, attributeId);
    const value = this.createValueByConstraint(constraint, newValue, previousValue, document.data?.[attributeId]);
    const data = {...document.data, [attributeId]: value};
    this.patchDocumentData.emit({...document, data});
  }

  private patchLinkInstance(card: KanbanCard, newValue: any, previousValue: any, stemConfig: KanbanStemConfig) {
    const linkInstance = <LinkInstance>card.dataResource;
    const attributeId = stemConfig?.attribute?.attributeId;
    const linkType = (this.linkTypes || []).find(coll => coll.id === linkInstance.linkTypeId);
    const constraint = findAttributeConstraint(linkType?.attributes, attributeId);
    const value = this.createValueByConstraint(constraint, newValue, previousValue, linkInstance.data?.[attributeId]);
    const data = {...linkInstance.data, [attributeId]: value};
    this.patchLinkInstanceData.emit({...linkInstance, data});
  }

  private createValueByConstraint(
    constraint: Constraint,
    newValue: any,
    previousValue?: any,
    documentValue?: any
  ): any {
    if (
      constraint &&
      (constraint.type === ConstraintType.Select || constraint.type === ConstraintType.User) &&
      isNotNullOrUndefined(previousValue) &&
      isArray(documentValue)
    ) {
      const changedIndex = documentValue.findIndex(value => value === previousValue);
      const newArray = [...documentValue];
      if (!newArray.includes(newValue)) {
        newArray[changedIndex] = newValue;
      }
      return constraint.createDataValue(newArray, this.constraintData).serialize();
    } else {
      return (constraint || this.unknownConstraint).createDataValue(newValue).serialize();
    }
  }

  public onRemoveColumn(column: KanbanColumn) {
    this.columnRemove.emit(column);
  }

  public onToggleFavorite(document: DocumentModel) {
    this.toggleService.set(document.id, !document.favorite, document);
  }

  public ngOnDestroy() {
    this.toggleService.onDestroy();
  }
}
