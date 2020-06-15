/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General abstract License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General abstract License for more details.
 *
 * You should have received a copy of the GNU General abstract License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {Observable} from 'rxjs';
import {ContactDto, OrganizationDto} from '../../dto';
import {PermissionService} from '../common/permission.service';
import {ServiceLimitsDto} from '../../dto/service-limits.dto';
import {PaymentDto} from '../../dto/payment.dto';

export abstract class OrganizationService extends PermissionService {
  abstract getOrganizations(): Observable<OrganizationDto[]>;

  abstract getOrganizationsCodes(): Observable<string[]>;

  abstract getOrganization(id: string): Observable<OrganizationDto>;

  abstract getOrganizationByCode(code: string): Observable<OrganizationDto>;

  abstract deleteOrganization(id: string): Observable<any>;

  abstract createOrganization(organization: OrganizationDto): Observable<OrganizationDto>;

  abstract updateOrganization(id: string, organization: OrganizationDto): Observable<OrganizationDto>;

  abstract getOrganizationContact(id: string): Observable<ContactDto>;

  abstract setOrganizationContact(id: string, contact: ContactDto): Observable<ContactDto>;

  abstract getAllServiceLimits(): Observable<{ [organizationId: string]: ServiceLimitsDto }>;

  abstract getServiceLimits(id: string): Observable<ServiceLimitsDto>;

  abstract getPayments(): Observable<PaymentDto[]>;

  abstract getPayment(paymentId: string): Observable<PaymentDto>;

  abstract createPayment(payment: PaymentDto, returnUrl: string): Observable<PaymentDto>;
}
