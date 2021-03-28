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
import {combineLatest, Observable, of} from 'rxjs';
import {catchError, first, map, mergeMap, skipWhile, take, tap} from 'rxjs/operators';
import {Organization} from '../store/organizations/organization';
import {select, Store} from '@ngrx/store';
import {selectAllOrganizations, selectOrganizationsLoaded} from '../store/organizations/organizations.state';
import {OrganizationsAction} from '../store/organizations/organizations.action';
import {WorkspaceSelectService} from '../service/workspace-select.service';
import {AppState} from '../store/app.state';
import {NotificationsAction} from '../store/notifications/notifications.action';
import {TemplateService} from '../rest/template.service';
import {OrganizationService} from '../data-service';
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
    private router: Router,
    private store$: Store<AppState>
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
    const observable = this.getWritableOrganizationsForTemplate(templateCode);
    this.selectWritableOrganizations(observable, organizations =>
      this.createProjectByTemplate(organizations, templateCode)
    );
  }

  public redirectToCopyProject(organizationId: string, projectId: string) {
    const observable = this.getWritableOrganizations(organizationId, projectId);
    this.selectWritableOrganizations(observable, organizations =>
      this.createProjectByCopy(organizations, organizationId, projectId)
    );
  }

  public selectWritableOrganizations(
    observable: Observable<Organization[]>,
    callback: (organizations: Organization[]) => void
  ) {
    combineLatest([this.selectOrganizations(), observable])
      .pipe(take(1))
      .subscribe(([organizations, writableOrganizations]) => {
        if (!writableOrganizations) {
          this.redirectToHome(() => this.showError());
        } else if (writableOrganizations.length) {
          callback(writableOrganizations);
        } else {
          this.redirectToHome(() => this.showErrorNoRights(organizations));
        }
      });
  }

  private createProjectByCopy(organizations: Organization[], organizationId: string, projectId: string) {
    const modalRef = this.workspaceSelectService.copyProject(organizations, organizationId, projectId, {
      replaceUrl: true,
    });
    modalRef.content.onClose$.subscribe(() => this.redirectToHome());
  }

  private createProjectByTemplate(organizations: Organization[], templateCode: string) {
    const modalRef = this.workspaceSelectService.createNewProject(organizations, templateCode, {replaceUrl: true});
    modalRef.content.onClose$.subscribe(() => this.redirectToHome());
  }

  private showError() {
    const message = $localize`:@@template.create.error:I am sorry, something went wrong.`;

    setTimeout(() => this.store$.dispatch(new NotificationsAction.Error({message})), 1000);
  }

  private showErrorNoRights(organizations: Organization[]) {
    if (organizations.length) {
      const message = $localize`:@@template.create.limitsExceeded:I am sorry, you can not create any more projects in a free account. Do you want to upgrade to Business now?`;
      setTimeout(
        () =>
          this.store$.dispatch(
            new OrganizationsAction.OfferPayment({
              message,
              organizationCode: organizations[0].code,
            })
          ),
        1000
      );
    } else {
      const message = $localize`:@@template.create.empty:I am sorry, you do not have any organization to create project in.`;
      setTimeout(() => this.store$.dispatch(new NotificationsAction.Error({message})), 1000);
    }
  }

  private redirectToHome(then?: () => void) {
    this.router.navigate(['/'], {replaceUrl: true}).then(() => then?.());
  }

  private getWritableOrganizationsForTemplate(templateCode: string): Observable<Organization[] | null> {
    return this.templateService.getTemplateByCode(templateCode).pipe(
      mergeMap(template => this.getWritableOrganizations(template.templateMetadata.organizationId, template.id)),
      catchError(() => of([]))
    );
  }

  private getWritableOrganizations(organizationId: string, projectId: string): Observable<Organization[] | null> {
    return this.organizationService.getWritableOrganizations(organizationId, projectId).pipe(
      map(dtos => dtos.map(dto => OrganizationConverter.fromDto(dto))),
      catchError(() => of([]))
    );
  }

  private selectOrganizations(): Observable<Organization[]> {
    return this.store$.select(selectOrganizationsLoaded).pipe(
      tap(loaded => {
        if (!loaded) {
          this.store$.dispatch(new OrganizationsAction.Get());
        }
      }),
      skipWhile(loaded => !loaded),
      mergeMap(() => this.store$.pipe(select(selectAllOrganizations))),
      first()
    );
  }
}
