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

import {Component, ElementRef, HostListener, NgZone, OnDestroy, OnInit, QueryList, ViewChildren} from '@angular/core';
import {AfterViewInit} from '@angular/core/src/metadata/lifecycle_hooks';
import {Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {filter} from 'rxjs/operators';
import {Subscription} from 'rxjs/Subscription';
import {AppState} from '../../core/store/app.state';
import {CollectionModel} from '../../core/store/collections/collection.model';
import {CollectionsAction} from '../../core/store/collections/collections.action';
import {selectCollectionsByQuery} from '../../core/store/collections/collections.state';
import {selectNavigation} from '../../core/store/navigation/navigation.state';
import {QueryConverter} from '../../core/store/navigation/query.converter';
import {QueryModel} from '../../core/store/navigation/query.model';
import {Workspace} from '../../core/store/navigation/workspace.model';
import {Role} from '../permissions/role';
import {HashCodeGenerator} from '../utils/hash-code-generator';
import {NotificationsAction} from '../../core/store/notifications/notifications.action';
import {PostItLayoutConfig} from '../utils/layout/post-it-layout-config';
import {PostItLayout} from '../utils/layout/post-it-layout';
import {ProjectModel} from '../../core/store/projects/project.model';
import {selectOrganizationByWorkspace} from "../../core/store/organizations/organizations.state";
import {isNullOrUndefined} from "util";
import {OrganizationModel} from "../../core/store/organizations/organization.model";
import {selectProjectByWorkspace} from "../../core/store/projects/projects.state";

@Component({
  selector: 'post-it-collections',
  templateUrl: './post-it-collections.component.html',
  styleUrls: ['./post-it-collections.component.scss']
})
export class PostItCollectionsComponent implements OnInit, AfterViewInit, OnDestroy {

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

  @ViewChildren('textArea')
  public nameInputs: QueryList<ElementRef>;

  @ViewChildren('postItElement')
  public postItElements: QueryList<ElementRef>;

  public collections: CollectionModel[];

  public selectedCollection: CollectionModel;

  public panelVisible: boolean = false;

  public clickedComponent: any;

  private layout: PostItLayout;

  private workspace: Workspace;

  private project: ProjectModel;

  private query: QueryModel;

  private navigationSubscription: Subscription;

  private collectionsSubscription: Subscription;

  private projectSubscription: Subscription;

  private focusedPanel: number;

  constructor(public i18n: I18n,
              private store: Store<AppState>,
              private zone: NgZone) {
  }

  public ngOnInit() {
    this.createLayout();
    this.subscribeOnNavigation();
    this.subscribeOnCollections();
  }

  public ngAfterViewInit() {
    this.layout.initialize();
  }

  public ngOnDestroy() {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }

    if (this.collectionsSubscription) {
      this.collectionsSubscription.unsubscribe();
    }

    if (this.projectSubscription) {
      this.projectSubscription.unsubscribe();
    }
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
    this.navigationSubscription = this.store.select(selectNavigation).pipe(
      filter(navigation => Boolean(navigation && navigation.workspace && navigation.workspace.organizationCode && navigation.workspace.projectCode))
    ).subscribe(navigation => {
      this.workspace = navigation.workspace;
      this.query = navigation.query;
    });

    this.projectSubscription = this.store.select(selectProjectByWorkspace).pipe(
      filter(project => !isNullOrUndefined(project)
      )).subscribe(project => this.project = project);
  }

  private subscribeOnCollections() {
    this.collectionsSubscription = this.store.select(selectCollectionsByQuery).subscribe(collections => {
      const corrIds: string[] = collections.filter(res => res.correlationId).map(res => res.correlationId);
      const newCollections = this.collections ? this.collections.filter(collection => !collection.id && !corrIds.includes(collection.correlationId)) : [];
      this.collections = newCollections.concat(collections.slice());
    });
  }

  public toggleFavorite(collection: CollectionModel) {
    if (collection.favourite) {
      this.store.dispatch(new CollectionsAction.RemoveFavorite({collectionId: collection.id}));
    } else {
      this.store.dispatch(new CollectionsAction.AddFavorite({collectionId: collection.id}));
    }
    collection.favourite = !collection.favourite;
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

  public newCollection(collection: CollectionModel) {
    this.collections.unshift(collection);
  }

  private deleteInitializedPostIt(collection: CollectionModel) {
    const title = this.i18n({id: 'collection.delete.dialog.title', value: 'Delete?'});
    const message = this.i18n({id: 'collection.delete.dialog.message', value: 'Do you really want to remove the file?'});

    this.store.dispatch(new NotificationsAction.Confirm(
      {
        title,
        message,
        action: new CollectionsAction.Delete({collectionId: collection.id})
      }));
  }

  private deleteUninitializedPostIt(collection: CollectionModel) {
    this.collections = this.collections.filter(coll => coll.correlationId !== collection.correlationId);
  }

  public onCollectionNameChanged(collection: CollectionModel, newName: string) {
    // Don't update until there is some name
    if (!newName) {
      return;
    }

    const collectionCopy = {...collection, name: newName};

    if (collection.id) {
      this.updateCollection(collectionCopy);
    } else {
      this.createCollection(collectionCopy);
    }
  }

  public updateCollection(collection: CollectionModel) {
    this.store.dispatch(new CollectionsAction.Update({collection}));
  }

  public createCollection(collection: CollectionModel) {
    this.store.dispatch(new CollectionsAction.Create({collection}));
  }

  public hasCreateRights(): boolean {
    return this.project && this.hasRole(this.project, Role.Write);
  }

  public hasManageRole(collection: CollectionModel): boolean {
    return this.hasRole(collection, Role.Manage);
  }

  private hasRole(collection: CollectionModel | ProjectModel, role: string) {
    return collection.permissions && collection.permissions.users
      .some(permission => permission.roles.includes(role));
  }

  public workspacePath(): string {
    return `/w/${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }

  public queryForCollectionDocuments(collectionId: string): string {
    const query: QueryModel = {collectionIds: [collectionId]};
    return QueryConverter.toString(query);
  }

  public trackByCollection(index: number, collection: CollectionModel): number {
    return HashCodeGenerator.hashString(collection.id || collection.correlationId);
  }

  public notifyOfError(message: string) {
    this.store.dispatch(new NotificationsAction.Error({message}));
  }

  public importPayload(payload) {
    this.store.dispatch(new CollectionsAction.Import(payload));
  }

}
