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

import {ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Observable, Subscription} from 'rxjs';
import {CollectionModel} from '../../../core/store/collections/collection.model';
import {selectCollectionsByQuery, selectDocumentsByQuery} from '../../../core/store/common/permissions.selectors';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {selectQuery} from '../../../core/store/navigation/navigation.state';
import {QueryModel} from '../../../core/store/navigation/query.model';
import {selectPerspectiveViewConfig} from '../../../core/store/views/views.state';
//import {MapModel} from "../../../core/store/maps/map.model";
//import {DEFAULT_MAP_ID, selectMapById} from "../../../core/store/maps/maps.state";
import {map} from 'rxjs/operators';

import * as frappeGantt from 'frappe-gantt';

@Component({
  selector: 'gantt-chart',
  templateUrl: './gantt-chart.component.html',
  styleUrls: ['./gantt-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GanttChartComponent implements OnInit {

  @Input()
  public query: QueryModel;

  public collections$: Observable<CollectionModel[]>;
  public documents$: Observable<DocumentModel[]>;
  public validQuery$: Observable<boolean>;

  //public calendar$: Observable<MapModel>;
  //private calendarId = DEFAULT_GANTT_ID;     //TODO

  constructor(private store$: Store<{}>) {
  }

  public ngOnInit() {
    this.bindValidQuery();
    this.collections$ = this.store$.pipe(select(selectCollectionsByQuery));
    this.documents$ = this.store$.pipe(select(selectDocumentsByQuery));
    //this.bindCalendar(this.calendarId);
    this.showGantt();
  }

  private bindValidQuery() {
    this.validQuery$ = this.store$.pipe(
      select(selectQuery),
      map(query => query && query.collectionIds && query.collectionIds.length > 0)
    );
  }

  private showGantt() {

    // console.log(this.collections$.)

    const tasks = [
      {
        start: '2018-10-01',
        end: '2018-10-08',
        name: 'Redesign website',
        id: 'Task 0',
        progress: 20
      },
      {
        start: '2018-10-03',
        end: '2018-10-06',
        name: 'Write new content',
        id: 'Task 1',
        progress: 5,
        dependencies: 'Task 0'
      },
      {
        start: '2018-10-04',
        end: '2018-10-08',
        name: 'Apply new styles',
        id: 'Task 2',
        progress: 10,
        dependencies: 'Task 1'
      },
      {
        start: '2018-10-08',
        end: '2018-10-09',
        name: 'Review',
        id: 'Task 3',
        progress: 5,
        dependencies: 'Task 2'
      },
      {
        start: '2018-10-08',
        end: '2018-10-10',
        name: 'Deploy',
        id: 'Task 4',
        progress: 0,
        dependencies: 'Task 2'
      },
      {
        start: '2018-10-11',
        end: '2018-10-11',
        name: 'Go Live!',
        id: 'Task 5',
        progress: 0,
        dependencies: 'Task 4',
        custom_class: 'bar-milestone'
      },
      {
        start: '2014-01-05',
        end: '2019-10-12',
        name: 'Long term task',
        id: 'Task 6',
        progress: 0
      }
    ];

    //const because of push (let and var are rejected)
    const gantt_chart = new frappeGantt.default('.gantt-target', tasks, {
      // console logs are forbidden for push
      /*on_click: function (task) {
        console.log(task);
      },
      on_date_change: function(task, start, end) {
        console.log(task, start, end);
      },
      on_progress_change: function(task, progress) {
        console.log(task, progress);
      },
      on_view_change: function(mode) {
        console.log(mode);
      },*/
      view_mode: 'Month',
      language: 'en'
    });
   // console.log(gantt_chart);



  }


  // public printCollection(collection: Observable<CollectionModel[]>){
  //   console.log(collection.)
  // }

}
