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

import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {Contact} from '../../../core/store/organizations/contact/contact';
import {select, Store} from '@ngrx/store';
import {Router} from '@angular/router';
import {AppState} from '../../../core/store/app.state';
import {Observable} from 'rxjs';
import {ContactsAction} from '../../../core/store/organizations/contact/contacts.action';
import {Organization} from '../../../core/store/organizations/organization';
import {selectOrganizationByWorkspace} from '../../../core/store/organizations/organizations.state';
import {take, tap} from 'rxjs/operators';
import {selectContactByWorkspace} from '../../../core/store/organizations/contact/contacts.state';
import {selectWorkspaceWithIds} from '../../../core/store/common/common.selectors';
import {ServiceLimits} from '../../../core/store/organizations/service-limits/service.limits';
import {selectServiceLimitsByWorkspace} from '../../../core/store/organizations/service-limits/service-limits.state';
import {Payment} from '../../../core/store/organizations/payment/payment';
import {selectLastCreatedPayment} from '../../../core/store/organizations/payment/payments.state';
import {PaymentsAction} from '../../../core/store/organizations/payment/payments.action';

@Component({
  templateUrl: './organization-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationDetailComponent implements OnInit {
  public contact$: Observable<Contact>;
  public organization$: Observable<Organization>;
  public serviceLimits$: Observable<ServiceLimits>;
  public lastPayment$: Observable<Payment>;

  private organization: Organization;

  constructor(private router: Router, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.subscribeToStore();
    this.requestData();
  }

  private subscribeToStore() {
    this.organization$ = this.store$.pipe(
      select(selectOrganizationByWorkspace),
      tap(organization => (this.organization = organization))
    );

    this.serviceLimits$ = this.store$.pipe(select(selectServiceLimitsByWorkspace));

    this.contact$ = this.store$.pipe(select(selectContactByWorkspace));

    this.lastPayment$ = this.store$.pipe(select(selectLastCreatedPayment));
  }

  private requestData() {
    this.store$.pipe(select(selectWorkspaceWithIds), take(1)).subscribe(workspace => {
      this.store$.dispatch(new ContactsAction.GetContact({organizationId: workspace.organizationId}));
      this.store$.dispatch(new PaymentsAction.GetPayments({organizationId: workspace.organizationId}));
    });
  }
}
