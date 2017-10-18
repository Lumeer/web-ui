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
      .subscribe(
        events => this.events = events,
        error => this.notificationService.error('Error', 'Failed fetching Events')
      );
  }

}
