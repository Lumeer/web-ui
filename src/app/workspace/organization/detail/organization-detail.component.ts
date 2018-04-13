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
import {ContactModel} from "../../../core/store/organizations/contact/contact.model";
import {ContactFormComponent} from "./contact-form/contact-form/contact-form.component";
import {Store} from "@ngrx/store";
import {Router} from "@angular/router";
import {NotificationService} from "../../../core/notifications/notification.service";
import {I18n} from "@ngx-translate/i18n-polyfill";
import {AppState} from "../../../core/store/app.state";
import {Subscription} from "rxjs/Subscription";
import {selectContactByCode} from "../../../core/store/organizations/contact/contacts.state";
import {OrganizationSettingsComponent} from "../organization-settings.component";
import {ContactsAction} from "../../../core/store/organizations/contact/contacts.action";

@Component({
  templateUrl: './organization-detail.component.html'
})
export class OrganizationDetailComponent implements OnInit, OnDestroy {

  @ViewChild('contactForm')
  private contactForm: ContactFormComponent;

  private contactSubscription: Subscription;

  constructor(private i18n: I18n,
              private router: Router,
              private store: Store<AppState>,
              private notificationService: NotificationService,
              private organizationSettingsComponent: OrganizationSettingsComponent) {
  }

  updateContact($event: ContactModel) {
    this.store.dispatch(new ContactsAction.SetContact({ organizationId: $event.code, contact: $event }));
  }

  ngOnInit(): void {
    this.subscribeToStore();
    this.requestData();
  }

  private subscribeToStore() {
    this.contactSubscription = this.store.select(selectContactByCode(this.organizationSettingsComponent.organization.code))
      .subscribe(contact => this.contactForm.setContact(contact));
  }

  ngOnDestroy(): void {
    if (this.contactSubscription) {
      this.contactSubscription.unsubscribe();
    }
  }

  private requestData() {
    this.store.dispatch(new ContactsAction.GetContact({ organizationId: this.organizationSettingsComponent.organization.code }));
  }
}
