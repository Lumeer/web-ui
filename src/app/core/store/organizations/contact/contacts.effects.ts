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

import {of} from 'rxjs';
import {Injectable} from '@angular/core';
import {catchError, map, mergeMap, tap} from 'rxjs/operators';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Store} from '@ngrx/store';
import {Router} from '@angular/router';
import {ContactConverter} from './contact.converter';
import {AppState} from '../../app.state';
import {NotificationsAction} from '../../notifications/notifications.action';
import {ContactsAction, ContactsActionType} from './contacts.action';
import {OrganizationService} from '../../../data-service';

@Injectable()
export class ContactsEffects {
  public getContact$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ContactsAction.GetContact>(ContactsActionType.GET_CONTACT),
      mergeMap(action =>
        this.organizationService.getOrganizationContact(action.payload.organizationId).pipe(
          map(contact => new ContactsAction.GetContactSuccess({contact: ContactConverter.fromDto(contact)})),
          catchError(error => of(new ContactsAction.GetContactFailure({error})))
        )
      )
    )
  );

  public getContactFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ContactsAction.GetContactFailure>(ContactsActionType.GET_CONTACT_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@organization.contact.get.fail:Could not read contact information`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public setContact$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ContactsAction.SetContact>(ContactsActionType.SET_CONTACT),
      mergeMap(action =>
        this.organizationService
          .setOrganizationContact(action.payload.organizationId, ContactConverter.toDto(action.payload.contact))
          .pipe(
            map(contact => new ContactsAction.SetContactSuccess({contact: ContactConverter.fromDto(contact)})),
            catchError(error => of(new ContactsAction.SetContactFailure({error})))
          )
      )
    )
  );

  public setContactFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ContactsAction.GetContactFailure>(ContactsActionType.SET_CONTACT_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@organization.contact.set.fail:Could not save contact information`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  constructor(
    private store$: Store<AppState>,
    private router: Router,
    private actions$: Actions,
    private organizationService: OrganizationService
  ) {}
}
