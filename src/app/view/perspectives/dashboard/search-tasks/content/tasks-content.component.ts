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

import {Store, select} from '@ngrx/store';

import {BehaviorSubject, Observable, Subscription} from 'rxjs';

import {ConstraintData} from '@lumeer/data-filters';
import {objectsByIdMap} from '@lumeer/utils';

import {AllowedPermissionsMap} from '../../../../../core/model/allowed-permissions';
import {AppState} from '../../../../../core/store/app.state';
import {Collection, CollectionPurposeType} from '../../../../../core/store/collections/collection';
import {
  selectHasVisibleSearchTab,
  selectTasksCollections,
} from '../../../../../core/store/common/permissions.selectors';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {QueryParam} from '../../../../../core/store/navigation/query-param';
import {Query} from '../../../../../core/store/navigation/query/query';
import {convertQueryModelToString} from '../../../../../core/store/navigation/query/query.converter';
import {SearchTab} from '../../../../../core/store/navigation/search-tab';
import {Workspace} from '../../../../../core/store/navigation/workspace';
import {Organization} from '../../../../../core/store/organizations/organization';
import {Project} from '../../../../../core/store/projects/project';
import {SearchTasksConfig, checkSizeType} from '../../../../../core/store/searches/search';
import {selectViewsPermissions} from '../../../../../core/store/user-permissions/user-permissions.state';
import {User} from '../../../../../core/store/users/user';
import {View} from '../../../../../core/store/views/view';
import {selectDefaultDocumentViews} from '../../../../../core/store/views/views.state';
import {DataInputConfiguration} from '../../../../../shared/data-input/data-input-configuration';
import {ModalService} from '../../../../../shared/modal/modal.service';
import {SizeType} from '../../../../../shared/slider/size/size-type';
import {DocumentFavoriteToggleService} from '../../../../../shared/toggle/document-favorite-toggle.service';
import {Perspective} from '../../../perspective';
import {
  SearchPerspectiveConfiguration,
  defaultSearchPerspectiveConfiguration,
} from '../../../perspective-configuration';
import {TasksGroup} from '../model/tasks-group';

@Component({
  selector: 'tasks-content',
  templateUrl: './tasks-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DocumentFavoriteToggleService],
})
export class TasksContentComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public documents: DocumentModel[];

  @Input()
  public config: SearchTasksConfig;

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

  @Input()
  public views: View[];

  @Input()
  public view: View;

  @Input()
  public currentUser: User;

  @Input()
  public permissions: AllowedPermissionsMap;

  @Input()
  public perspectiveConfiguration: SearchPerspectiveConfiguration = defaultSearchPerspectiveConfiguration;

  @Output()
  public configChange = new EventEmitter<SearchTasksConfig>();

  public readonly configuration: DataInputConfiguration = {color: {limitWidth: true}};
  public readonly sizeType = SizeType;
  public currentSize: SizeType;
  public collectionsMap: Record<string, Collection>;
  public allTasksCollections$: Observable<Collection[]>;
  public defaultTasksViews$: Observable<View[]>;
  public tasksPermissions$: Observable<AllowedPermissionsMap>;
  public truncateContent$ = new BehaviorSubject(false);

  private hasTasksTab: boolean;
  private userToggledShowAll: boolean;
  private subscription = new Subscription();

  constructor(
    private router: Router,
    private store$: Store<AppState>,
    private toggleService: DocumentFavoriteToggleService,
    private modalService: ModalService
  ) {}

  public ngOnInit() {
    this.toggleService.setWorkspace(this.workspace);
    this.allTasksCollections$ = this.store$.pipe(select(selectTasksCollections));
    this.defaultTasksViews$ = this.store$.pipe(select(selectDefaultDocumentViews(CollectionPurposeType.Tasks)));
    this.tasksPermissions$ = this.store$.pipe(select(selectViewsPermissions));

    this.subscription = this.store$
      .pipe(select(selectHasVisibleSearchTab(SearchTab.Tasks)))
      .subscribe(hasTab => (this.hasTasksTab = hasTab));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.config) {
      this.currentSize = checkSizeType(this.config?.size);
    }
    if (changes.collections) {
      this.collectionsMap = objectsByIdMap(this.collections);
    }
    if (changes.documents || changes.maxDocuments) {
      this.truncateContent$.next(
        !this.userToggledShowAll && this.maxDocuments > 0 && this.maxDocuments < this.documents?.length
      );
    }
  }

  public onDetailClick(document: DocumentModel) {
    const collection = this.collectionsMap?.[document.collectionId];
    this.modalService.showDataResourceDetail(document, collection, this.view?.id);
  }

  public trackByGroup(index: number, group: TasksGroup): string {
    return group.title || '';
  }

  private isDocumentExplicitlyExpanded(document: DocumentModel): boolean {
    return (this.config?.expandedIds || []).includes(document.id);
  }

  public toggleDocument(document: DocumentModel) {
    const expandedIds = this.config?.expandedIds || [];
    const newExpandedIds = this.isDocumentExplicitlyExpanded(document)
      ? expandedIds.filter(id => id !== document.id)
      : [...expandedIds, document.id];
    this.configChange.next({...this.config, expandedIds: newExpandedIds});
  }

  public onShowAll() {
    if (this.hasTasksTab) {
      this.router.navigate([this.workspacePath(), 'view', Perspective.Search, SearchTab.Tasks], {
        queryParams: {[QueryParam.Query]: convertQueryModelToString(this.query)},
      });
    } else {
      this.userToggledShowAll = true;
      this.truncateContent$.next(false);
    }
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
