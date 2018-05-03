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
import {Store} from '@ngrx/store';

import {CollectionTabComponent} from '../collection-tab.component';
import {EventService} from '../../../../core/rest/event.service';
import {CollectionService} from '../../../../core/rest/collection.service';
import {Event} from '../../../../core/dto/Event';
import {NotificationService} from '../../../../core/notifications/notification.service';
import {EventModel} from './model/EventModel';
import {EventFireReason} from './model/event-fire-reason';
import {finalize} from 'rxjs/operators';
import {AppState} from '../../../../core/store/app.state';
@Component({
  selector: 'collection-events',
  templateUrl: './collection-events.component.html',
  styleUrls: ['./collection-events.component.scss']
})
export class CollectionEventsComponent extends CollectionTabComponent implements OnInit {

  public events: EventModel[];

  constructor(private eventService: EventService,
              collectionService: CollectionService,
              notificationService: NotificationService,
              store: Store<AppState>) {
    super(
      collectionService,
      notificationService,
      store
    );
  }

  public ngOnInit(): void {
    super.ngOnInit();
    this.getEvents();
  }

  public getEvents(): void {
    this.eventService.getEvents(this.collection.id).subscribe(
      events => this.events = events.map(event => new EventModel(event)),
      error => this.notificationService.error('Failed fetching Events')
    );
  }

  public addModel(): void {
    const newEvent = new EventModel();
    this.events.push(newEvent);
  }

  public createEvent(eventModel: EventModel): void {
    if (eventModel.initialized) {
      throw new Error(`Event model ${eventModel}, was already created`);
    }

    if (eventModel.initializing) {
      return;
    }

    eventModel.initializing = true;
    this.eventService.createEvent(this.collection.id, eventModel.data).pipe(
      finalize(() => eventModel.initializing = false)
    ).subscribe(
      id => {
        eventModel.data.id = id;
        eventModel.initialized = true;
      },
      error => {
        this.notificationService.error('Failed creating event');
      }
    );
  }

  public removeFireReasonFromEvent(event: Event, removedFireReason: EventFireReason): void {
    event.fireReasons = event.fireReasons.filter(fireReason => fireReason !== removedFireReason);
    // this.eventService.getEvents()
  }

}
