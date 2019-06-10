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

import {HttpResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ContactDto, OrganizationDto} from '../dto';
import {PermissionService} from './permission.service';
import {ServiceLimitsDto} from '../dto/service-limits.dto';
import {PaymentDto} from '../dto/payment.dto';
import {Workspace} from '../store/navigation/workspace';

@Injectable()
export class OrganizationService extends PermissionService {
  public getOrganizations(): Observable<OrganizationDto[]> {
    return this.httpClient.get<OrganizationDto[]>(this.apiPrefix());
  }

  public getOrganizationsCodes(): Observable<string[]> {
    return this.httpClient.get<string[]>(`${this.apiPrefix()}/info/codes`).pipe();
  }

  public getOrganization(id: string): Observable<OrganizationDto> {
    return this.httpClient.get<OrganizationDto>(this.apiPrefix(id));
  }

  public getOrganizationByCode(code: string): Observable<OrganizationDto> {
    return this.httpClient.get<OrganizationDto>(`${this.apiPrefix()}/code/${code}`);
  }

  public deleteOrganization(id: string): Observable<HttpResponse<any>> {
    return this.httpClient.delete(this.apiPrefix(id), {observe: 'response', responseType: 'text'});
  }

  public createOrganization(organization: OrganizationDto): Observable<OrganizationDto> {
    return this.httpClient.post<OrganizationDto>(this.apiPrefix(), organization);
  }

  public updateOrganization(id: string, organization: OrganizationDto): Observable<OrganizationDto> {
    return this.httpClient.put<OrganizationDto>(this.apiPrefix(id), organization);
  }

  public getOrganizationContact(id: string): Observable<ContactDto> {
    return this.httpClient.get<ContactDto>(`${this.apiPrefix(id)}/contact`);
  }

  public setOrganizationContact(id: string, contact: ContactDto): Observable<ContactDto> {
    return this.httpClient.put<ContactDto>(`${this.apiPrefix(id)}/contact`, contact);
  }

  public getServiceLimits(id: string): Observable<ServiceLimitsDto> {
    return this.httpClient.get<ServiceLimitsDto>(`${this.apiPrefix(id)}/serviceLimit`);
  }

  public getAllServiceLimits(): Observable<{[organizationId: string]: ServiceLimitsDto}> {
    return this.httpClient.get<{[organizationId: string]: ServiceLimitsDto}>(`${this.apiPrefix()}/info/serviceLimits`);
  }

  public getPayments(): Observable<PaymentDto[]> {
    return this.httpClient.get<PaymentDto[]>(`${this.actualApiPrefix()}/payments`);
  }

  public getPayment(paymentId: string): Observable<PaymentDto> {
    return this.httpClient.get<PaymentDto>(`${this.actualApiPrefix()}/payment/${paymentId}`);
  }

  public createPayment(payment: PaymentDto, returnUrl: string): Observable<PaymentDto> {
    return this.httpClient.post<PaymentDto>(`${this.actualApiPrefix()}/payments`, payment, {
      headers: {
        RETURN_URL: returnUrl,
      },
    });
  }

  protected actualApiPrefix(workspace?: Workspace): string {
    return this.apiPrefix(this.getOrCurrentOrganizationId(workspace));
  }

  private apiPrefix(id?: string): string {
    return `${environment.apiUrl}/rest/organizations${id ? `/${id}` : ''}`;
  }
}
