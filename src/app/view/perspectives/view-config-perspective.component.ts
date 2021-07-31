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

import {Injectable, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, combineLatest, Observable, of, Subscription} from 'rxjs';
import {Collection} from '../../core/store/collections/collection';
import {LinkType} from '../../core/store/link-types/link.type';
import {Query} from '../../core/store/navigation/query/query';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../core/store/app.state';
import {selectCurrentView, selectViewQuery} from '../../core/store/views/views.state';
import {map, mergeMap, pairwise, startWith, switchMap, take, withLatestFrom} from 'rxjs/operators';
import {DefaultViewConfig, View, ViewConfig} from '../../core/store/views/view';
import {selectCollectionsByQuery, selectLinkTypesInQuery} from '../../core/store/common/permissions.selectors';
import {preferViewConfigUpdate} from '../../core/store/views/view.utils';
import {DEFAULT_PERSPECTIVE_ID} from './perspective';

@Injectable()
export abstract class ViewConfigPerspectiveComponent<T> implements OnInit, OnDestroy {
  public config$: Observable<T>;

  public perspectiveId$ = new BehaviorSubject(DEFAULT_PERSPECTIVE_ID);

  protected subscriptions = new Subscription();

  protected constructor(protected store$: Store<AppState>) {}

  protected abstract subscribeConfig$(perspectiveId: string): Observable<T>;

  protected abstract configChanged(perspectiveId: string, config: T);

  protected abstract getConfig(viewConfig: ViewConfig): T;

  protected selectViewQuery$(): Observable<Query> {
    return this.store$.pipe(select(selectViewQuery));
  }

  protected getDefaultConfig(): T {
    return null;
  }

  protected selectDefaultViewConfig$(): Observable<DefaultViewConfig> {
    return of(null);
  }

  protected checkConfigWithDefaultView(config: T, defaultConfig?: DefaultViewConfig): Observable<T> {
    return of(config);
  }

  protected abstract checkOrTransformConfig(
    config: T,
    query: Query,
    collections: Collection[],
    linkTypes: LinkType[]
  ): T;

  public ngOnInit() {
    this.initPerspective();

    this.config$ = this.perspectiveId$
      .asObservable()
      .pipe(switchMap(perspectiveId => this.subscribeConfig$(perspectiveId)));
  }

  private initPerspective() {
    const subscription = this.store$
      .pipe(
        select(selectCurrentView),
        startWith(null as View),
        pairwise(),
        switchMap(([previousView, view]) =>
          view ? this.subscribeToView(previousView, view) : this.subscribeToDefault()
        )
      )
      .subscribe(({perspectiveId, config}: {perspectiveId?: string; config?: T}) => {
        if (perspectiveId) {
          this.perspectiveId$.next(perspectiveId);
          this.configChanged(perspectiveId, config);
        }
      });
    this.subscriptions.add(subscription);
  }

  private subscribeToView(previousView: View, view: View): Observable<{perspectiveId?: string; config?: T}> {
    const perspectiveId = view.code;
    return this.subscribeConfig$(perspectiveId).pipe(
      take(1),
      mergeMap(entityConfig => {
        const perspectiveConfig = this.getConfig(view.config);
        if (
          preferViewConfigUpdate(this.getConfig(previousView?.config), this.getConfig(view?.config), !!entityConfig)
        ) {
          return this.checkPerspectiveConfig(perspectiveConfig).pipe(
            mergeMap(checkedConfig => this.checkConfigWithDefaultView(checkedConfig)),
            map(config => ({perspectiveId, config}))
          );
        }
        return of({perspectiveId, config: entityConfig || perspectiveConfig || this.getDefaultConfig()});
      })
    );
  }

  private checkPerspectiveConfig(config: T): Observable<T> {
    return combineLatest([
      this.selectViewQuery$(),
      this.store$.pipe(select(selectCollectionsByQuery)),
      this.store$.pipe(select(selectLinkTypesInQuery)),
    ]).pipe(
      take(1),
      map(([query, collections, linkTypes]) => this.checkOrTransformConfig(config, query, collections, linkTypes))
    );
  }

  private subscribeToDefault(): Observable<{perspectiveId?: string; config?: T}> {
    const perspectiveId = DEFAULT_PERSPECTIVE_ID;
    return this.selectViewQuery$().pipe(
      switchMap(() =>
        this.selectDefaultViewConfig$().pipe(
          withLatestFrom(this.subscribeConfig$(perspectiveId)),
          mergeMap(([defaultView, config]) =>
            this.checkPerspectiveConfig(config).pipe(
              mergeMap(checkedConfig => this.checkConfigWithDefaultView(checkedConfig, defaultView))
            )
          ),
          map(config => ({perspectiveId, config}))
        )
      )
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
