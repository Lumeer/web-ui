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
import {Collection} from '../../../../core/store/collections/collection';
import {KanbanColumn, KanbanConfig, KanbanStemConfig} from '../../../../core/store/kanbans/kanban';
import {DocumentModel} from '../../../../core/store/documents/document.model';

import {Query} from '../../../../core/store/navigation/query/query';
import {AppState} from '../../../../core/store/app.state';
import {Store} from '@ngrx/store';
import {isArray, isNotNullOrUndefined} from '../../../../shared/utils/common.utils';
import {CollectionsPermissionsPipe} from '../../../../shared/pipes/permissions/collections-permissions.pipe';
import {DRAG_DELAY} from '../../../../core/constants';
import {ConstraintData, ConstraintType} from '../../../../core/model/data/constraint';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {filterDocumentsAndLinksByStem} from '../../../../core/store/documents/documents.filters';
import {generateDocumentData, groupDocumentsByCollection} from '../../../../core/store/documents/document.utils';
import {
  getQueryFiltersForCollection,
  getQueryFiltersForLinkType,
  queryStemAttributesResourcesOrder,
} from '../../../../core/store/navigation/query/query.util';
import {DocumentsAction} from '../../../../core/store/documents/documents.action';
import {findAttributeConstraint} from '../../../../core/store/collections/collection.util';
import {KanbanColumnComponent} from './column/kanban-column.component';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {DocumentFavoriteToggleService} from '../../../../shared/toggle/document-favorite-toggle.service';
import {Constraint} from '../../../../core/model/constraint';
import {generateCorrelationId, getAttributesResourceType} from '../../../../shared/utils/resource.utils';
import {UnknownConstraint} from '../../../../core/model/constraint/unknown.constraint';
import {ModalService} from '../../../../shared/modal/modal.service';
import {groupLinkInstancesByLinkTypes} from '../../../../core/store/link-instances/link-instance.utils';
import {KanbanCard, KanbanCreateResource, KanbanData, KanbanDataColumn} from '../util/kanban-data';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {AttributesResourceType} from '../../../../core/model/resource';

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

  public readonly dragDelay = DRAG_DELAY;

  private unknownConstraint: Constraint = new UnknownConstraint();

  constructor(
    private store$: Store<AppState>,
    private collectionsPermissionsPipe: CollectionsPermissionsPipe,
    private modalService: ModalService,
    private toggleService: DocumentFavoriteToggleService
  ) {}

  public ngOnInit() {
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

  public onCreateDataResource(resourceCreate: KanbanCreateResource, column: KanbanColumn) {
    const stemConfig = this.config?.stemsConfigs?.[resourceCreate.stemIndex];
    if (stemConfig?.resource) {
      // TODO with link
    } else if (stemConfig?.attribute) {
      this.createObjectInResource(resourceCreate, column);
    }
  }

  public createObjectInResource(resourceCreate: KanbanCreateResource, column: KanbanColumn) {
    const previousDocuments = this.getPreviousDocumentByKanbanResource(resourceCreate);
    if (previousDocuments.length > 0) {
      const linkTypeId = this.getPreviousLinkType(resourceCreate)?.id;
      if (previousDocuments.length === 1) {
        this.createDataResource(resourceCreate, column, previousDocuments[0], linkTypeId);
      } else {
        this.showChooseDocumentModal(resourceCreate, column, previousDocuments, linkTypeId);
      }
    } else if (resourceCreate.kanbanAttribute.resourceType === AttributesResourceType.Collection) {
      this.createDataResource(resourceCreate, column);
    }
  }

  private showChooseDocumentModal(
    resourceCreate: KanbanCreateResource,
    column: KanbanColumn,
    documents: DocumentModel[],
    linkTypeId: string
  ) {
    const callback = document => this.createDataResource(resourceCreate, column, document, linkTypeId);
    const documentIds = (documents || []).map(document => document.id);
    this.modalService.showChooseLinkDocument(documentIds, callback);
  }

  private createDataResource(
    createResource: KanbanCreateResource,
    column: KanbanColumn,
    linkDocument?: DocumentModel,
    linkTypeId?: string
  ) {
    const {document, collection} = this.createDocumentData(createResource, column.title);
    const {linkInstance = null, linkType = null} =
      (linkTypeId && linkDocument && this.createLinkData(createResource, column.title)) || {};

    const creatingDocument = getAttributesResourceType(createResource.resource) === AttributesResourceType.Collection;
    const modalRef = creatingDocument
      ? this.modalService.showDataResourceDetail(document, collection, false)
      : this.modalService.showDataResourceDetail(linkInstance, linkType, false);

    modalRef.content.onSubmit$.subscribe(modifiedDataResource => {
      if (linkDocument && linkTypeId) {
        this.store$.dispatch(
          new DocumentsAction.CreateWithLink({
            document: creatingDocument ? {...document, data: modifiedDataResource.data} : document,
            otherDocumentId: linkDocument.id,
            linkInstance: {
              documentIds: [linkDocument.id, ''],
              linkTypeId,
              data: !creatingDocument ? modifiedDataResource.data : linkInstance.data,
              correlationId: generateCorrelationId(),
            },
            onSuccess: documentId => this.onObjectCreated(documentId, column),
          })
        );
      } else {
        this.store$.dispatch(
          new DocumentsAction.Create({
            document: creatingDocument ? {...document, data: modifiedDataResource.data} : document,
            onSuccess: documentId => this.onObjectCreated(documentId, column),
          })
        );
      }
    });
  }

  private getPreviousDocumentByKanbanResource(resourceCreate: KanbanCreateResource): DocumentModel[] {
    const {pipelineDocuments} = filterDocumentsAndLinksByStem(
      this.collections,
      groupDocumentsByCollection(this.documents),
      this.linkTypes,
      groupLinkInstancesByLinkTypes(this.linkInstances),
      this.constraintData,
      this.query.stems[resourceCreate.stemIndex],
      this.query?.fulltexts || []
    );
    const pipelineIndex = Math.floor((resourceCreate.kanbanAttribute.resourceIndex - 1) / 2);
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

    if (getAttributesResourceType(createResource.resource) === AttributesResourceType.LinkType) {
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

    if (getAttributesResourceType(createResource.resource) === AttributesResourceType.Collection) {
      const constraint = findAttributeConstraint(collection.attributes, createResource.kanbanAttribute.attributeId);
      documentData[createResource.kanbanAttribute.attributeId] = this.createValueByConstraint(constraint, value);
    }

    return {document: {collectionId: collection.id, data: documentData}, collection};
  }

  private getNextCollection(createResource: KanbanCreateResource): Collection {
    if (getAttributesResourceType(createResource.resource) === AttributesResourceType.Collection) {
      return <Collection>createResource.resource;
    }
    const attributesResourcesOrder = queryStemAttributesResourcesOrder(
      this.query.stems[createResource.stemIndex],
      this.collections,
      this.linkTypes
    );
    return attributesResourcesOrder[createResource.kanbanAttribute.resourceIndex + 1];
  }

  private getPreviousLinkType(createResource: KanbanCreateResource): LinkType {
    if (getAttributesResourceType(createResource.resource) === AttributesResourceType.LinkType) {
      return <LinkType>createResource.resource;
    }
    const attributesResourcesOrder = queryStemAttributesResourcesOrder(
      this.query.stems[createResource.stemIndex],
      this.collections,
      this.linkTypes
    );
    return <LinkType>attributesResourcesOrder[createResource.kanbanAttribute.resourceIndex - 1];
  }

  public onUpdateDataResource(object: {card: KanbanCard; newValue: string; previousValue: string}) {
    const {card, newValue, previousValue} = object;
    const stemConfig = this.config.stemsConfigs?.[card.stemIndex];
    if (card.resourceType === AttributesResourceType.Collection) {
      this.onUpdateDocument(card, newValue, previousValue, stemConfig);
    } else if (card.resourceType === AttributesResourceType.LinkType) {
      this.onUpdateLinkInstance(card, newValue, previousValue, stemConfig);
    }
  }

  private onUpdateDocument(card: KanbanCard, newValue: any, previousValue: any, stemConfig: KanbanStemConfig) {
    const document = <DocumentModel>card.dataResource;
    const attributeId = stemConfig?.attribute?.attributeId;
    const collection = (this.collections || []).find(coll => coll.id === document.collectionId);
    const constraint = findAttributeConstraint(collection?.attributes, attributeId);
    const value = this.createValueByConstraint(constraint, newValue, previousValue, document.data?.[attributeId]);
    const data = {...document.data, [attributeId]: value};
    this.patchDocumentData.emit({...document, data});
  }

  private onUpdateLinkInstance(card: KanbanCard, newValue: any, previousValue: any, stemConfig: KanbanStemConfig) {
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
