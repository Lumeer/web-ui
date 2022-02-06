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
import {BehaviorSubject, combineLatest, Observable, of, Subject} from 'rxjs';
import {distinctUntilChanged, map, switchMap, take} from 'rxjs/operators';
import {DialogType} from '../dialog-type';
import {Project} from '../../../core/store/projects/project';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {
  selectProjectTemplates,
  selectProjectTemplatesCount,
  selectReadableProjectsCount,
} from '../../../core/store/projects/projects.state';
import {Organization} from '../../../core/store/organizations/organization';
import {selectContributeOrganizations} from '../../../core/store/organizations/organizations.state';
import {CreateProjectService} from '../../../core/service/create-project.service';
import {NavigationExtras} from '@angular/router';
import {InvitationType} from '../../../core/model/invitation-type';
import {selectCurrentUser} from '../../../core/store/users/users.state';
import {isEmailValid} from '../../utils/email.utils';
import {UserInvitation} from '../../../core/model/user-invitation';
import {UsersAction} from '../../../core/store/users/users.action';

const EMPTY_TEMPLATE_CODE = 'EMPTY';

@Injectable()
export class GettingStartedService {
  private readonly _performingAction$ = new BehaviorSubject(false);
  public readonly performingAction$ = this._performingAction$.pipe(distinctUntilChanged());

  private _performingSecondaryAction$ = new BehaviorSubject(false);
  public readonly performingSecondaryAction$ = this._performingSecondaryAction$.pipe(distinctUntilChanged());

  public readonly button$: Observable<DialogButton>;
  public readonly secondaryButton$: Observable<DialogButton>;
  public readonly closeButton$: Observable<DialogButton>;

  private _stage$ = new BehaviorSubject(GettingStartedStage.Template);
  public stage$ = this._stage$.pipe(distinctUntilChanged());

  private _close$ = new Subject();
  public close$ = this._close$.asObservable();

  // components data

  private _selectedTag$ = new BehaviorSubject<string>(null);
  public selectedTag$ = this._selectedTag$.pipe(distinctUntilChanged());
  private _selectedTemplate$ = new BehaviorSubject<Project>(null);
  public selectedTemplate$ = this._selectedTemplate$.pipe(distinctUntilChanged((a, b) => a?.id === b?.id));

  private _selectedOrganization$ = new BehaviorSubject<Organization>(null);
  public selectedOrganization$ = this._selectedOrganization$.pipe(distinctUntilChanged((a, b) => a?.id === b?.id));

  public _invitations$ = new BehaviorSubject<UserInvitation[]>([emptyInvitation, emptyInvitation, emptyInvitation]);
  public invitations$ = this._invitations$.asObservable();

  // other data
  private navigationExtras: NavigationExtras;
  private createdProject: Project;

  constructor(private store$: Store<AppState>, private createProjectService: CreateProjectService) {
    this.button$ = this._stage$.pipe(switchMap(stage => this.getButton(stage)));
    this.secondaryButton$ = this._stage$.pipe(switchMap(stage => this.getSecondaryButton(stage)));
    this.closeButton$ = this._stage$.pipe(switchMap(stage => this.getCloseButton(stage)));
  }

  public get stage(): GettingStartedStage {
    return this._stage$.value;
  }

  private set stage(value: GettingStartedStage) {
    this._stage$.next(value);
  }

  private set performingAction(value: boolean) {
    this._performingAction$.next(value);
  }

  private set performingSecondaryAction(value: boolean) {
    this._performingSecondaryAction$.next(value);
  }

  public get selectedTag(): string {
    return this._selectedTag$.value;
  }

  public set selectedTag(value: string) {
    this._selectedTag$.next(value);
  }

  public get selectedTemplate(): Project {
    return this._selectedTemplate$.value;
  }

  public set selectedTemplate(value: Project) {
    this._selectedTemplate$.next(value);
  }

  public get invitations(): UserInvitation[] {
    return this._invitations$.value;
  }

  public set invitations(value: UserInvitation[]) {
    this._invitations$.next(value);
  }

  public get selectedOrganization() {
    return this._selectedOrganization$.value;
  }

  public set selectedOrganization(value: Organization) {
    this._selectedOrganization$.next(value);
  }

  public setNavigationExtras(value: NavigationExtras) {
    this.navigationExtras = value;
  }

  public setInvitationEmail(index: number, email: string) {
    const invitations = this.patchInvitation(index, invitation => ({...invitation, email}));
    if (index === invitations.length - 1 && email.trim().length > 0) {
      invitations.push(emptyInvitation);
    }
    this.invitations = invitations;
  }

  public setInvitationType(index: number, type: InvitationType) {
    this.invitations = this.patchInvitation(index, invitation => ({...invitation, type}));
  }

  public addInvitation() {
    this.invitations = [...this._invitations$.value, emptyInvitation];
  }

  private patchInvitation(index: number, patch: (UserInvitation) => UserInvitation): UserInvitation[] {
    const invitationsCopy = [...this._invitations$.value];
    const invitation = invitationsCopy[index];
    invitationsCopy[index] = patch(invitation);
    return invitationsCopy;
  }

  private getButton(stage: GettingStartedStage): Observable<DialogButton> {
    switch (stage) {
      case GettingStartedStage.Template:
        return of({
          disabled$: this.selectedTemplate$.pipe(map(template => !template?.id)),
          class: DialogType.Primary,
          title: $localize`:@@templates.button.use:Use this template`,
        });
      case GettingStartedStage.ChooseOrganization:
        return of({
          disabled$: this.selectedOrganization$.pipe(map(template => !template?.id)),
          class: DialogType.Primary,
          title: $localize`:@@templates.button.use:Use this template`,
        });
      case GettingStartedStage.InviteUsers:
        return of({
          disabled$: of(false),
          class: DialogType.Primary,
          title: $localize`:@@getting.started.invite.users.confirm:Invite my colleagues`,
        });
      default:
        return of(null);
    }
  }

