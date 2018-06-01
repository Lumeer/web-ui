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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {DocumentModel} from "../../../core/store/documents/document.model";
import {QueryModel} from "../../../core/store/navigation/query.model";
import {CollectionModel} from "../../../core/store/collections/collection.model";
import {selectCollectionById} from "../../../core/store/collections/collections.state";
import {withLatestFrom} from "rxjs/operators";
import {selectCurrentUserForWorkspace} from "../../../core/store/users/users.state";
import {Role} from "../../../core/model/role";
import {userRolesInResource} from "../../../shared/utils/resource.utils";
import {Subscription} from "rxjs/Subscription";
import {Store} from "@ngrx/store";
import {AppState} from "../../../core/store/app.state";

@Component({
  selector: 'detail-perspective',
  templateUrl: './detail-perspective.component.html',
  styleUrls: ['./detail-perspective.component.scss']
})
export class DetailPerspectiveComponent implements OnInit, OnDestroy {

  public query: QueryModel;

  @Input()
  public embedded: boolean;

  public selectedCollection: CollectionModel;

  public selectedDocument: DocumentModel;

  private userRightsSubscription: Subscription;

  public hasWriteAccess = false;

  private subscriptions = new Subscription();

  constructor(private store: Store<AppState>) { }

  public ngOnInit() {
    this.subscribeAll();
  }

  public ngOnDestroy(): void {
    this.unsubscribeAll();
  }

  private subscribeAll(): void {
  }

  private unsubscribeAll(): void {
    this.subscriptions.unsubscribe();
    this.unsubscribeUserRights();
  }

  public selectCollection(collection: CollectionModel) {
    this.selectedCollection = collection;
    this.hasWriteAccess = false;
    this.subscribeUserRights();
  }

  public selectDocument(document: DocumentModel) {
    this.selectedDocument = document;
  }

  private subscribeUserRights(): void {
    this.unsubscribeUserRights();

    this.userRightsSubscription = this.store.select(selectCollectionById(this.selectedCollection.id)).pipe(
      withLatestFrom(this.store.select(selectCurrentUserForWorkspace))
    ).subscribe(([collection, user]) => {
      const roles = userRolesInResource(user, collection);
      this.hasWriteAccess = roles.includes(Role.Write);
    });
  }

  private unsubscribeUserRights(): void {
    if (this.userRightsSubscription) {
      this.userRightsSubscription.unsubscribe();
    }
  }
}
