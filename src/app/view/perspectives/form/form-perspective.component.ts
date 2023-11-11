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

import {ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {DataPerspectiveDirective} from '../data-perspective.directive';
import {FormConfig} from '../../../core/store/form/form-model';
import {Query} from '../../../core/store/navigation/query/query';
import {Collection} from '../../../core/store/collections/collection';
import {LinkType} from '../../../core/store/link-types/link.type';
import {ViewConfig} from '../../../core/store/views/view';
import {combineLatest, Observable, switchMap} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {map} from 'rxjs/operators';
import {selectFormById} from '../../../core/store/form/form.state';
import * as FormsActions from '../../../core/store/form/form.actions';
import {AppState} from '../../../core/store/app.state';
import {getBaseCollectionIdFromQuery} from '../../../core/store/navigation/query/query.util';
import {selectCollectionById} from '../../../core/store/collections/collections.state';
import {selectLinkTypesByViewAndCollectionIdWithCollections} from '../../../core/store/common/permissions.selectors';
import {checkOrTransformFormConfig} from './form-utils';
import {defaultFormPerspectiveConfiguration, FormPerspectiveConfiguration} from '../perspective-configuration';
import {LoadDataService, LoadDataServiceProvider} from '../../../core/service/load-data.service';

@Component({
  selector: 'form-perspective',
  templateUrl: './form-perspective.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'd-block h-100'},
  providers: [LoadDataServiceProvider],
})
export class FormPerspectiveComponent extends DataPerspectiveDirective<FormConfig> implements OnInit, OnDestroy {
  @Input()
  public perspectiveConfiguration: FormPerspectiveConfiguration = defaultFormPerspectiveConfiguration;

  public basicCollection$: Observable<Collection>;
  public collectionLinkTypes$: Observable<LinkType[]>;

  constructor(
    protected store$: Store<AppState>,
    protected loadService: LoadDataService
  ) {
    super(store$, loadService);
  }

  public ngOnInit() {
    super.ngOnInit();

    const basicCollectionId$ = this.query$.pipe(map(query => getBaseCollectionIdFromQuery(query)));

    this.basicCollection$ = basicCollectionId$.pipe(
      switchMap(collectionId => this.store$.pipe(select(selectCollectionById(collectionId))))
    );

    this.collectionLinkTypes$ = combineLatest([basicCollectionId$, this.currentView$]).pipe(
      switchMap(([collectionId, view]) =>
        this.store$.pipe(select(selectLinkTypesByViewAndCollectionIdWithCollections(view, collectionId)))
      )
    );
  }

  protected checkOrTransformConfig(
    config: FormConfig,
    query: Query,
    collections: Collection[],
    linkTypes: LinkType[]
  ): FormConfig {
    return checkOrTransformFormConfig(config, query, collections, linkTypes);
  }

  protected configChanged(perspectiveId: string, config: FormConfig) {
    this.store$.dispatch(FormsActions.add({model: {id: perspectiveId, config}}));
  }

  protected getConfig(viewConfig: ViewConfig): FormConfig {
    return viewConfig?.form;
  }

  protected subscribeConfig$(perspectiveId: string): Observable<FormConfig> {
    return this.store$.pipe(
      select(selectFormById(perspectiveId)),
      map(entity => entity?.config)
    );
  }

  public onConfigChanged(config: FormConfig) {
    this.store$.dispatch(FormsActions.setConfig({id: this.perspectiveId$.value, config}));
  }

  public ngOnDestroy() {
    super.ngOnDestroy();
    this.loadService.destroy();
  }
}
