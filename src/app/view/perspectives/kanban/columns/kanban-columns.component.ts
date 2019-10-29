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
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {Collection} from '../../../../core/store/collections/collection';
import {KanbanAttribute, KanbanColumn, KanbanConfig} from '../../../../core/store/kanbans/kanban';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {Observable} from 'rxjs';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {Query} from '../../../../core/store/navigation/query/query';
import {User} from '../../../../core/store/users/user';
import {AppState} from '../../../../core/store/app.state';
import {Store} from '@ngrx/store';
import {distinctUntilChanged} from 'rxjs/operators';
import {deepObjectsEquals} from '../../../../shared/utils/common.utils';
import {CollectionsPermissionsPipe} from '../../../../shared/pipes/permissions/collections-permissions.pipe';
import {DRAG_DELAY} from '../../../../core/constants';
import {ConstraintData, ConstraintType} from '../../../../core/model/data/constraint';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {KanbanResourceCreate} from './column/footer/kanban-column-footer.component';
import {ChooseLinkDocumentModalComponent} from '../modal/choose-link-document/choose-link-document-modal.component';
import {filterDocumentsAndLinksByStem} from '../../../../core/store/documents/documents.filters';
import {generateDocumentData, groupDocumentsByCollection} from '../../../../core/store/documents/document.utils';
import {
  getQueryFiltersForCollection,
  queryStemAttributesResourcesOrder,
} from '../../../../core/store/navigation/query/query.util';
import {DocumentsAction} from '../../../../core/store/documents/documents.action';
import {findAttributeConstraint} from '../../../../core/store/collections/collection.util';
import {BsModalService} from 'ngx-bootstrap/modal';
import {KanbanColumnComponent} from './column/kanban-column.component';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {DocumentFavoriteToggleService} from '../../../../shared/toggle/document-favorite-toggle.service';
import {SelectDataValue} from '../../../../core/model/data-value/select.data-value';
import {SelectConstraintConfig} from '../../../../core/model/data/constraint-config';
import {Constraint} from '../../../../core/model/constraint';
import {generateCorrelationId} from '../../../../shared/utils/resource.utils';

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
  public documents: DocumentModel[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public linkInstances: LinkInstance[];

  @Input()
  public canManageConfig: boolean;

  @Input()
  public query: Query;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public currentUser: User;

  @Input()
  public workspace: Workspace;

  @Output()
  public configChange = new EventEmitter<KanbanConfig>();

  @Output()
  public patchDocumentData = new EventEmitter<DocumentModel>();

  public readonly dragDelay = DRAG_DELAY;
  public permissions$: Observable<Record<string, AllowedPermissions>>;

  constructor(
    private store$: Store<AppState>,
    private collectionsPermissionsPipe: CollectionsPermissionsPipe,
    private modalService: BsModalService,
    private toggleService: DocumentFavoriteToggleService
  ) {}

  public ngOnInit() {
    this.toggleService.setWorkspace(this.workspace);
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.collections) {
      this.permissions$ = this.collectionsPermissionsPipe
        .transform(this.collections)
        .pipe(distinctUntilChanged((x, y) => deepObjectsEquals(x, y)));
    }
  }

  public dropColumn(event: CdkDragDrop<string[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const columns = [...this.config.columns];
    moveItemInArray(columns, event.previousIndex, event.currentIndex);

    const newConfig = {...this.config, columns};
    this.configChange.next(newConfig);
  }

  public trackByColumn(index: number, column: KanbanColumn): string {
    return column.title || '';
  }

  public onColumnsChange(data: {columns: KanbanColumn[]; otherColumn: KanbanColumn}) {
    const config = {...this.config, columns: data.columns, otherColumn: data.otherColumn};
    this.configChange.next(config);
  }

  public createObjectInResource(resourceCreate: KanbanResourceCreate, column: KanbanColumn) {
    const previousDocuments = this.getPreviousDocumentByKanbanResource(resourceCreate);
    if (previousDocuments.length > 0) {
      const linkTypeId = this.getPreviousLinkTypeIdByKanbanResource(resourceCreate);
      if (previousDocuments.length === 1) {
        this.createDocument(resourceCreate.kanbanAttribute, column, previousDocuments[0], linkTypeId);
      } else {
        const previousCollection = this.collections.find(coll => coll.id === previousDocuments[0].collectionId);
        this.showChooseDocumentModal(
          resourceCreate.kanbanAttribute,
          column,
          previousDocuments,
          previousCollection,
          linkTypeId
        );
      }
    } else {
      this.createDocument(resourceCreate.kanbanAttribute, column);
    }
  }

  private showChooseDocumentModal(
    kanbanAttribute: KanbanAttribute,
    column: KanbanColumn,
    documents: DocumentModel[],
    collection: Collection,
    linkTypeId: string
  ) {
    const callback = document => this.createDocument(kanbanAttribute, column, document, linkTypeId);
    const config = {initialState: {documents, collection, callback}, keyboard: true, class: 'modal-lg'};
    this.modalService.show(ChooseLinkDocumentModalComponent, config);
  }

  private getPreviousDocumentByKanbanResource(resourceCreate: KanbanResourceCreate): DocumentModel[] {
    const {pipelineDocuments} = filterDocumentsAndLinksByStem(
      groupDocumentsByCollection(this.documents),
      this.collections,
      this.linkTypes,
      this.linkInstances,
      resourceCreate.stem,
      []
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
          linkTypeId,
          correlationId: generateCorrelationId(),
          callback: documentId => this.onDocumentCreated(documentId, column),
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
    const component = this.columns.find(cmp => cmp.column.id === column.id);
    component && component.onDocumentCreated(id);
  }

  private createDocumentWithData(kanbanAttribute: KanbanAttribute, value: any): DocumentModel {
    const collection = (this.collections || []).find(coll => coll.id === kanbanAttribute.resourceId);
    const collectionsFilters = getQueryFiltersForCollection(this.query, collection.id);
    const data = generateDocumentData(collection, collectionsFilters, this.currentUser);
    const constraint = findAttributeConstraint(collection.attributes, kanbanAttribute.attributeId);
    data[kanbanAttribute.attributeId] = this.createValueByConstraint(constraint, value);
    return {collectionId: collection.id, data};
  }

  public onUpdateDocument(object: {document: DocumentModel; newValue: string; attributeId: string}) {
    const {document, newValue, attributeId} = object;
    const collection = (this.collections || []).find(coll => coll.id === document.collectionId);
    if (collection) {
      const constraint = findAttributeConstraint(collection.attributes, attributeId);
      const value = this.createValueByConstraint(constraint, newValue);
      const data = {...document.data, [attributeId]: value};
      this.patchDocumentData.emit({...document, data});
    }
  }

  private createValueByConstraint(constraint: Constraint, newValue: any): any {
    if (constraint && constraint.type === ConstraintType.Select) {
      return new SelectDataValue(newValue, constraint.config as SelectConstraintConfig, true).serialize();
    } else {
      return constraint ? constraint.createDataValue(newValue).serialize() : newValue;
    }
  }

  public onRemoveColumn(column: KanbanColumn) {
    const filteredColumns = (this.config.columns || []).filter(col => col.id !== column.id);
    const config = {...this.config, columns: filteredColumns};
    this.configChange.next(config);
  }

  public onToggleFavorite(document: DocumentModel) {
    this.toggleService.set(document.id, !document.favorite, document);
  }

  public ngOnDestroy() {
    this.toggleService.onDestroy();
  }
}
