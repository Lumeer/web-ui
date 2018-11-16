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

import {Store} from '@ngrx/store';
import {AppState} from '../store/app.state';
import {Injectable, OnDestroy} from '@angular/core';
import {environment} from '../../../environments/environment';
import Pusher from 'pusher-js';

@Injectable({
  providedIn: 'root',
})
export class PusherService implements OnDestroy {
  private readonly pusher: any;
  private readonly channel: any;

  constructor(private store: Store<AppState>) {
    console.log('subscribing to pusher');

    Pusher.logToConsole = true;
    this.pusher = new Pusher(environment.pusherKey, {
      cluster: environment.pusherCluster,
    });

    this.channel = this.pusher.subscribe('my-channel');
    this.channel.bind('my-event', function(data) {
      console.log(JSON.stringify(data));
    });
  }

  public ngOnDestroy() {
    if (this.channel) {
      this.channel.unbind_all();
      this.channel.unsubscribe();
    }
  }
}
