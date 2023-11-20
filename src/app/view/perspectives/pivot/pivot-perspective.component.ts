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

import {Store, select} from '@ngrx/store';

import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {LoadDataService, LoadDataServiceProvider} from '../../../core/service/load-data.service';
import {AppState} from '../../../core/store/app.state';
import {Collection} from '../../../core/store/collections/collection';
import {LinkType} from '../../../core/store/link-types/link.type';
import {Query} from '../../../core/store/navigation/query/query';
import {PivotConfig} from '../../../core/store/pivots/pivot';
import {PivotsAction} from '../../../core/store/pivots/pivots.action';
import {selectPivotById} from '../../../core/store/pivots/pivots.state';
import {ViewConfig} from '../../../core/store/views/view';
import {DataPerspectiveDirective} from '../data-perspective.directive';
import {PivotPerspectiveConfiguration, defaultPivotPerspectiveConfiguration} from '../perspective-configuration';
import {checkOrTransformPivotConfig, createDefaultPivotConfig} from './util/pivot-util';

@Component({
  selector: 'pivot-perspective',
  templateUrl: './pivot-perspective.component.html',
  styleUrls: ['./pivot-perspective.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [LoadDataServiceProvider],
})
export class PivotPerspectiveComponent extends DataPerspectiveDirective<PivotConfig> implements OnInit, OnDestroy {
  @Input()
  public perspectiveConfiguration: PivotPerspectiveConfiguration = defaultPivotPerspectiveConfiguration;

  constructor(
    protected store$: Store<AppState>,
    protected loadService: LoadDataService
  ) {
    super(store$, loadService);
  }

  public checkOrTransformConfig(
    config: PivotConfig,
    query: Query,
    collections: Collection[],
    linkTypes: LinkType[]
  ): PivotConfig {
    return checkOrTransformPivotConfig(config, query, collections, linkTypes);
  }

  public subscribeConfig$(perspectiveId: string): Observable<PivotConfig> {
    return this.store$.pipe(
      select(selectPivotById(perspectiveId)),
      map(entity => entity?.config)
    );
  }

  public configChanged(perspectiveId: string, config: PivotConfig) {
    this.store$.dispatch(new PivotsAction.AddPivot({pivot: {id: perspectiveId, config}}));
  }

  public onConfigChange(config: PivotConfig) {
    this.store$.dispatch(new PivotsAction.SetConfig({pivotId: this.perspectiveId$.value, config}));
  }

  public getConfig(viewConfig: ViewConfig): PivotConfig {
    return viewConfig?.pivot;
  }

  protected getDefaultConfig(query: Query): PivotConfig {
    return createDefaultPivotConfig(query);
  }

  public ngOnDestroy() {
    super.ngOnDestroy();

    this.loadService.destroy();
  }
}
