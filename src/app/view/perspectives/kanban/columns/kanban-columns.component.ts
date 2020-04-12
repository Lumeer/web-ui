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
import {KanbanAttribute, KanbanColumn} from '../../../../core/store/kanbans/kanban';
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
import {KanbanResourceCreate} from './column/footer/kanban-column-footer.component';
import {filterDocumentsAndLinksByStem} from '../../../../core/store/documents/documents.filters';
import {generateDocumentData, groupDocumentsByCollection} from '../../../../core/store/documents/document.utils';
import {
  getQueryFiltersForCollection,
  queryStemAttributesResourcesOrder,
} from '../../../../core/store/navigation/query/query.util';
import {DocumentsAction} from '../../../../core/store/documents/documents.action';
import {findAttributeConstraint} from '../../../../core/store/collections/collection.util';
import {KanbanColumnComponent} from './column/kanban-column.component';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {DocumentFavoriteToggleService} from '../../../../shared/toggle/document-favorite-toggle.service';
import {Constraint} from '../../../../core/model/constraint';
import {generateCorrelationId} from '../../../../shared/utils/resource.utils';
import {UnknownConstraint} from '../../../../core/model/constraint/unknown.constraint';
import {ModalService} from '../../../../shared/modal/modal.service';
import {groupLinkInstancesByLinkTypes} from '../../../../core/store/link-instances/link-instance.utils';
import {KanbanData} from '../util/kanban-data';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';

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
  public patchDocumentData = new EventEmitter<DocumentModel>();

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
    //TODO
    // const columns = [...this.config.columns];
    // moveItemInArray(columns, event.previousIndex, event.currentIndex);
  }

  public trackByColumn(index: number, column: KanbanColumn): string {
    return column.title || '';
  }

  public createObjectInResource(resourceCreate: KanbanResourceCreate, column: KanbanColumn) {
    const previousDocuments = this.getPreviousDocumentByKanbanResource(resourceCreate);
    if (previousDocuments.length > 0) {
      const linkTypeId = this.getPreviousLinkTypeIdByKanbanResource(resourceCreate);
      if (previousDocuments.length === 1) {
        this.createDocument(resourceCreate.kanbanAttribute, column, previousDocuments[0], linkTypeId);
      } else {
        this.showChooseDocumentModal(resourceCreate.kanbanAttribute, column, previousDocuments, linkTypeId);
      }
    } else {
      this.createDocument(resourceCreate.kanbanAttribute, column);
    }
  }

  private showChooseDocumentModal(
    kanbanAttribute: KanbanAttribute,
    column: KanbanColumn,
    documents: DocumentModel[],
    linkTypeId: string
  ) {
    const callback = document => this.createDocument(kanbanAttribute, column, document, linkTypeId);
    const documentIds = (documents || []).map(document => document.id);
    this.modalService.showChooseLinkDocument(documentIds, callback);
  }

  private getPreviousDocumentByKanbanResource(resourceCreate: KanbanResourceCreate): DocumentModel[] {
    const {pipelineDocuments} = filterDocumentsAndLinksByStem(
      this.collections,
      groupDocumentsByCollection(this.documents),
      this.linkTypes,
      groupLinkInstancesByLinkTypes(this.linkInstances),
      this.constraintData,
      resourceCreate.stem,
      (this.query && this.query.fulltexts) || []
    );
    const pipelineIndex = resourceCreate.kanbanAttribute.resourceIndex / 2;
    return pipelineDocuments[pipelineIndex - 1] || [];
  }

  private getPreviousLinkTypeIdByKanbanResource(resourceCreate: KanbanResourceCreate): string {
    const attributesResourcesOrder = queryStemAttributesResourcesOrder(
      resourceCreate.stem,
      this.collections,
      this.linkTypes
    );
    const linkType = attributesResourcesOrder[resourceCreate.kanbanAttribute.resourceIndex - 1];
    return linkType && linkType.id;
  }

  private createDocument(
    kanbanAttribute: KanbanAttribute,
    column: KanbanColumn,
    linkDocument?: DocumentModel,
    linkTypeId?: string
  ) {
    const document = this.createDocumentWithData(kanbanAttribute, column.title);
    if (linkDocument && linkTypeId) {
      this.store$.dispatch(
        new DocumentsAction.CreateWithLink({
          document,
          otherDocumentId: linkDocument.id,
          linkInstance: {
            documentIds: [linkDocument.id, ''],
            linkTypeId,
            data: {},
            correlationId: generateCorrelationId(),
          },
          onSuccess: documentId => this.onDocumentCreated(documentId, column),
        })
      );
    } else {
      this.store$.dispatch(
        new DocumentsAction.Create({
          document,
          onSuccess: documentId => this.onDocumentCreated(documentId, column),
        })
      );
    }
  }

  private onDocumentCreated(id: string, column: KanbanColumn) {
    this.modalService.showDocumentDetail(id);
    const component = this.columns.find(cmp => cmp.column.id === column.id);
    component?.onDataResourceCreated(id);
  }

  private createDocumentWithData(kanbanAttribute: KanbanAttribute, value: any): DocumentModel {
    const collection = (this.collections || []).find(coll => coll.id === kanbanAttribute.resourceId);
    const collectionsFilters = getQueryFiltersForCollection(this.query, collection.id);
    const data = generateDocumentData(collection, collectionsFilters, this.constraintData, false);
    const constraint = findAttributeConstraint(collection.attributes, kanbanAttribute.attributeId);
    data[kanbanAttribute.attributeId] = this.createValueByConstraint(constraint, value);
    return {collectionId: collection.id, data};
  }

  public onUpdateDocument(object: {
    document: DocumentModel;
    newValue: string;
    previousValue: string;
    attributeId: string;
  }) {
    const {document, newValue, attributeId, previousValue} = object;
    const collection = (this.collections || []).find(coll => coll.id === document.collectionId);
    if (collection) {
      const constraint = findAttributeConstraint(collection.attributes, attributeId);
      const value = this.createValueByConstraint(constraint, newValue, previousValue, document.data[attributeId]);
      const data = {...document.data, [attributeId]: value};
      this.patchDocumentData.emit({...document, data});
    }
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
    this.columnRemove.emit(column); // TODO
    // const filteredColumns = (this.config.columns || []).filter(col => col.id !== column.id);
    // const config = {...this.config, columns: filteredColumns};
    // this.configChange.next(config);
  }

  public onToggleFavorite(document: DocumentModel) {
    this.toggleService.set(document.id, !document.favorite, document);
  }

  public ngOnDestroy() {
    this.toggleService.onDestroy();
  }
}
