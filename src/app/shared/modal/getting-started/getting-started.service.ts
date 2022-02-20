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
import {NavigationExtras} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, combineLatest, interval, Observable, of, Subject, Subscription, timer} from 'rxjs';
import {catchError, distinctUntilChanged, map, switchMap, take, tap} from 'rxjs/operators';
import {DialogType} from '../dialog-type';
import {Project} from '../../../core/store/projects/project';
import {AppState} from '../../../core/store/app.state';
import {
  selectProjectTemplates,
  selectProjectTemplatesCount,
  selectReadableProjectsCount,
} from '../../../core/store/projects/projects.state';
import {Organization} from '../../../core/store/organizations/organization';
import {selectContributeOrganizationsByIds} from '../../../core/store/organizations/organizations.state';
import {CreateProjectService} from '../../../core/service/create-project.service';
import {InvitationType} from '../../../core/model/invitation-type';
import {selectCurrentUser} from '../../../core/store/users/users.state';
import {isEmailValid} from '../../utils/email.utils';
import {UserInvitation} from '../../../core/model/user-invitation';
import {UsersAction} from '../../../core/store/users/users.action';
import {ProjectConverter} from '../../../core/store/projects/project.converter';
import {PublicProjectService} from '../../../core/data-service/project/public-project.service';
import {selectWorkspace} from '../../../core/store/navigation/navigation.state';
import {RouterAction} from '../../../core/store/router/router.action';
import {User, UserOnboarding} from '../../../core/store/users/user';
import {GettingStartedStage} from './model/getting-started-stage';
import {uniqueValues} from '../../utils/array.utils';
import {organizationReadableUsersAndTeams} from '../../utils/permission.utils';
import {ModalService} from '../modal.service';

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

  private _stage$ = new BehaviorSubject<GettingStartedStage>(null);
  public stage$ = this._stage$.pipe(distinctUntilChanged());
  public stages$: Observable<GettingStartedStage[]>;

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

  public copyProject$: Observable<Project>;

  // other data
  private writableOrganizationsIds: string[];
  private navigationExtras: NavigationExtras;
  private createdProject: Project;
  private copyProject: Project;
  private stageSubscriptions = new Subscription();
  private copyProjectData: {organizationId: string; projectId: string};

  constructor(
    private store$: Store<AppState>,
    private createProjectService: CreateProjectService,
    private publicProjectService: PublicProjectService,
    private modalService: ModalService
  ) {
    this.button$ = this._stage$.pipe(switchMap(stage => this.getButton(stage)));
    this.secondaryButton$ = this._stage$.pipe(switchMap(stage => this.getSecondaryButton(stage)));
    this.closeButton$ = this._stage$.pipe(switchMap(stage => this.getCloseButton(stage)));
  }

  public get stage(): GettingStartedStage {
    return this._stage$.value;
  }

  private set stage(value: GettingStartedStage) {
    this._stage$.next(value);
    this.stopPerformingActions();
    this.unsubscribe();
    this.scheduleStageActions(value);
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

  public setWritableOrganizations(organizations: Organization[]) {
    this.writableOrganizationsIds = (organizations || []).map(organization => organization.id);
  }

  public setCopyData(organizationId: string, projectId: string) {
    this.copyProjectData = {organizationId, projectId};
  }

  public setInitialStage(initialStage: GettingStartedStage) {
    if (!this.stage) {
      this.stage = initialStage;
    }
    this.subscribeStages(initialStage);
  }

  private subscribeStages(initialStage: GettingStartedStage) {
    this.stages$ = combineLatest([
      this.selectCurrentUser$().pipe(take(1)),
      this.selectedOrganization$.pipe(take(1)),
      this.selectContributeOrganizations$().pipe(take(1)),
    ]).pipe(
      map(([currentUser, selectedOrganization, contributeOrganizations]) => {
        const stages = [];

        if (initialStage === GettingStartedStage.Template || initialStage === GettingStartedStage.CopyProject) {
          stages.push(initialStage);

          if (!selectedOrganization && contributeOrganizations.length > 1) {
            stages.push(GettingStartedStage.ChooseOrganization);
          }

          if (this.shouldShowInviteUsers(selectedOrganization)) {
            stages.push(GettingStartedStage.InviteUsers);
          }
        }

        if (!currentUser?.emailVerified) {
          stages.push(GettingStartedStage.EmailVerification);
        }
        if (!currentUser?.onboarding?.videoShowed) {
          stages.push(GettingStartedStage.Video);
        }

        return uniqueValues(stages);
      })
    );
  }

  public setInvitationEmail(index: number, rawEmail: string) {
    const email = rawEmail?.trim() || '';

    // check type for same invitation email
    let type = this.invitations[index].type;
    for (let i = 0; i < this.invitations.length; i++) {
      if (i !== index && this.invitations[i].email === email) {
        type = this.invitations[i].type;
        break;
      }
    }

    const invitations = this.patchInvitation(index, invitation => ({...invitation, type, email}));
    if (index === invitations.length - 1 && email.length > 0) {
      invitations.push(emptyInvitation);
    }

    this.invitations = invitations;
  }

  public setInvitationType(index: number, type: InvitationType) {
    const invitations = this.patchInvitation(index, invitation => ({...invitation, type}));

    // sync invitation types for same emails
    for (let i = 0; i < invitations.length; i++) {
      if (i !== index && invitations[i].email === invitations[index].email) {
        invitations[i] = {...invitations[i], type};
      }
    }

    this.invitations = invitations;
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
          icon: 'fas fa-file-check',
          disabled$: this.selectedTemplate$.pipe(map(template => !template?.id)),
          class: DialogType.Primary,
          title: $localize`:@@templates.button.use:Use this template`,
        });
      case GettingStartedStage.CopyProject:
        return of({
          icon: 'fas fa-copy',
          disabled$: of(false),
          class: DialogType.Primary,
          title: $localize`:@@dialog.project.copy.confirm:Copy and Open`,
        });
      case GettingStartedStage.ChooseOrganization:
        if (this.selectedTemplate) {
          return of({
            icon: 'fas fa-file-check',
            disabled$: this.selectedOrganization$.pipe(map(template => !template?.id)),
            class: DialogType.Primary,
            title: $localize`:@@templates.button.use:Use this template`,
          });
        } else if (this.copyProject) {
          return of({
            icon: 'fas fa-copy',
            disabled$: this.selectedOrganization$.pipe(map(template => !template?.id)),
            class: DialogType.Primary,
            title: $localize`:@@dialog.project.copy.confirm:Copy and Open`,
          });
        }
        return of(null);
      case GettingStartedStage.InviteUsers:
        return of({
          icon: 'fas fa-user-plus',
          disabled$: of(false),
          class: DialogType.Primary,
          title: $localize`:@@getting.started.invite.users.confirm:Invite my colleagues`,
        });
      case GettingStartedStage.EmailVerification:
        return of({
          icon: 'fas fa-check',
          disabled$: of(false),
          class: DialogType.Primary,
          title: $localize`:@@verifyEmail.button.resendEmail:Resend verification email`,
        });
      case GettingStartedStage.Video:
        return of({
          icon: 'fas fa-rocket-launch',
          disabled$: of(false),
          class: DialogType.Primary,
          title: $localize`:@@getting.started.video.button:Get started`,
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
      case GettingStartedStage.EmailVerification:
        return of({
          disabled$: of(false),
          class: DialogType.Primary,
          title: $localize`:@@button.reload:Reload`,
        });
      case GettingStartedStage.Video:
        return of({
          disabled$: of(false),
          class: DialogType.Primary,
          title: $localize`:@@menu.getInTouch:Get in Touch with Us`,
        });
      default:
        return of(null);
    }
  }

  private getCloseButton(stage: GettingStartedStage): Observable<DialogButton> {
    switch (stage) {
      case GettingStartedStage.Template:
      case GettingStartedStage.CopyProject:
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
      case GettingStartedStage.CopyProject:
        this.checkNextStageFromCopyProject(this.copyProject);
        break;
      case GettingStartedStage.ChooseOrganization:
        if (this.selectedTemplate) {
          this.submitTemplate(this.selectedOrganization, this.selectedTemplate);
        } else if (this.copyProject) {
          this.submitCopyProject(this.selectedOrganization, this.copyProject);
        }
        break;
      case GettingStartedStage.InviteUsers:
        this.checkSubmitInvitations();
        break;
      case GettingStartedStage.EmailVerification:
        this.resendVerificationEmail();
        break;
      case GettingStartedStage.Video:
        this.close();
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
      case GettingStartedStage.EmailVerification:
        this.reloadUser();
        break;
      case GettingStartedStage.Video:
        this.showGetInTouch();
        break;
    }
  }

  private checkNextStageFromInviteUsers() {
    this.selectCurrentUser$()
      .pipe(take(1))
      .subscribe(currentUser => {
        if (currentUser.emailVerified) {
          this.checkVideoStage(currentUser);
        } else {
          this.stage = GettingStartedStage.EmailVerification;
        }
      });
  }

  private checkVideoStage(currentUser: User) {
    if (currentUser.onboarding?.videoShowed) {
      this.close();
    } else {
      this.stage = GettingStartedStage.Video;
    }
  }

  private scheduleStageActions(stage: GettingStartedStage) {
    switch (stage) {
      case GettingStartedStage.EmailVerification:
        this.scheduleEmailVerificationCheck();
        break;
      case GettingStartedStage.CopyProject:
        const {organizationId, projectId} = this.copyProjectData;
        this.copyProject$ = this.publicProjectService.getProject(organizationId, projectId).pipe(
          map(dto => ProjectConverter.fromDto(dto, organizationId)),
          catchError(() => of(null)),
          tap(project => (this.copyProject = project))
        );
        break;
      case GettingStartedStage.Video:
        this.patchUserOnboarding('videoShowed', true);
        break;
    }
  }

  private scheduleEmailVerificationCheck() {
    this.stageSubscriptions.add(
      this.selectCurrentUser$().subscribe(user => {
        if (this.stage === GettingStartedStage.EmailVerification && user.emailVerified) {
          this.checkVideoStage(user);
        }
      })
    );
    let currentInterval = 5;
    this.stageSubscriptions.add(
      timer(0, 60_000)
        .pipe(switchMap(() => interval(currentInterval++ * 1000)))
        .subscribe(() => this.store$.dispatch(new UsersAction.GetCurrentUser()))
    );
  }

  public onClose() {
    this.close();
  }

  private close() {
    this._close$.next(null);

    this.store$.pipe(select(selectWorkspace), take(1)).subscribe(workspace => {
      if (!workspace?.organizationCode) {
        this.store$.dispatch(new RouterAction.Go({path: ['/'], extras: {replaceUrl: true}}));
      }
    });
  }

  private checkNextStageFromTemplate(template?: Project) {
    if (this.selectedOrganization) {
      this.submitTemplate(this.selectedOrganization, template);
      return;
    }

    this.selectContributeOrganizations$()
      .pipe(take(1))
      .subscribe(organizations => {
        if (organizations.length === 1) {
          this.submitTemplate(organizations[0], template);
        } else {
          this.selectedTemplate = template;
          this.stage = GettingStartedStage.ChooseOrganization;
        }
      });
  }

  private submitTemplate(organization: Organization, template: Project) {
    this.performingAction = true;
    this.selectedOrganization = organization;

    const code = template?.code || EMPTY_TEMPLATE_CODE;
    this.createProjectService.createProjectInOrganization(organization, code, {
      templateId: template?.id,
      navigationExtras: this.navigationExtras,
      onSuccess: project => this.onProjectCreated(organization, project, template?.code),
      onFailure: () => this.onFailure(),
    });
  }

  private checkNextStageFromCopyProject(copyProject: Project) {
    if (this.selectedOrganization) {
      this.submitCopyProject(this.selectedOrganization, copyProject);
      return;
    }

    this.selectContributeOrganizations$()
      .pipe(take(1))
      .subscribe(organizations => {
        if (organizations.length === 1) {
          this.submitTemplate(organizations[0], copyProject);
        } else {
          this.stage = GettingStartedStage.ChooseOrganization;
        }
      });
  }

  public selectContributeOrganizations$(): Observable<Organization[]> {
    return this.store$.pipe(select(selectContributeOrganizationsByIds(this.writableOrganizationsIds)));
  }

  private selectCurrentUser$(): Observable<User> {
    return this.store$.pipe(select(selectCurrentUser));
  }

  private submitCopyProject(organization: Organization, copyProject: Project) {
    this.performingAction = true;

    this.createProjectService.createProjectInOrganization(organization, copyProject?.code, {
      copyProject,
      navigationExtras: this.navigationExtras,
      onSuccess: project => this.onProjectCreated(organization, project),
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
        onSuccess: () => this.onInvitationsSent(invitations.length),
        onFailure: () => this.onFailure(),
      })
    );
  }

  private resendVerificationEmail() {
    this.performingAction = true;

    this.store$.dispatch(
      new UsersAction.ResendVerificationEmail({
        onSuccess: () => (this.performingAction = false),
        onFailure: () => (this.performingAction = false),
      })
    );
  }

  private reloadUser() {
    this.performingSecondaryAction = true;

    this.store$.dispatch(
      new UsersAction.GetCurrentUser({
        onSuccess: () => (this.performingSecondaryAction = false),
        onFailure: () => (this.performingSecondaryAction = false),
      })
    );
  }

  private onProjectCreated(organization: Organization, project: Project, template?: string) {
    this.createdProject = project;
    if (this.shouldShowInviteUsers(organization)) {
      this.stage = GettingStartedStage.InviteUsers;
    } else {
      this.checkNextStageFromInviteUsers();
    }

    this.selectCurrentUser$()
      .pipe(take(1))
      .subscribe(currentUser => {
        if (template && !currentUser?.onboarding?.template) {
          this.patchUserOnboarding('template', template);
        }
      });
  }

  private shouldShowInviteUsers(organization: Organization): boolean {
    const {readableUsers, readableTeams} = organizationReadableUsersAndTeams(organization);
    return readableUsers + readableTeams < 2;
  }

  private showGetInTouch() {
    this.close();
    this.modalService.showGetInTouchDialog();
  }

  private onInvitationsSent(count: number) {
    this.checkNextStageFromInviteUsers();
    this.patchUserOnboarding('invitedUsers', count);
  }

  private onFailure() {
    this.stopPerformingActions();
  }

  private stopPerformingActions() {
    this.performingAction = false;
    this.performingSecondaryAction = false;
  }

  private unsubscribe() {
    this.stageSubscriptions.unsubscribe();
    this.stageSubscriptions = new Subscription();
  }

  public onDestroy() {
    this.unsubscribe();
  }

  private patchUserOnboarding(key: keyof UserOnboarding, value: any) {
    this.store$.dispatch(new UsersAction.SetOnboarding({key, value}));
  }
}

export interface DialogButton {
  icon?: string;
  title: string;
  class?: DialogType;
  disabled$?: Observable<boolean>;
}

const emptyInvitation: UserInvitation = {email: '', type: InvitationType.Manage};
