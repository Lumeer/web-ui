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

import {select, Store} from '@ngrx/store';
import {AppState} from '../store/app.state';
import {Injectable, OnDestroy, OnInit} from '@angular/core';
import {environment} from '../../../environments/environment';
import Pusher from 'pusher-js';
import {selectCurrentUser} from '../store/users/users.state';
import {UserModel} from '../store/users/user.model';
import {Subscription} from 'rxjs/index';
import {filter, take} from 'rxjs/internal/operators';
import {AuthService} from '../../auth/auth.service';
import {OrganizationsAction} from '../store/organizations/organizations.action';
import {OrganizationConverter} from '../store/organizations/organization.converter';
import {DocumentsAction} from '../store/documents/documents.action';
import {convertDocumentDtoToModel} from '../store/documents/document.converter';

@Injectable({
  providedIn: 'root',
})
export class PusherService implements OnDestroy {
  private pusher: any;
  private channel: any;
  private subscriptions = new Subscription();

  constructor(private store: Store<AppState>, private authService: AuthService) {
    console.log('service is used');
    if (environment.pusherKey) {
      this.init();
    }
  }

  public init(): void {
    this.subscriptions.add(
      this.store
        .pipe(
          select(selectCurrentUser),
          filter(user => !!user),
          take(1)
        )
        .subscribe(user => {
          this.subscribePusher(user);
        })
    );
  }

  private subscribePusher(user: UserModel): void {
    const thisRef = this;
    console.log('subscribing to pusher');

    Pusher.logToConsole = true;
    this.pusher = new Pusher(environment.pusherKey, {
      cluster: environment.pusherCluster,
      authEndpoint: `${environment.apiUrl}/rest/pusher`,
      auth: {
        headers: {
          Authorization: `Bearer ${this.authService.getAccessToken()}`,
        },
      },
    });

    this.channel = this.pusher.subscribe('private-' + user.id);
    this.channel.bind('my-event', function(data) {
      console.log(JSON.stringify(data));
    });
    this.channel.bind('Organization:update', function(data) {
      thisRef.store.dispatch(
        new OrganizationsAction.UpdateSuccess({organization: OrganizationConverter.fromDto(data)})
      );
    });
    this.channel.bind('Document:update', function(data) {
      thisRef.store.dispatch(new DocumentsAction.UpdateSuccess({document: convertDocumentDtoToModel(data)}));
    });
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.channel) {
      this.channel.unbind_all();
      this.channel.unsubscribe();
    }
  }
}
