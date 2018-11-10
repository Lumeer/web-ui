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

import {Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {NgForm} from '@angular/forms';
import {ContactModel} from '../../../../core/store/organizations/contact/contact.model';
import {CountriesData} from '../../../../core/store/organizations/contact/countries.data';
import {OrganizationSettingsComponent} from '../../organization-settings.component';
import {ActionsSubject} from '@ngrx/store';
import {Subscription} from 'rxjs';
import {ContactsActionType} from '../../../../core/store/organizations/contact/contacts.action';

@Component({
  selector: 'contact-form',
  templateUrl: './contact-form.component.html',
  styleUrls: ['./contact-form.component.scss'],
})
export class ContactFormComponent implements OnInit, OnDestroy {
  @ViewChild('invoicingContactForm')
  private invoicingContact: NgForm;

  private contact: ContactModel;

  public countries = CountriesData.getCountryNames();

  public savingState: boolean = false; // are we performing the save operation?

  @Output()
  public updateContact = new EventEmitter<ContactModel>();

  private contactSaveSuccessSubscription: Subscription;

  constructor(
    private organizationSettingsComponent: OrganizationSettingsComponent,
    private actionsSubject: ActionsSubject
  ) {}

  public ngOnInit() {
    this.contactSaveSuccessSubscription = this.actionsSubject.subscribe(data => {
      if (data.type === ContactsActionType.SET_CONTACT_SUCCESS) {
        this.savingState = false;
      } else if (data.type === ContactsActionType.SET_CONTACT_FAILURE) {
        this.savingState = false;
        this.invoicingContact.form.markAsDirty();
      }
    });
  }

  public ngOnDestroy() {
    if (this.contactSaveSuccessSubscription) {
      this.contactSaveSuccessSubscription.unsubscribe();
    }
  }

  public setContact(contact: ContactModel) {
    if (contact) {
      this.contact = contact;
      this.invoicingContact.form.patchValue(contact);
    }
  }

  public save() {
    this.contact = {...this.invoicingContact.form.value, code: this.organizationSettingsComponent.organization.code};
    this.updateContact.emit(this.contact);
    this.invoicingContact.form.markAsPristine();
    this.savingState = true;
  }
}
