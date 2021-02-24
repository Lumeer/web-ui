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

import {ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {selectDocumentsAndLinksByQuerySorted} from '../../../core/store/common/permissions.selectors';
import {distinctUntilChanged, map} from 'rxjs/operators';
import {ChartConfig} from '../../../core/store/charts/chart';
import {selectChartById} from '../../../core/store/charts/charts.state';
import {ViewConfig} from '../../../core/store/views/view';
import {ChartAction} from '../../../core/store/charts/charts.action';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {deepObjectsEquals} from '../../../shared/utils/common.utils';
import {ChartDataComponent} from './data/chart-data.component';
import {checkOrTransformChartConfig} from './visualizer/chart-util';
import {DataPerspectiveComponent} from '../data-perspective.component';
import {Collection} from '../../../core/store/collections/collection';
import {LinkType} from '../../../core/store/link-types/link.type';
import {Query} from '../../../core/store/navigation/query/query';

@Component({
  selector: 'chart-perspective',
  templateUrl: './chart-perspective.component.html',
  styleUrls: ['./chart-perspective.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartPerspectiveComponent extends DataPerspectiveComponent<ChartConfig> implements OnInit, OnDestroy {
  @ViewChild(ChartDataComponent)
  public chartDataComponent: ChartDataComponent;

  constructor(protected store$: Store<AppState>) {
    super(store$);
  }

  public subscribeConfig$(perspectiveId: string): Observable<ChartConfig> {
    return this.store$.pipe(
      select(selectChartById(perspectiveId)),
      map(entity => entity?.config)
    );
  }

  public configChanged(perspectiveId: string, config: ChartConfig) {
    this.store$.dispatch(new ChartAction.AddChart({chart: {id: perspectiveId, config}}));
  }

  public checkOrTransformConfig(
    config: ChartConfig,
    query: Query,
    collections: Collection[],
    linkTypes: LinkType[]
  ): ChartConfig {
    return checkOrTransformChartConfig(config, query, collections, linkTypes);
  }

  public getConfig(viewConfig: ViewConfig): ChartConfig {
    return viewConfig?.chart;
  }

  public subscribeDocumentsAndLinks$(): Observable<{documents: DocumentModel[]; linkInstances: LinkInstance[]}> {
    return this.store$.pipe(
      select(selectDocumentsAndLinksByQuerySorted),
      distinctUntilChanged((x, y) => deepObjectsEquals(x, y))
    );
  }

  public onConfigChanged(config: ChartConfig) {
    this.store$.dispatch(new ChartAction.SetConfig({chartId: this.perspectiveId$.value, config}));
  }

  public patchDocumentData(document: DocumentModel) {
    this.store$.dispatch(new DocumentsAction.PatchData({document}));
  }

  public patchLinkInstanceData(linkInstance: LinkInstance) {
    this.store$.dispatch(new LinkInstancesAction.PatchData({linkInstance}));
  }

  public onSidebarToggle() {
    super.onSidebarToggle();
    this.chartDataComponent?.resize();
  }
}
