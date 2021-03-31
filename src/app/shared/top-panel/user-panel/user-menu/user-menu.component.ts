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

import {ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, OnInit, Output} from '@angular/core';
import {Router} from '@angular/router';

import {select, Store} from '@ngrx/store';
import {combineLatest, Observable, timer} from 'rxjs';
import {User, UserHintsKeys} from '../../../../core/store/users/user';
import {AuthService} from '../../../../auth/auth.service';
import {AppState} from '../../../../core/store/app.state';
import {selectUrl} from '../../../../core/store/navigation/navigation.state';
import {selectCurrentUser} from '../../../../core/store/users/users.state';
import {ServiceLimitsAction} from '../../../../core/store/organizations/service-limits/service-limits.action';
import {selectServiceLimitsByWorkspace} from '../../../../core/store/organizations/service-limits/service-limits.state';
import {filter, first, map} from 'rxjs/operators';
import {ServiceLevelType} from '../../../../core/dto/service-level-type';
import {Workspace} from '../../../../core/store/navigation/workspace';
import * as Driver from 'driver.js';
import {UsersAction} from '../../../../core/store/users/users.action';
import {selectAllCollections} from '../../../../core/store/collections/collections.state';
import {NotificationsAction} from '../../../../core/store/notifications/notifications.action';
import PatchCurrentUser = UsersAction.PatchCurrentUser;
import {selectAllViews} from '../../../../core/store/views/views.state';
import {UserFeedbackModalComponent} from './user-feedback-modal/user-feedback-modal.component';
import {ModalService} from '../../../modal/modal.service';
import {Perspective} from '../../../../view/perspectives/perspective';
import {SearchTab} from '../../../../core/store/navigation/search-tab';
import {ReferralsOverviewModalComponent} from '../../../modal/referrals-overview/referrals-overview-modal.component';
import {UserSettingsModalComponent} from '../../../modal/user-settings/user-settings-modal.component';
import {availableLanguages, Language, LanguageCode} from './language';
import {ConfigurationService} from '../../../../configuration/configuration.service';

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

  @Output()
  public toggleControls = new EventEmitter();

  public readonly buildNumber: string;
  public readonly locale: string;
  public readonly languageCode = LanguageCode;
  public readonly languages: Language[];
  public readonly helpLink: string;

  public currentUser$: Observable<User>;
  public url$: Observable<string>;
  public freePlan$: Observable<boolean>;
  public currentLanguage: Language;

  private starting: boolean = false;
  private dismissing: boolean = false;
  private driver: Driver;

  public constructor(
    private authService: AuthService,
    private modalService: ModalService,
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
    this.driver = new Driver({
      opacity: 0.5,
      scrollIntoViewOptions: {block: 'start'},
      closeBtnText: $localize`:@@button.dismiss:Dismiss`,
      doneBtnText: $localize`:@@button.onward:Onward!`,
      nextBtnText: $localize`:@@button.next:Next`,
      prevBtnText: $localize`:@@button.previous:Previous`,
      onReset: () => this.dismissWizard(),
    });

    this.currentLanguage = availableLanguages.find(language => language.code === this.locale);

    this.currentUser$ = this.store$.pipe(select(selectCurrentUser));
    this.url$ = this.store$.pipe(select(selectUrl));
    this.bindServiceLimits();

    combineLatest([
      timer(5000, -1),
      this.store$.pipe(select(selectCurrentUser)),
      this.store$.pipe(select(selectAllCollections)),
      this.store$.pipe(select(selectAllViews)),
      this.store$.pipe(select(selectUrl)),
    ])
      .pipe(
        filter(
          ([timerVal, user, collections, views, url]) => timerVal > 0 && !!user && !!collections && !!views && !!url
        ),
        filter(([, , , , url]) => this.isViewSearchAll(url)),
        filter(([, user, , ,]) => !user.wizardDismissed && user.emailVerified),
        first()
      )
      .subscribe(([, , collections, views]) => this.startTour(false, collections.length, views.length));
  }

  private getHelpLink() {
    switch (this.locale) {
      case LanguageCode.CZ:
        return 'https://www.lumeer.io/cs/pomoc';
      default:
        return 'https://www.lumeer.io/get-help';
    }
  }

  private isViewSearchAll(url: string): boolean {
    const [urlPrefix] = url.split('?');
    return urlPrefix.includes('view/search/all');
  }

  private bindServiceLimits() {
    this.store$.dispatch(new ServiceLimitsAction.GetAll());
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

  public onFeedbackClick() {
    const config = {initialState: {}, keyboard: false};
    config['backdrop'] = 'static';
    this.modalService.show(UserFeedbackModalComponent, config);
  }

  public onAffiliateClick() {
    const config = {initialState: {}, keyboard: true};
    config['backdrop'] = 'static';
    this.modalService.show(ReferralsOverviewModalComponent, config);
  }

  public onLogoutClick() {
    this.authService.logout();
  }

  public onStartTour(): void {
    this.recallWizard();

    combineLatest([this.store$.pipe(select(selectAllCollections)), this.store$.pipe(select(selectAllViews))])
      .pipe(
        filter(([collections, views]) => !!collections && !!views),
        first()
      )
      .subscribe(([collections, views]) => this.startTour(true, collections.length, views.length));
  }

  private startTour(manual: boolean, collectionsCount: number, viewsCount: number): void {
    if (!this.starting && !this.dismissing) {
      this.starting = true;

      if (manual) {
        // we need to make sure to be on the home page
        this.currentUser$
          .pipe(
            filter(user => !!user),
            first()
          )
          .subscribe(user => {
            const organizationCode = this.workspace.organizationCode || user.defaultWorkspace?.organizationCode;
            const projectCode = this.workspace.projectCode || user.defaultWorkspace?.projectCode;

            if (organizationCode && projectCode) {
              this.router
                .navigate(['/', 'w', organizationCode, projectCode, 'view', Perspective.Search, SearchTab.All])
                .then(() => {
                  this.kickstartTour(collectionsCount, viewsCount);
                });
            } else {
              this.store$.dispatch(
                new NotificationsAction.Error({
                  message: $localize`:@@menu.appTour.invocationError:Could not invoke application tour because I did not find any recent project to work with. Go to a page with project content and try again please.`,
                })
              );
            }
          });
      } else {
        // we already checked the url
        this.kickstartTour(collectionsCount, viewsCount);
      }
    }
  }

  private kickstartTour(collectionsCount: number, viewsCount: number) {
    if (!this.controlsVisible) {
      this.toggleControls.emit();
    }

    setTimeout(() => {
      // trick to allow access to all document elements
      this.driver.reset(true);
      this.defineSteps(collectionsCount, viewsCount);

      document.getElementsByClassName('search-perspective')?.[0]?.scrollTo(0, 0);

      this.driver.start();
      this.starting = false;
    }, 500);
  }

  public dismissWizard(): void {
    if (!this.starting && !this.dismissing) {
      this.dismissing = true;
      this.store$.dispatch(
        new PatchCurrentUser({
          user: {wizardDismissed: true},
          onSuccess: () => (this.dismissing = false),
          onFailure: () => (this.dismissing = false),
        })
      );
    }
  }

  public recallWizard(): void {
    if (!this.dismissing) {
      this.store$.dispatch(
        new PatchCurrentUser({
          user: {wizardDismissed: false},
        })
      );
    }
  }

  private getStepCounter(stepNo: number, totalSteps: number): string {
    return '(' + stepNo + '/' + totalSteps + ') ';
  }

  private defineSteps(collectionsCount: number, viewsCount: number): void {
    const totalSteps = viewsCount > 0 ? 8 : collectionsCount > 0 ? 8 : 7;
    let stepNo = 1;

    const driverSteps = [];
    const basicTitle = $localize`:@@appTour.title.basic:Access your information`;
    const basicDescription = $localize`:@@appTour.description.basic:Lumeer organizes your information in tables. Later, you can use this button to add your tables. Then you can open the table by simply clicking on it.`;

    driverSteps.push({
      element: '[data-tour="logo"]',
      popover: {
        title: $localize`:@@appTour.title.welcome:Welcome to Lumeer`,
        description:
          this.getStepCounter(stepNo++, totalSteps) +
          $localize`:@@appTour.description.welcome:Let me guide you around briefly! By clicking on the Lumeer icon, you can always return to this page where you can best find and access your stored data.`,
        position: 'right',
      },
    });

    if (viewsCount === 0) {
      if (collectionsCount === 0) {
        // views = 0, collections = 0
        driverSteps.push({
          element: '[data-tour="collection-create"]',
          popover: {
            title: basicTitle,
            description: this.getStepCounter(stepNo++, totalSteps) + basicDescription,
            position: 'top',
          },
        });
      } else {
        // views = 0, collections > 0
        driverSteps.push({
          element: '[data-tour="search-views"]',
          popover: {
            title: $localize`:@@appTour.title.searchViewsNoView:Create views of your data`,
            description:
              this.getStepCounter(stepNo++, totalSteps) +
              $localize`:@@appTour.description.searchViewsNoView:Views are the central nerve of Lumeer. They are the main booster of your productivity and save your precious time. Your first task is to create a View!`,
            position: 'top',
          },
        });

        driverSteps.push({
          element: '[data-tour="collection-add"]',
          popover: {
            title: basicTitle,
            description: this.getStepCounter(stepNo++, totalSteps) + basicDescription,
            position: 'top',
          },
        });
      }
    } else {
      // views > 0, collections?
      driverSteps.push({
        element: '[data-tour="search-views-label"]',
        popover: {
          title: basicTitle,
          description:
            this.getStepCounter(stepNo++, totalSteps) +
            $localize`:@@appTour.description.searchViews:Views are the central nerve of Lumeer. These are pre-configured ways to see your data. Try opening them!`,
          position: 'bottom',
        },
      });

      driverSteps.push({
        element: '[data-tour="tables-tab"]',
        popover: {
          title: $localize`:@@appTour.title.tablesView:See the tables`,
          description:
            this.getStepCounter(stepNo++, totalSteps) +
            $localize`:@@appTour.description.tablesTab:The raw data are stored in Tables which can be accessed on their own tab.`,
          position: 'right',
        },
      });
    }

    driverSteps.push({
      element: '[data-tour="search-box"]',
      popover: {
        title: $localize`:@@appTour.title.search:Search for information`,
        description:
          this.getStepCounter(stepNo++, totalSteps) +
          $localize`:@@appTour.description.search:The best way to locate your stored information is to search for it. Lumeer will guide you, just start typing in the search box.`,
        position: 'bottom',
      },
    });

    driverSteps.push({
      element: '[data-tour="perspective"]',
      popover: {
        title: $localize`:@@appTour.title.perspectives:Perspectives`,
        description:
          this.getStepCounter(stepNo++, totalSteps) +
          $localize`:@@appTour.description.perspectives:When you open your table or search results, try selecting a different visual perspective. Update an event in a calendar, plan tasks in timelines, track addresses on a map, drag point in a chart, create a pivot table report and more.`,
        position: 'bottom',
      },
    });

    driverSteps.push({
      element: '[data-tour="view"]',
      popover: {
        title: $localize`:@@appTour.title.views:Views and sharing`,
        description:
          this.getStepCounter(stepNo++, totalSteps) +
          $localize`:@@appTour.description.views:Once you fine tune your visual perspective, give it a name and save it. Later you can access the stored view on the home page or you can share the view with your colleagues.`,
        position: 'bottom',
      },
    });

    driverSteps.push({
      element: '[data-tour="get-help-button"]',
      popover: {
        title: $localize`:@@appTour.title.getHelp:Help with Lumeer`,
        description:
          this.getStepCounter(stepNo++, totalSteps) +
          $localize`:@@appTour.description.getHelp:Here you can always get help in case you got lost.`,
        position: 'top-right',
      },
    });

    driverSteps.push({
      element: '[data-tour="user-menu"]',
      popover: {
        title: $localize`:@@appTour.title.userMenu:Return to this Tour`,
        description:
          this.getStepCounter(stepNo++, totalSteps) +
          $localize`:@@appTour.description.userMenu:You can always return to this tour and find more information in our knowledge base which can be accessed in the user menu.`,
        position: 'left',
      },
    });

    this.driver.defineSteps(driverSteps);
  }

  @HostListener('document:click', ['$event'])
  public onClick(event: MouseEvent): void {
    const element = event.target as HTMLElement;
    if (
      !this.starting &&
      this.driver.isActivated &&
      (!element.id || element.id.indexOf('driver') < 0) &&
      (!element.className || element.className.indexOf('driver') < 0)
    ) {
      this.dismissWizard();
      this.driver.reset(true);
    }
  }

  public onHintsToggle($event: boolean) {
    this.store$.dispatch(new UsersAction.SetHint({hint: UserHintsKeys.applicationHints, value: $event}));
  }

  public onSettings() {
    const config = {initialState: {}, keyboard: true};
    config['backdrop'] = 'static';
    this.modalService.show(UserSettingsModalComponent, config);
  }
}
