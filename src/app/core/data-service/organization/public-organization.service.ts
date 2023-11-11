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

import {Injectable} from '@angular/core';
import {mergeMap, Observable, of} from 'rxjs';
import {ContactDto, OrganizationDto, ProjectDto, TeamDto} from '../../dto';
import {PublicPermissionService} from '../common/public-permission.service';
import {map, take} from 'rxjs/operators';
import {ServiceLimitsDto} from '../../dto/service-limits.dto';
import {PaymentDto} from '../../dto/payment.dto';
import {OrganizationService} from './organization.service';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../store/app.state';
import {selectPublicOrganizationId} from '../../store/public-data/public-data.state';
import {setDefaultUserPermissions} from '../common/public-api-util';
import {DEFAULT_USER} from '../../constants';
import {RoleType} from '../../model/role-type';
import {PublicProjectService} from '../project/public-project.service';
import {ProjectService} from '../project/project.service';

@Injectable()
export class PublicOrganizationService extends PublicPermissionService implements OrganizationService {
  constructor(
    protected store$: Store<AppState>,
    private publicProjectService: ProjectService
  ) {
    super(store$);
  }

  public getAllWorkspaces(): Observable<{
    organizations: OrganizationDto[];
    projects: Record<string, ProjectDto[]>;
    limits: Record<string, ServiceLimitsDto>;
    groups: Record<string, TeamDto[]>;
  }> {
    return this.getOrganization('').pipe(
      mergeMap(organization =>
        this.publicProjectService.getProjects(organization.id).pipe(
          map(projects => ({
            organizations: [organization],
            projects: {[organization.id]: projects},
            limits: {},
            groups: {},
          }))
        )
      )
    );
  }

  public checkCodeValid(code: string): Observable<boolean> {
    return of(true);
  }

  public getOrganization(id: string): Observable<OrganizationDto> {
    return this.store$.pipe(
      select(selectPublicOrganizationId),
      take(1),
      map(organizationId => ({code: 'LUMEER', id: organizationId, permissions: {groups: [], users: []}, name: 'XXX'})),
      map(organization => setDefaultUserPermissions(organization, DEFAULT_USER, [RoleType.Read]))
    );
  }

  public getOrganizationByCode(code: string): Observable<OrganizationDto> {
    return this.getOrganization(code);
  }

  public deleteOrganization(id: string): Observable<any> {
    return of(id);
  }

  public createOrganization(organization: OrganizationDto): Observable<OrganizationDto> {
    return of(organization);
  }

  public updateOrganization(id: string, organization: OrganizationDto): Observable<OrganizationDto> {
    return of(organization);
  }

  public getOrganizationContact(id: string): Observable<ContactDto> {
    return of(null);
  }

  public setOrganizationContact(id: string, contact: ContactDto): Observable<ContactDto> {
    return of(contact);
  }

  public getServiceLimits(id: string): Observable<ServiceLimitsDto> {
    return of(null);
  }

  public getPayments(): Observable<PaymentDto[]> {
    return of([]);
  }

  public getPayment(paymentId: string): Observable<PaymentDto> {
    return of(null);
  }

  public createPayment(payment: PaymentDto, returnUrl: string): Observable<PaymentDto> {
    return of(payment);
  }

  public getWritableOrganizations(organizationId: string, projectId: string): Observable<OrganizationDto[]> {
    return of([]);
  }
}