  private getSecondaryButton(stage: GettingStartedStage): Observable<DialogButton> {
    switch (stage) {
      case GettingStartedStage.Template:
        return combineLatest([
          this.store$.pipe(select(selectProjectTemplatesCount)),
          this.store$.pipe(select(selectReadableProjectsCount)),
        ]).pipe(
          map(([templatesCount, projectsCount]) => {
            if (templatesCount === 0 || projectsCount > 0) {
              return {
                disabled$: of(false),
                class: DialogType.Primary,
                title: $localize`:@@templates.button.empty:Start with empty project`,
              };
            }
            return null;
          })
        );
      case GettingStartedStage.InviteUsers:
        return of({
          disabled$: of(false),
          class: DialogType.Primary,
          title: $localize`:@@getting.started.invite.users.skip:I'll do it later`,
        });
      default:
        return of(null);
    }
  }

  private getCloseButton(stage: GettingStartedStage): Observable<DialogButton> {
    switch (stage) {
      case GettingStartedStage.Template:
      case GettingStartedStage.ChooseOrganization:
        return this.store$.pipe(
          select(selectReadableProjectsCount),
          map(projectsCount => {
            if (projectsCount > 0) {
              return {
                disabled$: of(false),
                title: $localize`:@@button.cancel:Cancel`,
              };
            }
            return null;
          })
        );
      default:
        return of(null);
    }
  }

  public onSubmit() {
    switch (this.stage) {
      case GettingStartedStage.Template:
        this.checkNextStageFromTemplate(this.selectedTemplate);
        break;
      case GettingStartedStage.ChooseOrganization:
        this.submitTemplate(this.selectedOrganization, this.selectedTemplate);
        break;
      case GettingStartedStage.InviteUsers:
        this.checkSubmitInvitations();
        break;
    }
  }

  public onSecondarySubmit() {
    switch (this.stage) {
      case GettingStartedStage.Template:
        this.store$
          .pipe(
            select(selectProjectTemplates),
            take(1),
            map(templates => templates.find(t => t.code === EMPTY_TEMPLATE_CODE))
          )
          .subscribe(emptyTemplate => {
            this.checkNextStageFromTemplate(emptyTemplate);
          });
        break;
      case GettingStartedStage.InviteUsers:
        this.checkNextStageFromInviteUsers();
        break;
    }
  }

  private checkNextStageFromInviteUsers() {
    this.store$.pipe(select(selectCurrentUser), take(1)).subscribe(currentUser => {
      if (currentUser.emailVerified) {
        this.stage = GettingStartedStage.Video;
      } else {
        this.stage = GettingStartedStage.EmailVerification;
      }
    });
  }

  public onClose() {
    this.close();
  }

  private close() {
    this._close$.next(null);
  }

  private checkNextStageFromTemplate(template?: Project) {
    if (this.selectedOrganization) {
      this.submitTemplate(this.selectedOrganization, template);
      return;
    }

    this.store$.pipe(select(selectContributeOrganizations), take(1)).subscribe(organizations => {
      if (organizations.length === 1) {
        this.submitTemplate(organizations[0], template);
      } else if (organizations.length > 1) {
        this.selectedTemplate = template;
        this.stage = GettingStartedStage.ChooseOrganization;
      } else {
        // TODO show some error
      }
    });
  }

  private submitTemplate(organization: Organization, template?: Project) {
    this.performingAction = true;

    const code = template?.code || EMPTY_TEMPLATE_CODE;
    this.createProjectService.createProjectInOrganization(organization, code, {
      templateId: template?.id,
      navigationExtras: this.navigationExtras,
      onSuccess: project => this.onProjectCreated(project),
      onFailure: () => this.onFailure(),
    });
  }

  private checkSubmitInvitations() {
    const validInvitations = this.filterValidInvitations();
    if (validInvitations.length > 0) {
      this.submitInvitations(validInvitations);
    } else {
      this.checkNextStageFromInviteUsers();
    }
  }

  private filterValidInvitations(): UserInvitation[] {
    return this.invitations.reduce((invitations, invitation) => {
      const cleanedInvitation = {...invitation, email: invitation.email.trim()};
      if (isEmailValid(cleanedInvitation.email) && !invitations.some(inv => inv.email === cleanedInvitation.email)) {
        invitations.push(cleanedInvitation);
      }
      return invitations;
    }, []);
  }

  private submitInvitations(invitations: UserInvitation[]) {
    this.performingAction = true;

    this.store$.dispatch(
      new UsersAction.InviteUsers({
        invitations,
        organizationId: this.selectedOrganization.id,
        projectId: this.createdProject.id,
        onSuccess: () => this.onInvitationsSent(),
        onFailure: () => this.onFailure(),
      })
    );
  }

  private onProjectCreated(project: Project) {
    this.createdProject = project;
    this.stage = GettingStartedStage.InviteUsers;
    this.stopPerformingActions();
  }

  private onInvitationsSent() {
    this.checkNextStageFromInviteUsers();
    this.stopPerformingActions();
  }

  private onFailure() {
    this.stopPerformingActions();
  }

  private stopPerformingActions() {
    this.performingAction = false;
    this.performingSecondaryAction = false;
  }
}

export enum GettingStartedStage {
  Template = 0,
  ChooseOrganization = 1,
  InviteUsers = 2,
  EmailVerification = 3,
  Video = 4,
}

export interface DialogButton {
  title: string;
  class?: DialogType;
  disabled$?: Observable<boolean>;
}

const emptyInvitation: UserInvitation = {email: '', type: InvitationType.Manage};
