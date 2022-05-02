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

import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, ViewChild} from '@angular/core';
import {NgForm} from '@angular/forms';
import {Contact} from '../../../../core/store/organizations/contact/contact';
import {CountriesData} from '../../../../core/store/organizations/contact/countries.data';
import {ContactsAction} from '../../../../core/store/organizations/contact/contacts.action';
import {Organization} from '../../../../core/store/organizations/organization';
import {AppState} from '../../../../core/store/app.state';
import {BehaviorSubject} from 'rxjs';
import {Store} from '@ngrx/store';

@Component({
  selector: 'contact-form',
  templateUrl: './contact-form.component.html',
  styleUrls: ['./contact-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactFormComponent implements OnChanges {
  @Input()
  public contact: Contact;

  @Input()
  public organization: Organization;

  @ViewChild('invoicingContactForm', {static: true})
  private invoicingContact: NgForm;

  public readonly countries = CountriesData.getCountryNames();

  public savingState$ = new BehaviorSubject(false); // are we performing the save operation?

  constructor(private store$: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.contact && this.contact) {
      this.invoicingContact.form.patchValue(this.contact);
    }
  }

  public save() {
    const contact = {...this.invoicingContact.form.value, code: this.organization.code};
    this.invoicingContact.form.markAsPristine();
    this.savingState$.next(true);

    this.store$.dispatch(
      new ContactsAction.SetContact({
        organizationId: this.organization.id,
        contact,
        onSuccess: () => {
          this.savingState$.next(false);
        },
        onFailure: () => {
          this.savingState$.next(false);
          this.invoicingContact.form.markAsDirty();
        },
      })
    );
  }
}
