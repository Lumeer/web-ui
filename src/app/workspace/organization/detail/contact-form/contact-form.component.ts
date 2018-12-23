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

import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {NgForm} from '@angular/forms';
import {Contact} from '../../../../core/store/organizations/contact/contact';
import {CountriesData} from '../../../../core/store/organizations/contact/countries.data';
import {ActionsSubject} from '@ngrx/store';
import {Subscription} from 'rxjs';
import {ContactsActionType} from '../../../../core/store/organizations/contact/contacts.action';
import {Organization} from '../../../../core/store/organizations/organization';

@Component({
  selector: 'contact-form',
  templateUrl: './contact-form.component.html',
  styleUrls: ['./contact-form.component.scss'],
})
export class ContactFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public contact: Contact;

  @Input()
  public organization: Organization;

  @ViewChild('invoicingContactForm')
  private invoicingContact: NgForm;

  public countries = CountriesData.getCountryNames();

  public savingState: boolean = false; // are we performing the save operation?

  @Output()
  public updateContact = new EventEmitter<Contact>();

  private contactSaveSuccessSubscription: Subscription;

  constructor(private actionsSubject: ActionsSubject) {}

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

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.contact && this.contact) {
      this.invoicingContact.form.patchValue(this.contact);
    }
  }

  public ngOnDestroy() {
    if (this.contactSaveSuccessSubscription) {
      this.contactSaveSuccessSubscription.unsubscribe();
    }
  }

  public save() {
    this.contact = {...this.invoicingContact.form.value, code: this.organization.code};
    this.updateContact.emit(this.contact);
    this.invoicingContact.form.markAsPristine();
    this.savingState = true;
  }
}
