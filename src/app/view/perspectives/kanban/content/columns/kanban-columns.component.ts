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
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChildren,
} from '@angular/core';
import {CdkDragDrop} from '@angular/cdk/drag-drop';
import {Collection} from '../../../../../core/store/collections/collection';
import {KanbanColumn, KanbanConfig, KanbanResource, KanbanStemConfig} from '../../../../../core/store/kanbans/kanban';
import {DocumentModel} from '../../../../../core/store/documents/document.model';

import {Query, QueryStem} from '../../../../../core/store/navigation/query/query';
import {AppState} from '../../../../../core/store/app.state';
import {Store} from '@ngrx/store';
import {findLastItem, isArray, isNotNullOrUndefined} from '../../../../../shared/utils/common.utils';
import {DRAG_DELAY} from '../../../../../core/constants';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../../core/store/link-instances/link.instance';
import {generateDocumentData, groupDocumentsByCollection} from '../../../../../core/store/documents/document.utils';
import {queryStemAttributesResourcesOrder} from '../../../../../core/store/navigation/query/query.util';
import {DocumentsAction} from '../../../../../core/store/documents/documents.action';
import {findAttributeConstraint} from '../../../../../core/store/collections/collection.util';
import {KanbanColumnComponent} from './column/kanban-column.component';
import {Workspace} from '../../../../../core/store/navigation/workspace';
import {DocumentFavoriteToggleService} from '../../../../../shared/toggle/document-favorite-toggle.service';
import {getAttributesResourceType} from '../../../../../shared/utils/resource.utils';
import {ModalService} from '../../../../../shared/modal/modal.service';
import {groupLinkInstancesByLinkTypes} from '../../../../../core/store/link-instances/link-instance.utils';
import {KanbanCard, KanbanCreateResource, KanbanData, KanbanDataColumn} from '../../util/kanban-data';
import {ResourcesPermissions} from '../../../../../core/model/allowed-permissions';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../../../core/model/resource';
import {createRangeInclusive} from '../../../../../shared/utils/array.utils';
import {
  ConditionType,
  Constraint,
  ConstraintData,
  ConstraintType,
  DocumentsAndLinksData,
  filterDocumentsAndLinksByStem,
  UnknownConstraint,
} from '@lumeer/data-filters';
import {User} from '../../../../../core/store/users/user';
import {ViewSettings} from '../../../../../core/store/views/view';
import {KanbanPerspectiveConfiguration} from '../../../perspective-configuration';
import {
  createPossibleLinkingDocuments,
  createPossibleLinkingDocumentsByChains,
} from '../../../../../shared/utils/data/data-aggregator-util';
import {CreateDataResourceService} from '../../../../../core/service/create-data-resource.service';

@Component({
  selector: 'kanban-columns',
  templateUrl: './kanban-columns.component.html',
  styleUrls: ['./kanban-columns.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DocumentFavoriteToggleService],
})
export class KanbanColumnsComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChildren('kanbanColumn')
  public columns: QueryList<KanbanColumnComponent>;

  @Input()
  public collections: Collection[];

  @Input()
  public config: KanbanConfig;

  @Input()
  public kanbanData: KanbanData;

  @Input()
  public data: DocumentsAndLinksData;

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public canManageConfig: boolean;

  @Input()
  public permissions: ResourcesPermissions;

  @Input()
  public query: Query;

  @Input()
  public viewId: string;

  @Input()
  public currentUser: User;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public workspace: Workspace;

  @Input()
  public viewSettings: ViewSettings;

  @Input()
  public perspectiveConfiguration: KanbanPerspectiveConfiguration;

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

  public readonly dragDelay = DRAG_DELAY;

  private unknownConstraint: Constraint = new UnknownConstraint();

  constructor(
    private store$: Store<AppState>,
    private modalService: ModalService,
    private toggleService: DocumentFavoriteToggleService,
    private createService: CreateDataResourceService
  ) {}

  public ngOnInit() {
    this.toggleService.setWorkspace(this.currentWorkspace());
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.viewId) {
      this.toggleService.setWorkspace(this.currentWorkspace());
    }
    this.createService.setData(
      this.data,
      this.query,
      this.collections,
      this.linkTypes,
      this.constraintData,
      this.currentWorkspace()
    );
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
    const stemConfig = this.config?.stemsConfigs?.[resourceCreate.stemIndex];
    const grouping = stemConfig?.resource ? {value: column.title, attribute: stemConfig.attribute} : null;
    const dataResourcesChains = column.cards.map(card => card.dataResourcesChain);
    const data = {[stemConfig.attribute.resourceId]: {[stemConfig.attribute.attributeId]: column.title}};
    this.createService.create({
      resource: stemConfig.resource || stemConfig.attribute,
      stem: stemConfig.stem,
      grouping: [grouping].filter(val => !!val),
      dataResourcesChains,
      data,
      failureMessage: $localize`:@@perspective.kanban.create.card.failure:Could not create card`,
    });
  }

  private stemConfigIsWithPath(stemIndex: number): boolean {
    const stemConfig = this.config?.stemsConfigs?.[stemIndex];
    return (
      stemConfig?.attribute &&
      stemConfig?.resource &&
      stemConfig.attribute.resourceIndex !== stemConfig.resource.resourceIndex
    );
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
          linkInstanceChain &&
          (this.data?.uniqueLinkInstances || []).find(li => li.id === linkInstanceChain.linkInstanceId);
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
            ? ({collectionId: resource.id, data} as DataResource)
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

  private chooseDocument(documentsIds: string[], callback: (document: DocumentModel) => void) {
    this.modalService.showChooseLinkDocument(documentsIds, this.viewId, callback);
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

  private getStemByResourceCreate(resourceCreate: KanbanCreateResource): QueryStem {
    return this.query?.stems?.[resourceCreate.stemIndex];
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

  private onObjectCreated(id: string, column: KanbanColumn) {
    const component = this.columns.find(cmp => cmp.column.id === column.id);
    component?.onDataResourceCreated(id);
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
        this.data?.uniqueLinkInstances
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
    this.store$.dispatch(
      new DocumentsAction.CreateChain({documents, linkInstances, failureMessage, workspace: this.currentWorkspace()})
    );
  }

  private currentWorkspace(): Workspace {
    return {...this.workspace, viewId: this.viewId};
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
