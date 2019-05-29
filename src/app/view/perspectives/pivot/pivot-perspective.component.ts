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

import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {View, ViewConfig} from '../../../core/store/views/view';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {Collection} from '../../../core/store/collections/collection';
import {Query} from '../../../core/store/navigation/query';
import {User} from '../../../core/store/users/user';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {selectQuery} from '../../../core/store/navigation/navigation.state';
import {map, withLatestFrom} from 'rxjs/operators';
import {queryWithoutLinks} from '../../../core/store/navigation/query.util';
import {selectCurrentView} from '../../../core/store/views/views.state';
import {selectPivotById, selectPivotConfig} from '../../../core/store/pivots/pivots.state';
import {DEFAULT_PIVOT_ID, PivotConfig} from '../../../core/store/pivots/pivot';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {
  selectCollectionsByCustomQuery,
  selectDocumentsByCustomQuery,
} from '../../../core/store/common/permissions.selectors';
import {selectAllUsers} from '../../../core/store/users/users.state';
import {PivotsAction} from '../../../core/store/pivots/pivots.action';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {LinkType} from '../../../core/store/link-types/link.type';

@Component({
  selector: 'pivot-perspective',
  templateUrl: './pivot-perspective.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PivotPerspectiveComponent implements OnInit {
  public config$: Observable<PivotConfig>;
  public currentView$: Observable<View>;
  public documents$: Observable<DocumentModel[]>;
  public collections$: Observable<Collection[]>;
  public linkTypes$: Observable<LinkType[]>;
  public linkInstances$: Observable<LinkInstance[]>;
  public query$ = new BehaviorSubject<Query>(null);
  public users$: Observable<User[]>;

  private subscriptions = new Subscription();
  private pivotId = DEFAULT_PIVOT_ID;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.initPivot();
    this.subscribeToQuery();
    this.subscribeData();
  }

  private initPivot() {
    const subscription = this.store$
      .pipe(
        select(selectCurrentView),
        withLatestFrom(this.store$.pipe(select(selectPivotById(this.pivotId))))
      )
      .subscribe(([view, pivot]) => {
        if (pivot) {
          this.refreshPivot(view && view.config);
        } else {
          this.createPivot(view && view.config);
        }
      });
    this.subscriptions.add(subscription);
  }

  private refreshPivot(viewConfig: ViewConfig) {
    if (viewConfig && viewConfig.pivot) {
      this.store$.dispatch(new PivotsAction.SetConfig({pivotId: this.pivotId, config: viewConfig.pivot}));
    }
  }

  private createPivot(viewConfig: ViewConfig) {
    const config = (viewConfig && viewConfig.pivot) || this.createDefaultConfig();
    const pivot = {id: this.pivotId, config};
    this.store$.dispatch(new PivotsAction.AddPivot({pivot}));
  }

  private createDefaultConfig(): PivotConfig {
    return {};
  }

  private subscribeToQuery() {
    const subscription = this.store$
      .pipe(
        select(selectQuery),
        map(query => query && queryWithoutLinks(query))
      )
      .subscribe(query => {
        this.query$.next(query);
        this.fetchData(query);
        this.subscribeDataByQuery(query);
      });
    this.subscriptions.add(subscription);
  }

  private fetchData(query: Query) {
    this.store$.dispatch(new DocumentsAction.Get({query}));
  }

  private subscribeDataByQuery(query: Query) {
    this.documents$ = this.store$.pipe(select(selectDocumentsByCustomQuery(query)));
    this.collections$ = this.store$.pipe(select(selectCollectionsByCustomQuery(query)));
  }

  private subscribeData() {
    this.config$ = this.store$.pipe(select(selectPivotConfig));
    this.currentView$ = this.store$.pipe(select(selectCurrentView));
    this.users$ = this.store$.pipe(select(selectAllUsers));
  }
}
