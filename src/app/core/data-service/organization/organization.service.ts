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

import {Observable} from 'rxjs';
import {ContactDto, OrganizationDto} from '../../dto';
import {PermissionService} from '../common/permission.service';
import {ServiceLimitsDto} from '../../dto/service-limits.dto';
import {PaymentDto} from '../../dto/payment.dto';

export abstract class OrganizationService extends PermissionService {
  public abstract getOrganizations(): Observable<OrganizationDto[]>;

  public abstract getOrganizationsCodes(): Observable<string[]>;

  public abstract getOrganization(id: string): Observable<OrganizationDto>;

  public abstract getOrganizationByCode(code: string): Observable<OrganizationDto>;

  public abstract deleteOrganization(id: string): Observable<any>;

  public abstract createOrganization(organization: OrganizationDto): Observable<OrganizationDto>;

  public abstract updateOrganization(id: string, organization: OrganizationDto): Observable<OrganizationDto>;

  public abstract getOrganizationContact(id: string): Observable<ContactDto>;

  public abstract setOrganizationContact(id: string, contact: ContactDto): Observable<ContactDto>;

  public abstract getAllServiceLimits(): Observable<{[organizationId: string]: ServiceLimitsDto}>;

  public abstract getServiceLimits(id: string): Observable<ServiceLimitsDto>;

  public abstract getPayments(): Observable<PaymentDto[]>;

  public abstract getPayment(paymentId: string): Observable<PaymentDto>;

  public abstract createPayment(payment: PaymentDto, returnUrl: string): Observable<PaymentDto>;
}
