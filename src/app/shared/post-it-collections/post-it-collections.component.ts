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

import {Component, HostListener, Input, NgZone, OnDestroy, OnInit, QueryList, ViewChildren} from '@angular/core';
import {AfterViewInit} from '@angular/core/src/metadata/lifecycle_hooks';

import {Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {filter, withLatestFrom} from 'rxjs/operators';
import {Subscription} from 'rxjs';
import {AppState} from '../../core/store/app.state';
import {CollectionModel} from '../../core/store/collections/collection.model';
import {CollectionsAction} from '../../core/store/collections/collections.action';
import {selectCollectionsByQuery} from '../../core/store/collections/collections.state';
import {selectNavigation} from '../../core/store/navigation/navigation.state';
import {Workspace} from '../../core/store/navigation/workspace.model';
import {HashCodeGenerator} from '../utils/hash-code-generator';
import {NotificationsAction} from '../../core/store/notifications/notifications.action';
import {PostItLayoutConfig} from '../utils/layout/post-it-layout-config';
import {PostItLayout} from '../utils/layout/post-it-layout';
import {ProjectModel} from '../../core/store/projects/project.model';
import {isNullOrUndefined} from 'util';
import {selectProjectByWorkspace} from '../../core/store/projects/projects.state';
import {CorrelationIdGenerator} from '../../core/store/correlation-id.generator';
import {DEFAULT_COLOR, DEFAULT_ICON} from '../../core/constants';
import {NotificationService} from '../../core/notifications/notification.service';
import {selectCurrentUserForWorkspace} from '../../core/store/users/users.state';
import {userRolesInResource} from '../utils/resource.utils';
import {QueryModel} from '../../core/store/navigation/query.model';
import {queryIsNotEmpty} from '../../core/store/navigation/query.util';
import {NavigationAction} from '../../core/store/navigation/navigation.action';
import {PostItCollectionComponent} from './post-it-collection.component/post-it-collection.component';
import {Perspective} from '../../view/perspectives/perspective';
import {Router} from '@angular/router';
import {QueryConverter} from '../../core/store/navigation/query.converter';

const UNCREATED_THRESHOLD = 5;

@Component({
  selector: 'post-it-collections',
  templateUrl: './post-it-collections.component.html',
  styleUrls: ['./post-it-collections.component.scss']
})
export class PostItCollectionsComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input()
  public maxShown: number = -1;

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

  @ViewChildren(PostItCollectionComponent)
  public postIts: QueryList<PostItCollectionComponent>;

  public collections: CollectionModel[];
  public collectionRoles: { [collectionId: string]: string[] };
  public selectedCollection: CollectionModel;

  public panelVisible: boolean = false;

  public clickedComponent: any;

  public layout: PostItLayout;

  public project: ProjectModel;

  public focusedPanel: number;

  public workspace: Workspace;

  private query: QueryModel;

  private subscriptions = new Subscription();

  constructor(public i18n: I18n,
              private router: Router,
              private store: Store<AppState>,
              private zone: NgZone,
              private notificationService: NotificationService,) {
  }

  public ngOnInit() {
    this.createLayout();
    this.subscribeOnNavigation();
    this.subscribeOnCollections();
    this.dispatchActions();
  }

  public ngAfterViewInit() {
    this.layout.initialize();
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

  private createLayout() {
    const config = new PostItLayoutConfig();
    config.dragEnabled = false;

    this.layout = new PostItLayout('post-it-collection-layout', config, this.zone);
  }

  private subscribeOnNavigation() {
    const navigationSubscription = this.store.select(selectNavigation).pipe(
      filter(navigation => Boolean(navigation && navigation.workspace && navigation.workspace.organizationCode && navigation.workspace.projectCode))
    ).subscribe(navigation => {
      this.workspace = navigation.workspace;
      this.query = navigation.query;
    });
    this.subscriptions.add(navigationSubscription);

    const projectSubscription = this.store.select(selectProjectByWorkspace).pipe(
      filter(project => !isNullOrUndefined(project)
      )).subscribe(project => this.project = project);
    this.subscriptions.add(projectSubscription);
  }

  private subscribeOnCollections() {
    const collectionsSubscription = this.store.select(selectCollectionsByQuery).pipe(
      withLatestFrom(this.store.select(selectCurrentUserForWorkspace))
    ).subscribe(([collections, user]) => {
      const corrIds: string[] = collections.filter(res => res.correlationId).map(res => res.correlationId);
      const newCollections = this.collections ? this.collections.filter(collection => !collection.id && !corrIds.includes(collection.correlationId)) : [];
      this.collections = newCollections.concat(collections.slice());
      this.collectionRoles = collections.reduce((roles, collection) => {
        roles[collection.id] = userRolesInResource(user, collection);
        return roles;
      }, {});
    });
    this.subscriptions.add(collectionsSubscription);
  }

  public onCollectionSelect(collection: CollectionModel) {
    this.selectedCollection = collection;
  }

  public onCollectionUnselect() {
    this.selectedCollection = null;
  }

  public confirmDeletion(collection: CollectionModel) {
    if (collection.id) {
      this.deleteInitializedPostIt(collection);
    } else {
      this.deleteUninitializedPostIt(collection);
    }
  }

  public newCollection() {
    const newCollection = {
      ...this.emptyCollection(),
      correlationId: CorrelationIdGenerator.generate()
    };

    this.collections.unshift(newCollection);

    this.checkNumberOfUncreatedCollections();
  }

  private emptyCollection(): CollectionModel {
    return {
      name: '',
      color: DEFAULT_COLOR,
      icon: DEFAULT_ICON,
      description: '',
      attributes: []
    };
  }

  private deleteInitializedPostIt(collection: CollectionModel) {
    const title = this.i18n({id: 'collection.delete.dialog.title', value: 'Delete?'});
    const message = this.i18n({id: 'collection.delete.dialog.message', value: 'Do you really want to remove the file?'});

    this.store.dispatch(new NotificationsAction.Confirm(
      {
        title,
        message,
        action: new CollectionsAction.Delete({collectionId: collection.id, callback: this.onRemoveCollection()})
      }));
  }

  public onFavoriteChange(collectionId: string, data: { favorite: boolean, onlyStore: boolean }) {
    const {favorite, onlyStore} = data;
    if (onlyStore) {
      if (favorite) {
        this.store.dispatch(new CollectionsAction.AddFavoriteSuccess({collectionId}));
      } else {
        this.store.dispatch(new CollectionsAction.RemoveFavoriteSuccess({collectionId}));
      }
    } else {
      if (favorite) {
        this.store.dispatch(new CollectionsAction.AddFavorite({collectionId}));
      } else {
        this.store.dispatch(new CollectionsAction.RemoveFavorite({collectionId}));
      }
    }
  }

  private deleteUninitializedPostIt(collection: CollectionModel) {
    this.collections = this.collections.filter(coll => coll.correlationId !== collection.correlationId);
  }

  public updateCollection(collection: CollectionModel) {
    this.store.dispatch(new CollectionsAction.Update({collection, callback: this.onUpdateCollection()}));
  }

  public createCollection(collection: CollectionModel) {
    this.store.dispatch(new CollectionsAction.Create({collection, callback: this.onCreateCollection()}));
  }

  private onCreateCollection(): (collection: CollectionModel) => void {
    const query = this.query;
    const store = this.store;
    const comp = this;
    return collection => {
      if (queryIsNotEmpty(query)) {
        store.dispatch(new NavigationAction.AddCollectionToQuery({collectionId: collection.id}));
      }
      comp.refreshPostIts();
    };
  }

  private onUpdateCollection(): () => void {
    const comp = this;
    return () => {
      comp.refreshPostIts();
    }
  }

  private onRemoveCollection(): (collectionId: string) => void {
    const query = this.query;
    const store = this.store;
    const comp = this;
    return collectionId => {
      if (queryIsNotEmpty(query)) {
        store.dispatch(new NavigationAction.RemoveCollectionFromQuery({collectionId}));
      }
      comp.refreshPostIts();
    };
  }

  public getRoles(collection: CollectionModel): string[] {
    return this.collectionRoles && this.collectionRoles[collection.id] || [];
  }

  public trackByCollection(index: number, collection: CollectionModel): number {
    return HashCodeGenerator.hashString(collection.correlationId || collection.id);
  }

  public notifyOfError(message: string) {
    this.notificationService.error(message);
  }

  public onImportCollection(importInfo: { result: string, name: string, format: string }) {
    const newCollection = {...this.emptyCollection(), name: importInfo.name};
    const importedCollection = {collection: newCollection, data: importInfo.result};

    this.store.dispatch(new CollectionsAction.Import({format: importInfo.format, importedCollection, callback: this.onCreateCollection()}));
  }

  public forceLayout() {
    this.layout.refresh();
  }

  public refreshPostIts() {
    this.postIts && this.postIts.forEach(postIt => postIt.refreshValidators());

    this.checkForPendingUpdatesNames();
  }

  public onShowAllClicked() {
    this.router.navigate([this.workspacePath(), 'view', Perspective.Search, 'files'], {queryParams: {query: QueryConverter.toString(this.query)}});
  }

  private dispatchActions() {
    this.store.dispatch(new CollectionsAction.GetNames());
  }

  private checkNumberOfUncreatedCollections() {
    const numUncreated = this.collections.filter(coll => isNullOrUndefined(coll.id)).length;

    if (numUncreated % UNCREATED_THRESHOLD === 0) {
      const message = this.i18n({
        id: 'collections.postit.empty.info',
        value: 'Looks like you have lot of empty files. Is it okay? We recommend to fill in name or delete them.'
      });

      this.notificationService.info(message);
    }

  }

  private workspacePath(): string {
    return `/w/${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }

  private checkForPendingUpdatesNames() {
    if (!this.postIts) {
      return;
    }

    const pendingUpdates = this.postIts.reduce((updates, postIt, index) => {
      updates.push(postIt.getPendingUpdateName());
      return updates;
    }, []);

    const performedUpdates = [];

    pendingUpdates.forEach((update, index) => {
      if (update && !performedUpdates.includes(update)) {
        const success = this.postIts.toArray()[index].performPendingUpdateName();
        if (success) {
          performedUpdates.push(update);
        }
      }
    });
  }
}
