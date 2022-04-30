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
import {KanbanColumn, KanbanConfig} from '../../../../../core/store/kanbans/kanban';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {Query} from '../../../../../core/store/navigation/query/query';
import {AppState} from '../../../../../core/store/app.state';
import {Store} from '@ngrx/store';
import {DRAG_DELAY} from '../../../../../core/constants';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {KanbanColumnComponent} from './column/kanban-column.component';
import {Workspace} from '../../../../../core/store/navigation/workspace';
import {DocumentFavoriteToggleService} from '../../../../../shared/toggle/document-favorite-toggle.service';
import {KanbanCard, KanbanCreateResource, KanbanData, KanbanDataColumn} from '../../util/kanban-data';
import {ResourcesPermissions} from '../../../../../core/model/allowed-permissions';
import {DataResource} from '../../../../../core/model/resource';
import {ConstraintData, DocumentsAndLinksData} from '@lumeer/data-filters';
import {User} from '../../../../../core/store/users/user';
import {ViewSettings} from '../../../../../core/store/views/view';
import {KanbanPerspectiveConfiguration} from '../../../perspective-configuration';
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

  public readonly dragDelay = DRAG_DELAY;

  constructor(
    private store$: Store<AppState>,
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
      queryResource: stemConfig.resource || stemConfig.attribute,
      stem: stemConfig.stem,
      grouping: [grouping].filter(val => !!val),
      dataResourcesChains,
      data,
      failureMessage: $localize`:@@perspective.kanban.create.card.failure:Could not create card`,
      onCreated: dataResource => this.onDataResourceCreated(dataResource),
    });
  }

  public onMoveDataResource(object: {card: KanbanCard; fromColumn: KanbanDataColumn; toColumn: KanbanDataColumn}) {
    const {card, fromColumn, toColumn} = object;
    const stemConfig = this.config.stemsConfigs?.[card.stemIndex];
    const grouping = stemConfig?.resource ? {value: toColumn.title, attribute: stemConfig.attribute} : null;
    const dataResourcesChains = toColumn.cards.map(card => card.dataResourcesChain);
    const data = {[stemConfig.attribute.resourceId]: {[stemConfig.attribute.attributeId]: toColumn.title}};
    this.createService.update({
      queryResource: stemConfig.resource || stemConfig.attribute,
      stem: stemConfig.stem,
      grouping: [grouping].filter(val => !!val),
      dataResourcesChains,
      data,
      dataResource: card.dataResource,
      dataResourceChain: card.dataResourcesChain,
      previousValue: fromColumn.title,
      newValue: toColumn.title,
      attributeId: stemConfig.attribute.attributeId,
      failureMessage: $localize`:@@perspective.kanban.move.card.failure:Could not move card`,
    });
  }

  private onDataResourceCreated(dataResource: DataResource) {
    this.columns.forEach(column => column.onDataResourceCreated(dataResource.id));
  }

  private currentWorkspace(): Workspace {
    return {...this.workspace, viewId: this.viewId};
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
