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
import {Store} from '@ngrx/store';
import {Router} from '@angular/router';

import {AppState} from '../../../../core/store/app.state';
import {combineLatest, Observable, Subscription} from 'rxjs';
import {selectViewsByQuery, selectViewsLoaded} from '../../../../core/store/views/views.state';
import {selectNavigation} from '../../../../core/store/navigation/navigation.state';
import {Workspace} from '../../../../core/store/navigation/workspace.model';
import {ViewModel} from '../../../../core/store/views/view.model';
import {selectAllCollections} from '../../../../core/store/collections/collections.state';
import {selectAllLinkTypes} from '../../../../core/store/link-types/link-types.state';
import {QueryData} from '../../../../shared/top-panel/search-box/query-data';
import {filter} from 'rxjs/operators';
import {Perspective} from '../../perspective';
import {convertQueryModelToString} from '../../../../core/store/navigation/query.converter';
import {isNullOrUndefined} from 'util';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {ViewsAction} from '../../../../core/store/views/views.action';
import {NotificationService} from '../../../../core/notifications/notification.service';
import {Query} from '../../../../core/store/navigation/query';

@Component({
  selector: 'search-views',
  templateUrl: './search-views.component.html',
})
export class SearchViewsComponent implements OnInit, OnDestroy {
  @Input()
  public maxLines: number = -1;

  public views$: Observable<ViewModel[]>;
  public queryData: QueryData;

  private subscriptions = new Subscription();

  private viewsLoaded: boolean;

  private workspace: Workspace;
  public query: Query;

  constructor(
    private router: Router,
    private i18n: I18n,
    private notificationService: NotificationService,
    private store: Store<AppState>
  ) {}

  public ngOnInit() {
    this.views$ = this.store.select(selectViewsByQuery);
    this.subscribeToNavigation();
    this.subscribeToData();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private subscribeToNavigation() {
    const navigationSubscription = this.store
      .select(selectNavigation)
      .pipe(filter(navigation => !!navigation.workspace && !!navigation.query))
      .subscribe(navigation => {
        this.workspace = navigation.workspace;
        this.query = navigation.query;
      });
    this.subscriptions.add(navigationSubscription);
  }

  private subscribeToData() {
    const dataSubscription = combineLatest(
      this.store.select(selectAllCollections),
      this.store.select(selectAllLinkTypes)
    ).subscribe(([collections, linkTypes]) => (this.queryData = {collections, linkTypes}));
    this.subscriptions.add(dataSubscription);

    const loadedSubscription = this.store.select(selectViewsLoaded).subscribe(loaded => (this.viewsLoaded = loaded));
    this.subscriptions.add(loadedSubscription);
  }

  public onDeleteView(view: ViewModel) {
    const message = this.i18n({
      id: 'views.delete.message',
      value: 'Do you really want to permanently delete this view?',
    });
    const title = this.i18n({id: 'views.delete.title', value: 'Delete view?'});
    const yesButtonText = this.i18n({id: 'button.yes', value: 'Yes'});
    const noButtonText = this.i18n({id: 'button.no', value: 'No'});

    this.notificationService.confirm(message, title, [
      {text: noButtonText},
      {text: yesButtonText, action: () => this.deleteView(view), bold: false},
    ]);
  }

  public deleteView(view: ViewModel) {
    this.store.dispatch(new ViewsAction.Delete({viewCode: view.code}));
  }

  public isLoading(): boolean {
    return isNullOrUndefined(this.viewsLoaded) || isNullOrUndefined(this.query);
  }

  public showView(view: ViewModel) {
    this.router.navigate(['/w', this.workspace.organizationCode, this.workspace.projectCode, 'view', {vc: view.code}]);
  }

  public trackByView(index: number, view: ViewModel): string {
    return view.id;
  }

  public onShowAll() {
    this.router.navigate([this.workspacePath(), 'view', Perspective.Search, 'views'], {
      queryParams: {query: convertQueryModelToString(this.query)},
    });
  }

  private workspacePath(): string {
    return `/w/${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }
}
