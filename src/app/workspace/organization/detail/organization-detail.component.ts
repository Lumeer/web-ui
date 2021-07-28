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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {Contact} from '../../../core/store/organizations/contact/contact';
import {select, Store} from '@ngrx/store';
import {Router} from '@angular/router';
import {AppState} from '../../../core/store/app.state';
import {Observable, Subscription} from 'rxjs';
import {ContactsAction} from '../../../core/store/organizations/contact/contacts.action';
import {Organization} from '../../../core/store/organizations/organization';
import {selectOrganizationByWorkspace} from '../../../core/store/organizations/organizations.state';
import {filter} from 'rxjs/operators';
import {selectContactByWorkspace} from '../../../core/store/organizations/contact/contacts.state';

@Component({
  templateUrl: './organization-detail.component.html',
})
export class OrganizationDetailComponent implements OnInit, OnDestroy {
  public contact$: Observable<Contact>;

  public organization: Organization;

  private contactSubscription: Subscription;
  private organizationSubscription: Subscription;

  constructor(private router: Router, private store$: Store<AppState>) {}

  public updateContact(contact: Contact) {
    this.store$.dispatch(new ContactsAction.SetContact({organizationId: this.organization.id, contact}));
  }

  public ngOnInit(): void {
    this.subscribeToStore();
    this.requestData();
  }

  private subscribeToStore() {
    this.organizationSubscription = this.store$
      .pipe(
        select(selectOrganizationByWorkspace),
        filter(organization => !!organization)
      )
      .subscribe(organization => (this.organization = organization));

    this.contact$ = this.store$.pipe(
      select(selectContactByWorkspace),
      filter(contact => !!contact)
    );
  }

  public ngOnDestroy(): void {
    if (this.contactSubscription) {
      this.contactSubscription.unsubscribe();
    }

    if (this.organizationSubscription) {
      this.organizationSubscription.unsubscribe();
    }
  }

  private requestData() {
    this.store$.dispatch(new ContactsAction.GetContact({organizationId: this.organization.id}));
  }
}
