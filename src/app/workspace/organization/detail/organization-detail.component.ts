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

import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ContactModel} from '../../../core/store/organizations/contact/contact.model';
import {ContactFormComponent} from './contact-form/contact-form.component';
import {Store} from '@ngrx/store';
import {Router} from '@angular/router';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {AppState} from '../../../core/store/app.state';
import {Subscription} from 'rxjs';
import {ContactsAction} from '../../../core/store/organizations/contact/contacts.action';
import {OrganizationModel} from '../../../core/store/organizations/organization.model';
import {selectOrganizationByWorkspace} from '../../../core/store/organizations/organizations.state';
import {isNullOrUndefined} from 'util';
import {filter} from 'rxjs/operators';
import {
  selectContactByOrganizationId,
  selectContactByWorkspace,
} from '../../../core/store/organizations/contact/contacts.state';

@Component({
  templateUrl: './organization-detail.component.html',
})
export class OrganizationDetailComponent implements OnInit, OnDestroy {
  @ViewChild('contactForm')
  private contactForm: ContactFormComponent;

  private contactSubscription: Subscription;

  private organization: OrganizationModel;
  private organizationSubscription: Subscription;

  constructor(private i18n: I18n, private router: Router, private store: Store<AppState>) {}

  public updateContact($event: ContactModel) {
    this.store.dispatch(new ContactsAction.SetContact({organizationCode: this.organization.code, contact: $event}));
  }

  public ngOnInit(): void {
    this.subscribeToStore();
    this.requestData();
  }

  private subscribeToStore() {
    this.organizationSubscription = this.store
      .select(selectOrganizationByWorkspace)
      .pipe(filter(organization => !isNullOrUndefined(organization)))
      .subscribe(organization => (this.organization = organization));

    this.contactSubscription = this.store
      .select(selectContactByWorkspace)
      .pipe(filter(contact => !isNullOrUndefined(contact)))
      .subscribe(contact => this.contactForm.setContact(contact));
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
    this.store.dispatch(new ContactsAction.GetContact({organizationCode: this.organization.code}));
  }
}
