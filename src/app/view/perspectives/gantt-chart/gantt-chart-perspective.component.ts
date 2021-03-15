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

import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {Collection} from '../../../core/store/collections/collection';
import {selectDocumentsAndLinksByQuerySorted} from '../../../core/store/common/permissions.selectors';
import {DocumentMetaData, DocumentModel} from '../../../core/store/documents/document.model';
import {Query} from '../../../core/store/navigation/query/query';
import {distinctUntilChanged, map} from 'rxjs/operators';
import {ViewConfig} from '../../../core/store/views/view';
import {AppState} from '../../../core/store/app.state';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {GanttChartConfig} from '../../../core/store/gantt-charts/gantt-chart';
import {selectGanttChartById} from '../../../core/store/gantt-charts/gantt-charts.state';
import {GanttChartAction} from '../../../core/store/gantt-charts/gantt-charts.action';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {LinkType} from '../../../core/store/link-types/link.type';
import {checkOrTransformGanttConfig} from './util/gantt-chart-util';
import {selectViewSettings} from '../../../core/store/view-settings/view-settings.state';
import {viewAttributeSettingsSortDefined} from '../../../shared/settings/settings.util';
import {selectCollectionsPermissions} from '../../../core/store/user-permissions/user-permissions.state';
import {DataPerspectiveComponent} from '../data-perspective.component';

@Component({
  selector: 'gantt-chart-perspective',
  templateUrl: './gantt-chart-perspective.component.html',
  styleUrls: ['./gantt-chart-perspective.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GanttChartPerspectiveComponent
  extends DataPerspectiveComponent<GanttChartConfig>
  implements OnInit, OnDestroy {
  public permissions$: Observable<Record<string, AllowedPermissions>>;
  public sortDefined$: Observable<boolean>;

  constructor(protected store$: Store<AppState>) {
    super(store$);
  }

  public ngOnInit() {
    super.ngOnInit();
    this.subscribeAdditionalData();
  }

  public checkOrTransformConfig(
    config: GanttChartConfig,
    query: Query,
    collections: Collection[],
    linkTypes: LinkType[]
  ): GanttChartConfig {
    return checkOrTransformGanttConfig(config, query, collections, linkTypes);
  }

  public configChanged(perspectiveId: string, config: GanttChartConfig) {
    this.store$.dispatch(new GanttChartAction.AddGanttChart({ganttChart: {id: perspectiveId, config}}));
  }

  public subscribeDocumentsAndLinks$(): Observable<{documents: DocumentModel[]; linkInstances: LinkInstance[]}> {
    return this.store$.pipe(select(selectDocumentsAndLinksByQuerySorted));
  }

  public subscribeConfig$(perspectiveId: string): Observable<GanttChartConfig> {
    return this.store$.pipe(
      select(selectGanttChartById(perspectiveId)),
      map(entity => entity?.config)
    );
  }

  public getConfig(viewConfig: ViewConfig): GanttChartConfig {
    return viewConfig?.ganttChart;
  }

  private subscribeAdditionalData() {
    this.permissions$ = this.store$.pipe(select(selectCollectionsPermissions));
    this.sortDefined$ = this.store$.pipe(
      select(selectViewSettings),
      map(settings => viewAttributeSettingsSortDefined(settings)),
      distinctUntilChanged()
    );
  }

  public onConfigChanged(config: GanttChartConfig) {
    this.store$.dispatch(new GanttChartAction.SetConfig({ganttChartId: this.perspectiveId$.value, config}));
  }

  public patchDocumentData(document: DocumentModel) {
    this.store$.dispatch(new DocumentsAction.PatchData({document}));
  }

  public patchDocumentMetaData(payload: {collectionId: string; documentId: string; metaData: DocumentMetaData}) {
    this.store$.dispatch(new DocumentsAction.PatchMetaData(payload));
  }

  public patchLinkInstanceData(linkInstance: LinkInstance) {
    this.store$.dispatch(new LinkInstancesAction.PatchData({linkInstance}));
  }

  public updateLinkDocuments(payload: {linkInstanceId: string; documentIds: [string, string]}) {
    this.store$.dispatch(new LinkInstancesAction.ChangeDocuments(payload));
  }

  public createDocumentsChain(data: {documents: DocumentModel[]; linkInstances: LinkInstance[]}) {
    const failureMessage = $localize`:@@perspective.gantt.create.task.failure:Could not create task`;
    this.store$.dispatch(new DocumentsAction.CreateChain({...data, failureMessage}));
  }
}
