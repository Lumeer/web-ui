/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
 */

import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {NotificationsService} from 'angular2-notifications/dist';

import {CollectionTabComponent} from '../collection-tab.component';
import {EventsService} from '../../../core/rest/events.service';
import {WorkspaceService} from '../../../core/workspace.service';
import {CollectionService} from '../../../core/rest/collection.service';
import {Event} from '../../../core/dto/Event';

@Component({
  selector: 'collection-events',
  templateUrl: './collection-events.component.html',
  styleUrls: ['./collection-events.component.scss']
})
export class CollectionEventsComponent extends CollectionTabComponent implements OnInit {

  public events: Event[];

  constructor(private eventsService: EventsService,
              collectionService: CollectionService,
              route: ActivatedRoute,
              notificationService: NotificationsService,
              workspaceService: WorkspaceService) {
    super(collectionService, route, notificationService, workspaceService);
  }

  public ngOnInit(): void {
    super.ngOnInit();
    this.getEvents();
  }

  public getEvents(): void {
    this.eventsService.getEvents(this.collection.code)
      .retry(3)
      .subscribe(
        events => this.events = events,
        error => this.notificationService.error('Error', 'Failed fetching Events')
      );
  }

}
