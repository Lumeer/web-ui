import {Component, EventEmitter, OnInit, Output, ViewChild} from '@angular/core';
import {ContactModel} from "../../../../../core/store/organizations/contact/contact.model";
import {NgForm} from "@angular/forms";
import {OrganizationSettingsComponent} from "../../../organization-settings.component";
import {CountriesData} from "../../../../../core/store/organizations/contact/countries.data";

@Component({
  selector: 'contact-form',
  templateUrl: './contact-form.component.html',
  styleUrls: ['./contact-form.component.scss']
})
export class ContactFormComponent implements OnInit {

  @ViewChild('invoicingContactForm')
  private invoicingContact: NgForm;

  private contact: ContactModel;

  private countries = CountriesData.getCountryNames();

  @Output()
  public updateContact = new EventEmitter<ContactModel>();

  constructor(private organizationSettingsComponent: OrganizationSettingsComponent) { }

  ngOnInit() {
  }

  public setContact(contact: ContactModel) {
    if (contact) {
      this.contact = contact;
      this.invoicingContact.form.patchValue(contact);
    }
  }

  public save() {
    this.contact = { ...this.invoicingContact.form.value, code: this.organizationSettingsComponent.organization.code };
    this.updateContact.emit(this.contact);
    this.invoicingContact.form.markAsPristine();
  }

}
