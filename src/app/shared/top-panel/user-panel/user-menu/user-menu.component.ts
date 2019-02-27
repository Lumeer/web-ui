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
import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {combineLatest, Observable} from 'rxjs';
import {User} from '../../../../core/store/users/user';
import {environment} from '../../../../../environments/environment';
import {AuthService} from '../../../../auth/auth.service';
import {AppState} from '../../../../core/store/app.state';
import {selectUrl} from '../../../../core/store/navigation/navigation.state';
import {DialogService} from '../../../../dialog/dialog.service';
import {selectCurrentUser} from '../../../../core/store/users/users.state';
import {ServiceLimitsAction} from '../../../../core/store/organizations/service-limits/service-limits.action';
import {selectServiceLimitsByWorkspace} from '../../../../core/store/organizations/service-limits/service-limits.state';
import {filter, first, map, tap} from 'rxjs/operators';
import {ServiceLevelType} from '../../../../core/dto/service-level-type';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {ActivatedRoute, NavigationStart, Router} from '@angular/router';
import * as Driver from 'driver.js';
import {UsersAction} from '../../../../core/store/users/users.action';
import PatchCurrentUser = UsersAction.PatchCurrentUser;
import {selectAllCollections} from '../../../../core/store/collections/collections.state';
import {isDialogPathInUrl} from '../../../../dialog/dialog.utils';
import {Collection} from '../../../../core/store/collections/collection';
import {I18n} from '@ngx-translate/i18n-polyfill';

@Component({
  selector: 'user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenuComponent {
  public readonly buildNumber = environment.buildNumber;
  public readonly locale = environment.locale;

  @Input()
  public workspace: Workspace;

  @Output()
  public onRestartWizard = new EventEmitter();

  public currentUser$: Observable<User>;
  public url$: Observable<string>;
  public freePlan$: Observable<boolean>;

  private driver: Driver;

  public constructor(
    private authService: AuthService,
    private dialogService: DialogService,
    private store$: Store<AppState>,
    private router: Router,
    private i18n: I18n
  ) {}

  public ngOnInit() {
    this.driver = new Driver({
      opacity: 0.5,
      closeBtnText: 'Dismiss',
      onReset: () => this.dismissWizard(),
    });
    setTimeout(() => {
      // trick to find elements in the whole page
      this.defineSteps();
    });

    this.currentUser$ = this.store$.pipe(select(selectCurrentUser));
    this.url$ = this.store$.pipe(select(selectUrl));
    this.bindServiceLimits();

    combineLatest(
      this.store$.pipe(select(selectCurrentUser)),
      this.store$.pipe(select(selectAllCollections)),
      this.store$.pipe(select(selectUrl))
    )
      .pipe(
        filter(([user, collections, url]) => !!user && !!collections && !!url),
        filter(([user, collections, url]) => this.isViewSearchAll(url)),
        filter(([user, collections, url]) => !user.wizardDismissed && collections.length === 0),
        first()
      )
      .subscribe(next => this.startTour());
  }

  private isViewSearchAll(url: string): boolean {
    const [urlPrefix] = url.split('?');
    return urlPrefix.includes('view/search/all');
  }

  private bindServiceLimits() {
    this.store$.dispatch(new ServiceLimitsAction.GetAll());
    this.freePlan$ = this.store$.pipe(
      select(selectServiceLimitsByWorkspace),
      map(serviceLimits => serviceLimits && serviceLimits.serviceLevel === ServiceLevelType.FREE)
    );
  }

  public goToOrganizationDetail() {
    if (this.workspace && this.workspace.organizationCode) {
      this.router.navigate(['organization', this.workspace.organizationCode, 'detail']);
    }
  }

  public onFeedbackClick() {
    this.dialogService.openFeedbackDialog();
  }

  public onLogoutClick() {
    this.authService.logout();
  }

  public onStartTour(): void {
    this.recallWizard();
    this.startTour();
  }

  private startTour(): void {
    setTimeout(() => {
      this.driver.start();
    }, 500);
  }

  public dismissWizard(): void {
    this.store$.dispatch(
      new PatchCurrentUser({
        user: {wizardDismissed: true},
      })
    );
  }

  public recallWizard(): void {
    this.store$.dispatch(
      new PatchCurrentUser({
        user: {wizardDismissed: false},
      })
    );
  }

  private defineSteps(): void {
    this.driver.defineSteps([
      {
        element: '[data-tour="collection-add"]',
        popover: {
          title: this.i18n({
            id: 'appTour.title.welcome',
            value: 'Welcome to Lumeer',
          }),
          description: this.i18n({
            id: 'appTour.description.welcome',
            value:
              '(1/7) Lumeer organizes your information in collections (i.e. categories) of similar records. Later, you can use this button to add your first collection. Then you can open the collection by simply clicking on it.',
          }),
          position: 'right',
        },
      },
      {
        element: '[data-tour="logo"]',
        popover: {
          title: this.i18n({
            id: 'appTour.title.home',
            value: 'Get home',
          }),
          description: this.i18n({
            id: 'appTour.description.home',
            value:
              'By clicking on the Lumeer icon, you can always return to this page where you can best find and access your stored data.',
          }),
          position: 'right',
        },
      },
      {
        element: '[data-tour="search-box"]',
        popover: {
          title: this.i18n({
            id: 'appTour.title.search',
            value: 'Search for information',
          }),
          description: this.i18n({
            id: 'appTour.description.search',
            value:
              'The best way to locate your stored information is to search for it. Lumeer will guide you, just start typing in the search box.',
          }),
          position: 'bottom',
        },
      },
      {
        element: '[data-tour="perspective"]',
        popover: {
          title: this.i18n({
            id: 'appTour.title.perspectives',
            value: 'Perspectives',
          }),
          description: this.i18n({
            id: 'appTour.description.perspectives',
            value:
              'When you open your collection or search results, try selecting a different visual perspective. This is similar to changing glasses through which you can see your information in various ways.',
          }),
          position: 'right',
        },
      },
      {
        element: '[data-tour="view"]',
        popover: {
          title: this.i18n({
            id: 'appTour.title.views',
            value: 'Views and sharing',
          }),
          description: this.i18n({
            id: 'appTour.description.views',
            value:
              "You might connect multiple collections in relations, select a Table perspective and hide some columns for example. You don't need to repeat the steps each time. Just give your view, or page if you will, a name and store it. Later you can access the stored view on home page or you can share the view with your colleagues.",
          }),
          position: 'bottom',
        },
      },
      {
        element: '[data-tour="video-menu"]',
        popover: {
          title: this.i18n({
            id: 'appTour.title.videos',
            value: 'Help with Lumeer',
          }),
          description: this.i18n({
            id: 'appTour.description.videos',
            value: 'Here you can find a list of one-minute videos that explain controls on each page.',
          }),
          position: 'left',
        },
      },
      {
        element: '[data-tour="user-menu"]',
        popover: {
          title: this.i18n({
            id: 'appTour.title.userMenu',
            value: 'Return to this Tour',
          }),
          description: this.i18n({
            id: 'appTour.description.userMenu',
            value: 'You can always return to this tour by invoking it from the user menu.',
          }),
          position: 'left',
        },
      },
    ]);
  }
}
