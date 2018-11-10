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

import {HttpResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {Contact, Organization} from '../dto';
import {PermissionService} from './permission.service';
import {ServiceLimits} from '../dto/service-limits';
import {Payment} from '../dto/payment';
import {selectWorkspace} from '../store/navigation/navigation.state';
import {AppState} from '../store/app.state';
import {Workspace} from '../store/navigation/workspace.model';

@Injectable()
export class OrganizationService extends PermissionService {
  public getOrganizations(): Observable<Organization[]> {
    return this.httpClient.get<Organization[]>(this.apiPrefix());
  }

  public getOrganizationsCodes(): Observable<string[]> {
    return this.httpClient.get<string[]>(`${this.apiPrefix()}/info/codes`).pipe();
  }

  public getOrganization(code: string): Observable<Organization> {
    return this.httpClient.get<Organization>(this.apiPrefix(code));
  }

  public deleteOrganization(code: string): Observable<HttpResponse<any>> {
    return this.httpClient.delete(this.apiPrefix(code), {observe: 'response', responseType: 'text'});
  }

  public createOrganization(organization: Organization): Observable<Organization> {
    return this.httpClient.post<Organization>(this.apiPrefix(), organization);
  }

  public editOrganization(code: string, organization: Organization): Observable<Organization> {
    return this.httpClient.put<Organization>(this.apiPrefix(code), organization);
  }

  public getOrganizationContact(code: string): Observable<Contact> {
    return this.httpClient.get<Contact>(`${this.apiPrefix(code)}/contact`);
  }

  public setOrganizationContact(code: string, contact: Contact): Observable<Contact> {
    return this.httpClient.put<Contact>(`${this.apiPrefix(code)}/contact`, contact);
  }

  public getServiceLimits(code: string): Observable<ServiceLimits> {
    return this.httpClient.get<ServiceLimits>(`${this.apiPrefix(code)}/serviceLimit`);
  }

  public getAllServiceLimits(): Observable<{[organizationId: string]: ServiceLimits}> {
    return this.httpClient.get<{[organizationId: string]: ServiceLimits}>(`${this.apiPrefix()}/info/serviceLimits`);
  }

  public getPayments(): Observable<Payment[]> {
    return this.httpClient.get<Payment[]>(`${this.actualApiPrefix()}/payments`);
  }

  public getPayment(paymentId: string): Observable<Payment> {
    return this.httpClient.get<Payment>(`${this.actualApiPrefix()}/payment/${paymentId}`);
  }

  public createPayment(payment: Payment, returnUrl: string): Observable<Payment> {
    return this.httpClient.post<Payment>(`${this.actualApiPrefix()}/payments`, payment, {
      headers: {
        RETURN_URL: returnUrl,
      },
    });
  }

  protected actualApiPrefix(workspace?: Workspace): string {
    const actualWorkspace = workspace || this.workspace;
    const organizationCode = actualWorkspace.organizationCode;

    return this.apiPrefix(organizationCode);
  }

  private apiPrefix(code?: string): string {
    return `${environment.apiUrl}/rest/organizations${code ? `/${code}` : ''}`;
  }
}
