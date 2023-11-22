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
import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';

import {Store, select} from '@ngrx/store';

import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {AuthService} from '../../../../auth/auth.service';
import {ConfigurationService} from '../../../../configuration/configuration.service';
import {ServiceLevelType} from '../../../../core/dto/service-level-type';
import {Language, LanguageCode, availableLanguages} from '../../../../core/model/language';
import {ApplicationTourService} from '../../../../core/service/application-tour.service';
import {AppPropertiesAction} from '../../../../core/store/app-properties/app-properties.action';
import {selectIsFullscreen} from '../../../../core/store/app-properties/app-properties.state';
import {AppState} from '../../../../core/store/app.state';
import {NavigationAction} from '../../../../core/store/navigation/navigation.action';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {selectServiceLimitsByWorkspace} from '../../../../core/store/organizations/service-limits/service-limits.state';
import {User, UserHintsKeys} from '../../../../core/store/users/user';
import {UsersAction} from '../../../../core/store/users/users.action';
import {selectCurrentUser} from '../../../../core/store/users/users.state';
import {ModalService} from '../../../modal/modal.service';
import {ReferralsOverviewModalComponent} from '../../../modal/referrals-overview/referrals-overview-modal.component';
import {UserSettingsModalComponent} from '../../../modal/user-settings/user-settings-modal.component';

@Component({
  selector: 'user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenuComponent implements OnInit {
  @Input()
  public workspace: Workspace;

  @Input()
  public controlsVisible: boolean;

  @Input()
  public userEmail: string;

  public readonly buildNumber: string;
  public readonly locale: string;
  public readonly languageCode = LanguageCode;
  public readonly languages: Language[];
  public readonly helpLink: string;

  public currentUser$: Observable<User>;
  public freePlan$: Observable<boolean>;
  public isFullscreen$: Observable<boolean>;
  public currentLanguage: Language;

  public constructor(
    private authService: AuthService,
    private modalService: ModalService,
    private applicationTourService: ApplicationTourService,
    private store$: Store<AppState>,
    private router: Router,
    private configurationService: ConfigurationService
  ) {
    this.locale = configurationService.getConfiguration().locale;
    this.languages = availableLanguages.filter(language => language.code !== this.locale);
    this.buildNumber = configurationService.getConfiguration().buildNumber;
    this.helpLink = this.getHelpLink();
  }

  public ngOnInit() {
    this.currentLanguage = availableLanguages.find(language => language.code === this.locale);

    this.currentUser$ = this.store$.pipe(select(selectCurrentUser));
    this.isFullscreen$ = this.store$.pipe(select(selectIsFullscreen));
    this.bindServiceLimits();
  }

  private getHelpLink() {
    switch (this.locale) {
      case LanguageCode.CZ:
        return 'https://www.lumeer.io/cs/pomoc';
      default:
        return 'https://www.lumeer.io/get-help';
    }
  }

  private bindServiceLimits() {
    this.freePlan$ = this.store$.pipe(
      select(selectServiceLimitsByWorkspace),
      map(serviceLimits => serviceLimits?.serviceLevel === ServiceLevelType.FREE)
    );
  }

  public goToOrganizationDetail() {
    if (this.workspace?.organizationCode) {
      this.router.navigate(['o', this.workspace.organizationCode, 'detail']);
    }
  }

  public onGetInTouchClick() {
    this.modalService.showGetInTouchDialog();
  }

  public onAffiliateClick() {
    const config = {initialState: {}, keyboard: true};
    config['backdrop'] = 'static';
    this.modalService.show(ReferralsOverviewModalComponent, config);
  }

  public onLogoutClick() {
    this.authService.logout();
  }

  public onStartTour() {
    this.applicationTourService.restartTour();
  }

  public onHintsToggle($event: MouseEvent, state: boolean) {
    if ($event.ctrlKey || $event.metaKey) {
      // reset all hints
      this.store$.dispatch(new UsersAction.UpdateHints({hints: {applicationHints: state}}));
    } else {
      // just toggle application hints
      this.store$.dispatch(new UsersAction.SetHint({hint: UserHintsKeys.applicationHints, value: state}));
    }
  }

  public onFullScreenToggle(opened: boolean) {
    this.store$.dispatch(new AppPropertiesAction.SetFullscreen({opened}));
  }

  public onSettings() {
    const config = {initialState: {}, keyboard: true};
    config['backdrop'] = 'static';
    this.modalService.show(UserSettingsModalComponent, config);
  }

  public selectLanguage(currentUser: User, language: LanguageCode) {
    if (currentUser?.language === language) {
      return;
    }
    this.store$.dispatch(
      new UsersAction.PatchCurrentUser({
        user: {language},
        onSuccess: () => this.redirectToLanguage(language),
      })
    );
  }

  private redirectToLanguage(language: LanguageCode) {
    this.store$.dispatch(new NavigationAction.RedirectToLanguage({language}));
  }
}
