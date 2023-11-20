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
import {ActivatedRoute, Router} from '@angular/router';

import {Observable, of} from 'rxjs';
import {catchError, map, mergeMap, take} from 'rxjs/operators';

import {sortResourcesByOrder} from '../../shared/utils/resource.utils';
import {OrganizationService} from '../data-service';
import {TemplateService} from '../rest/template.service';
import {WorkspaceSelectService} from '../service/workspace-select.service';
import {Organization} from '../store/organizations/organization';
import {OrganizationConverter} from '../store/organizations/organization.converter';

@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RedirectComponent implements OnInit {
  constructor(
    private workspaceSelectService: WorkspaceSelectService,
    private templateService: TemplateService,
    private organizationService: OrganizationService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.pipe(take(1)).subscribe(params => {
      const templateCode = params.get('templateCode');
      const organizationId = params.get('organizationId');
      const projectId = params.get('projectId');
      if (templateCode) {
        this.redirectToTemplate(templateCode);
      } else if (organizationId && projectId) {
        this.redirectToCopyProject(organizationId, projectId);
      } else {
        return this.redirectToHome();
      }
    });
  }

  public redirectToTemplate(templateCode: string) {
    this.getWritableOrganizationsForTemplate(templateCode)
      .pipe(take(1))
      .subscribe(organizations => this.createProjectByTemplate(organizations, templateCode));
  }

  public redirectToCopyProject(organizationId: string, projectId: string) {
    this.getWritableOrganizations(organizationId, projectId)
      .pipe(take(1))
      .subscribe(organizations => this.createProjectByCopy(organizations, organizationId, projectId));
  }

  private createProjectByCopy(organizations: Organization[], organizationId: string, projectId: string) {
    this.workspaceSelectService.copyProject(organizations, organizationId, projectId, {replaceUrl: true});
  }

  private createProjectByTemplate(organizations: Organization[], templateCode: string) {
    this.workspaceSelectService.createNewProjectWithTemplate(organizations, null, templateCode, {replaceUrl: true});
  }

  private redirectToHome(then?: () => void) {
    this.router.navigate(['/'], {replaceUrl: true}).then(() => then?.());
  }

  private getWritableOrganizationsForTemplate(templateCode: string): Observable<Organization[]> {
    return this.templateService.getTemplateByCode(templateCode).pipe(
      mergeMap(template => this.getWritableOrganizations(template.templateMetadata.organizationId, template.id)),
      catchError(() => of([]))
    );
  }

  private getWritableOrganizations(organizationId: string, projectId: string): Observable<Organization[]> {
    return this.organizationService.getWritableOrganizations(organizationId, projectId).pipe(
      map(dtos => dtos.map(dto => OrganizationConverter.fromDto(dto))),
      map(organizations => sortResourcesByOrder(organizations)),
      catchError(() => of([]))
    );
  }
}
