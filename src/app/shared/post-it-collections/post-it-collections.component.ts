/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';

import {select, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {filter, take} from 'rxjs/operators';
import {Subscription} from 'rxjs';
import {AppState} from '../../core/store/app.state';
import {Collection} from '../../core/store/collections/collection';
import {CollectionsAction} from '../../core/store/collections/collections.action';
import {selectCollectionsLoaded} from '../../core/store/collections/collections.state';
import {selectNavigation} from '../../core/store/navigation/navigation.state';
import {Workspace} from '../../core/store/navigation/workspace';
import {NotificationsAction} from '../../core/store/notifications/notifications.action';
import {PostItLayout} from '../utils/layout/post-it-layout';
import {Project} from '../../core/store/projects/project';
import {selectProjectByWorkspace} from '../../core/store/projects/projects.state';
import {NotificationService} from '../../core/notifications/notification.service';
import {queryIsNotEmpty} from '../../core/store/navigation/query.util';
import {NavigationAction} from '../../core/store/navigation/navigation.action';
import {PostItCollectionComponent} from './post-it-collection.component/post-it-collection.component';
import {Perspective} from '../../view/perspectives/perspective';
import {ActivatedRoute, Router} from '@angular/router';
import {convertQueryModelToString} from '../../core/store/navigation/query.converter';
import {safeGetRandomIcon} from '../picker/icon-picker/icons';
import * as Colors from '../picker/color-picker/colors';
import {QueryAction} from '../../core/model/query-action';
import {sortCollectionsByFavoriteAndLastUsed} from '../../core/store/collections/collection.util';
import {selectCollectionsByQuery} from '../../core/store/common/permissions.selectors';
import {Query} from '../../core/store/navigation/query';
import {ResourceType} from '../../core/model/resource-type';
import {isNullOrUndefined} from '../utils/common.utils';
import {generateCorrelationId} from '../utils/resource.utils';

const UNCREATED_THRESHOLD = 5;

@Component({
  selector: 'post-it-collections',
  templateUrl: './post-it-collections.component.html',
  styleUrls: ['./post-it-collections.component.scss'],
})
export class PostItCollectionsComponent implements OnInit, OnDestroy {
  @Input()
  public maxShown: number = -1;

  @ViewChildren(PostItCollectionComponent)
  public postIts: QueryList<PostItCollectionComponent>;

  @ViewChild('postItLayout')
  set content(content: ElementRef) {
    if (content) {
      this.postItLayout = content;
      this.createLayout();
    } else {
      this.destroyLayout();
    }
  }

  public collections: Collection[];
  public correlationIdsOrder: string[] = [];
  public selectedCollection: Collection;
  public panelVisible: boolean = false;
  public clickedComponent: any;
  public layout: PostItLayout;
  public project: Project;
  public focusedPanel: number;
  public workspace: Workspace;
  public query: Query;
  public collectionsLoaded: boolean;

  public readonly projectType = ResourceType.Project;

  private postItLayout: ElementRef;
  private colors = Colors.palette;
  private subscriptions = new Subscription();

  constructor(
    private i18n: I18n,
    private router: Router,
    private store$: Store<AppState>,
    private zone: NgZone,
    private activatedRoute: ActivatedRoute,
    private changeDetector: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {}

  /**
   * Handler to change the flag to remove opacity css on elements
   * @param targetElement
   */
  @HostListener('document:click', ['$event.target'])
  public documentClicked(targetElement) {
    if (this.clickedComponent && targetElement !== this.clickedComponent) {
      this.panelVisible = false;
    }
  }

  public ngOnInit() {
    this.subscribeOnRoute();
    this.subscribeOnNavigation();
    this.subscribeOnCollections();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public togglePanelVisible(event, index) {
    this.clickedComponent = event.target;
    if (this.focusedPanel === index) {
      this.panelVisible = !this.panelVisible;
    } else {
      this.panelVisible = true;
    }
    this.focusedPanel = index;
  }

  public onCollectionSelect(collection: Collection) {
    this.selectedCollection = collection;
  }

  public onCollectionUnselect() {
    this.selectedCollection = null;
  }

  public confirmDeletion(collection: Collection) {
    if (collection.id) {
      this.deleteInitializedPostIt(collection);
    } else {
      this.deleteUninitializedPostIt(collection);
    }
  }

  public createNewCollection() {
    const newCollection = {...this.emptyCollection(), correlationId: generateCorrelationId()};

    if (this.collections) {
      this.collections.unshift(newCollection);
      this.checkNumberOfUncreatedCollections();
    } else {
      this.collections = [newCollection];
    }

    this.correlationIdsOrder.unshift(newCollection.correlationId);
  }

  private emptyCollection(): Collection {
    return {
      name: '',
      color: this.colors[Math.round(Math.random() * this.colors.length)],
      icon: safeGetRandomIcon(),
      description: '',
      attributes: [],
    };
  }

  public onFavoriteChange(collectionId: string, data: {favorite: boolean; onlyStore: boolean}) {
    const {favorite, onlyStore} = data;
    if (onlyStore) {
      if (favorite) {
        this.store$.dispatch(new CollectionsAction.AddFavoriteSuccess({collectionId}));
      } else {
        this.store$.dispatch(new CollectionsAction.RemoveFavoriteSuccess({collectionId}));
      }
    } else {
      if (favorite) {
        this.store$.dispatch(new CollectionsAction.AddFavorite({collectionId}));
      } else {
        this.store$.dispatch(new CollectionsAction.RemoveFavorite({collectionId}));
      }
    }
  }

  public updateCollection(collection: Collection) {
    if (collection.id) {
      this.store$.dispatch(new CollectionsAction.Update({collection}));
    }
  }

  public createCollection(newCollection: Collection) {
    this.store$.dispatch(
      new CollectionsAction.Create({
        collection: newCollection,
        callback: collection => this.onCreateCollection(collection),
      })
    );
  }

  public trackByCollection(index: number, collection: Collection): string {
    return collection.correlationId || collection.id;
  }

  public notifyOfError(message: string) {
    this.notificationService.error(message);
  }

  public onImportCollection(importInfo: {result: string; name: string; format: string}) {
    const newCollection = {...this.emptyCollection(), name: importInfo.name};
    const importedCollection = {collection: newCollection, data: importInfo.result};

    this.store$.dispatch(
      new CollectionsAction.Import({
        format: importInfo.format,
        importedCollection,
        callback: collection => this.onCreateCollection(collection),
      })
    );
  }

  public forceLayout() {
    this.layout.refresh();
  }

  public onShowAllClicked() {
    this.router.navigate([this.workspacePath(), 'view', Perspective.Search, 'collections'], {
      queryParams: {query: convertQueryModelToString(this.query)},
    });
  }

  private destroyLayout() {
    this.layout = null;
  }

  private createLayout() {
    if (!this.layout) {
      this.layout = new PostItLayout(this.postItLayout, false, this.zone);
      this.changeDetector.detectChanges();
    }
  }

  private subscribeOnRoute() {
    this.activatedRoute.queryParams.pipe(take(1)).subscribe(queryParams => {
      const action = queryParams['action'];
      if (action && action === QueryAction.CreateCollection) {
        this.createNewCollection();

        const myQueryParams = Object.assign({}, queryParams);
        delete myQueryParams.action;
        this.router.navigate([], {
          relativeTo: this.activatedRoute,
          queryParams: myQueryParams,
        });
      }
    });
  }

  private subscribeOnNavigation() {
    const navigationSubscription = this.store$
      .pipe(
        select(selectNavigation),
        filter(navigation =>
          Boolean(
            navigation &&
              navigation.workspace &&
              navigation.workspace.organizationCode &&
              navigation.workspace.projectCode
          )
        )
      )
      .subscribe(navigation => {
        this.workspace = navigation.workspace;
        this.query = navigation.query;
      });
    this.subscriptions.add(navigationSubscription);

    const projectSubscription = this.store$
      .pipe(
        select(selectProjectByWorkspace),
        filter(project => !isNullOrUndefined(project))
      )
      .subscribe(project => (this.project = project));
    this.subscriptions.add(projectSubscription);
  }

  private subscribeOnCollections() {
    const collectionsSubscription = this.store$
      .pipe(select(selectCollectionsByQuery))
      .subscribe(collections => (this.collections = this.sortCollectionsFromStore(collections)));
    this.subscriptions.add(collectionsSubscription);

    const loadedSubscription = this.store$
      .pipe(select(selectCollectionsLoaded))
      .subscribe(loaded => (this.collectionsLoaded = loaded));
    this.subscriptions.add(loadedSubscription);
  }

  private sortCollectionsFromStore(collections: Collection[]): Collection[] {
    const uncreatedCollections = (this.collections && this.collections.filter(collection => !collection.id)) || [];
    this.filterCorrelationIds(uncreatedCollections, collections);

    const collectionsCopy = [...collections];

    const newCollections = [];
    for (let i = 0; i < this.correlationIdsOrder.length; i++) {
      const indexInCreated = collectionsCopy.findIndex(
        collection => collection.correlationId === this.correlationIdsOrder[i]
      );
      if (indexInCreated !== -1) {
        newCollections.push(collectionsCopy[indexInCreated]);
        collectionsCopy.splice(indexInCreated, 1);
        continue;
      }

      const uncreatedCollection = uncreatedCollections.find(
        collection => collection.correlationId === this.correlationIdsOrder[i]
      );
      if (uncreatedCollection) {
        newCollections.push(uncreatedCollection);
      }
    }

    return newCollections.concat(sortCollectionsByFavoriteAndLastUsed(collectionsCopy));
  }

  private filterCorrelationIds(uncreatedCollections: Collection[], newCollections: Collection[]) {
    const uncreatedCorrelationIds = uncreatedCollections.map(collection => collection.correlationId);
    const currentUsedCorrelationIds = newCollections
      .filter(collection => collection.correlationId)
      .map(collection => collection.correlationId)
      .concat(uncreatedCorrelationIds);

    this.correlationIdsOrder = this.correlationIdsOrder.filter(correlationId =>
      currentUsedCorrelationIds.includes(correlationId)
    );
  }

  private deleteInitializedPostIt(collection: Collection) {
    const title = this.i18n({id: 'collection.delete.dialog.title', value: 'Delete?'});
    const message = this.i18n({
      id: 'collection.delete.dialog.message',
      value: 'Do you really want to delete this collection?',
    });

    this.store$.dispatch(
      new NotificationsAction.Confirm({
        title,
        message,
        action: new CollectionsAction.Delete({collectionId: collection.id}),
      })
    );
  }

  private deleteUninitializedPostIt(collection: Collection) {
    this.collections = this.collections.filter(coll => coll.correlationId !== collection.correlationId);
    this.correlationIdsOrder = this.correlationIdsOrder.filter(corrId => corrId !== collection.correlationId);
  }

  private onCreateCollection(collection: Collection) {
    if (queryIsNotEmpty(this.query)) {
      this.store$.dispatch(new NavigationAction.AddCollectionToQuery({collectionId: collection.id}));
    }
  }

  private checkNumberOfUncreatedCollections() {
    const numUncreated = this.collections.filter(coll => isNullOrUndefined(coll.id)).length;

    if (numUncreated % UNCREATED_THRESHOLD === 0) {
      const message = this.i18n({
        id: 'collections.postit.empty.info',
        value:
          'Looks like you have lot of empty collections. Is it okay? I would suggest to fill in their names or delete them.',
      });

      this.notificationService.info(message);
    }
  }

  private workspacePath(): string {
    return `/w/${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }
}
