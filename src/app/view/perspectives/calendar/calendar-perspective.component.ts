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
import {map, take} from 'rxjs/operators';

import {LoadDataService, LoadDataServiceProvider} from '../../../core/service/load-data.service';
import {AppState} from '../../../core/store/app.state';
import {CalendarConfig} from '../../../core/store/calendars/calendar';
import {CalendarsAction} from '../../../core/store/calendars/calendars.action';
import {selectCalendarById} from '../../../core/store/calendars/calendars.state';
import {Collection} from '../../../core/store/collections/collection';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {LinkType} from '../../../core/store/link-types/link.type';
import {Query} from '../../../core/store/navigation/query/query';
import {ViewConfig} from '../../../core/store/views/view';
import {DataPerspectiveDirective} from '../data-perspective.directive';
import {CalendarPerspectiveConfiguration, defaultCalendarPerspectiveConfiguration} from '../perspective-configuration';
import {checkOrTransformCalendarConfig} from './util/calendar-util';

@Component({
  selector: 'calendar-perspective',
  templateUrl: './calendar-perspective.component.html',
  styleUrls: ['./calendar-perspective.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [LoadDataServiceProvider],
})
export class CalendarPerspectiveComponent
  extends DataPerspectiveDirective<CalendarConfig>
  implements OnInit, OnDestroy
{
  @Input()
  public perspectiveConfiguration: CalendarPerspectiveConfiguration = defaultCalendarPerspectiveConfiguration;

  constructor(
    protected store$: Store<AppState>,
    protected loadService: LoadDataService
  ) {
    super(store$, loadService);
  }

  public checkOrTransformConfig(
    config: CalendarConfig,
    query: Query,
    collections: Collection[],
    linkTypes: LinkType[]
  ): CalendarConfig {
    return checkOrTransformCalendarConfig(config, query, collections, linkTypes);
  }

  public configChanged(perspectiveId: string, config: CalendarConfig) {
    this.store$.dispatch(new CalendarsAction.AddCalendar({calendar: {id: perspectiveId, config}}));
  }

  public getConfig(viewConfig: ViewConfig): CalendarConfig {
    return viewConfig?.calendar;
  }

  public subscribeConfig$(perspectiveId: string): Observable<CalendarConfig> {
    return this.store$.pipe(
      select(selectCalendarById(perspectiveId)),
      map(entity => entity?.config)
    );
  }

  public onConfigChanged(config: CalendarConfig) {
    this.store$.dispatch(new CalendarsAction.SetConfig({calendarId: this.perspectiveId$.value, config}));
  }

  public patchDocumentData(document: DocumentModel) {
    this.workspace$
      .pipe(take(1))
      .subscribe(workspace => this.store$.dispatch(new DocumentsAction.PatchData({document, workspace})));
  }

  public patchLinkInstanceData(linkInstance: LinkInstance) {
    this.workspace$
      .pipe(take(1))
      .subscribe(workspace => this.store$.dispatch(new LinkInstancesAction.PatchData({linkInstance, workspace})));
  }

  public ngOnDestroy() {
    super.ngOnDestroy();

    this.loadService.destroy();
  }
}
