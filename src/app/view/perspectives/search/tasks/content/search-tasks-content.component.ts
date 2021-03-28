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
  SimpleChanges,
} from '@angular/core';
import {Router} from '@angular/router';
import {QueryParam} from '../../../../../core/store/navigation/query-param';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {checkSizeType, SearchDocumentsConfig} from '../../../../../core/store/searches/search';
import {Collection} from '../../../../../core/store/collections/collection';
import {Query} from '../../../../../core/store/navigation/query/query';
import {Workspace} from '../../../../../core/store/navigation/workspace';
import {SizeType} from '../../../../../shared/slider/size/size-type';
import {PerspectiveService} from '../../../../../core/service/perspective.service';
import {Perspective} from '../../../perspective';
import {SearchTab} from '../../../../../core/store/navigation/search-tab';
import {convertQueryModelToString} from '../../../../../core/store/navigation/query/query.converter';
import {DocumentFavoriteToggleService} from '../../../../../shared/toggle/document-favorite-toggle.service';
import {Organization} from '../../../../../core/store/organizations/organization';
import {Project} from '../../../../../core/store/projects/project';
import {DataInputConfiguration} from '../../../../../shared/data-input/data-input-configuration';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {AppState} from '../../../../../core/store/app.state';
import {Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {selectCollectionsPermissions} from '../../../../../core/store/user-permissions/user-permissions.state';
import {ConstraintData} from '@lumeer/data-filters';
import {ModalService} from '../../../../../shared/modal/modal.service';
import {objectsByIdMap} from '../../../../../shared/utils/common.utils';
import {selectTasksCollections} from '../../../../../core/store/common/permissions.selectors';

@Component({
  selector: 'search-tasks-content',
  templateUrl: './search-tasks-content.component.html',
  styleUrls: ['./search-tasks-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DocumentFavoriteToggleService],
})
export class SearchTasksContentComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public documents: DocumentModel[];

  @Input()
  public config: SearchDocumentsConfig;

  @Input()
  public collections: Collection[];

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public maxDocuments: number;

  @Input()
  public query: Query;

  @Input()
  public workspace: Workspace;

  @Input()
  public organization: Organization;

  @Input()
  public project: Project;

  @Input()
  public compactEmptyPages: boolean;

  @Output()
  public configChange = new EventEmitter<SearchDocumentsConfig>();

  public readonly configuration: DataInputConfiguration = {color: {limitWidth: true}};
  public readonly sizeType = SizeType;
  public currentSize: SizeType;
  public truncateContent: boolean;
  public collectionsMap: Record<string, Collection>;
  public allTasksCollections$: Observable<Collection[]>;

  public permissions$: Observable<Record<string, AllowedPermissions>>;

  constructor(
    private perspectiveService: PerspectiveService,
    private router: Router,
    private store$: Store<AppState>,
    private toggleService: DocumentFavoriteToggleService,
    private modalService: ModalService
  ) {}

  public ngOnInit() {
    this.toggleService.setWorkspace(this.workspace);
    this.permissions$ = this.store$.pipe(select(selectCollectionsPermissions));
    this.allTasksCollections$ = this.store$.pipe(select(selectTasksCollections));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.config) {
      this.currentSize = checkSizeType(this.config?.size);
    }
    if (changes.collections) {
      this.collectionsMap = objectsByIdMap(this.collections);
    }
    if (changes.documents || changes.maxDocuments) {
      this.truncateContent = this.maxDocuments > 0 && this.maxDocuments < this.documents?.length;
    }
  }

  public onDetailClick(document: DocumentModel) {
    this.modalService.showDocumentDetail(document.id);
  }

  public switchPerspectiveToTable() {
    this.perspectiveService.switchPerspective(Perspective.Table);
  }

  public trackByDocument(index: number, document: DocumentModel): string {
    return document.id;
  }

  public trackByEntry(index: number, entry: {attributeId: string}): string {
    return entry.attributeId;
  }

  public onSizeChange(size: SizeType) {
    this.configChange.next({...this.config, size});
  }

  private isDocumentExplicitlyExpanded(document: DocumentModel): boolean {
    return ((this.config && this.config.expandedIds) || []).includes(document.id);
  }

  public toggleDocument(document: DocumentModel) {
    const expandedIds = (this.config && this.config.expandedIds) || [];
    const newExpandedIds = this.isDocumentExplicitlyExpanded(document)
      ? expandedIds.filter(id => id !== document.id)
      : [...expandedIds, document.id];
    this.configChange.next({...this.config, expandedIds: newExpandedIds});
  }

  public onShowAll() {
    this.router.navigate([this.workspacePath(), 'view', Perspective.Search, SearchTab.Tasks], {
      queryParams: {[QueryParam.Query]: convertQueryModelToString(this.query)},
    });
  }

  private workspacePath(): string {
    return `/w/${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }

  public onFavoriteToggle(document: DocumentModel) {
    this.toggleService.set(document.id, !document.favorite, document);
  }

  public ngOnDestroy() {
    this.toggleService.onDestroy();
  }
}
