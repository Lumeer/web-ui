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
import {ChangeDetectionStrategy, Component, HostListener, Input} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {combineLatest, Observable, timer} from 'rxjs';
import {User} from '../../../../core/store/users/user';
import {environment} from '../../../../../environments/environment';
import {AuthService} from '../../../../auth/auth.service';
import {AppState} from '../../../../core/store/app.state';
import {selectUrl} from '../../../../core/store/navigation/navigation.state';
import {DialogService} from '../../../../dialog/dialog.service';
import {selectCurrentUser} from '../../../../core/store/users/users.state';
import {ServiceLimitsAction} from '../../../../core/store/organizations/service-limits/service-limits.action';
import {selectServiceLimitsByWorkspace} from '../../../../core/store/organizations/service-limits/service-limits.state';
import {filter, first, map} from 'rxjs/operators';
import {ServiceLevelType} from '../../../../core/dto/service-level-type';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {Router} from '@angular/router';
import * as Driver from 'driver.js';
import {UsersAction} from '../../../../core/store/users/users.action';
import {selectAllCollections} from '../../../../core/store/collections/collections.state';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {NotificationsAction} from '../../../../core/store/notifications/notifications.action';
import PatchCurrentUser = UsersAction.PatchCurrentUser;
import {selectAllViews} from '../../../../core/store/views/views.state';

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

  public currentUser$: Observable<User>;
  public url$: Observable<string>;
  public freePlan$: Observable<boolean>;

  private starting: boolean = false;
  private dismissing: boolean = false;
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
      closeBtnText: this.i18n({
        id: 'button.dismiss',
        value: 'Dismiss',
      }),
      doneBtnText: this.i18n({
        id: 'button.onward',
        value: 'Onward!',
      }),
      onReset: () => this.dismissWizard(),
    });

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
        filter(([timerVal, user, collections, views, url]) => this.isViewSearchAll(url)),
        filter(([timerVal, user, collections, views, url]) => !user.wizardDismissed),
        first()
      )
      .subscribe(([timerVal, user, collections, views, url]) =>
        this.startTour(false, collections.length, views.length)
      );
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

    combineLatest(this.store$.pipe(select(selectAllCollections)), this.store$.pipe(select(selectAllViews)))
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
            const organizationCode =
              this.workspace.organizationCode || (user.defaultWorkspace && user.defaultWorkspace.organizationCode);
            const projectCode =
              this.workspace.projectCode || (user.defaultWorkspace && user.defaultWorkspace.projectCode);

            if (organizationCode && projectCode) {
              this.router.navigate(['/', 'w', organizationCode, projectCode, 'view', 'search', 'all']).then(() => {
                this.kickstartTour(collectionsCount, viewsCount);
              });
            } else {
              this.store$.dispatch(
                new NotificationsAction.Error({
                  message: this.i18n({
                    id: 'menu.appTour.invocationError',
                    value:
                      'Could not invoke application tour because I did not find any recent project to work with. Go to a page with project content and try again please.',
                  }),
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
    setTimeout(() => {
      // trick to allow access to all document elements
      this.driver.reset(true);
      this.defineSteps(collectionsCount, viewsCount);
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
    const totalSteps = viewsCount > 0 ? 8 : 7;
    let stepNo = 1;

    const welcomeTitle = this.i18n({
      id: 'appTour.title.welcome',
      value: 'Welcome to Lumeer',
    });
    const welcomeDescription = this.i18n({
      id: 'appTour.description.welcome',
      value:
        'Lumeer organizes your information in tables (i.e. categories) of similar records. Later, you can use this button to add your first table. Then you can open the table by simply clicking on it.',
    });

    const driverSteps = [];

    if (viewsCount === 0) {
      if (collectionsCount === 0) {
        // views = 0, collections = 0
        driverSteps.push({
          element: '[data-tour="collection-create"]',
          popover: {
            title: welcomeTitle,
            description: this.getStepCounter(stepNo++, totalSteps) + welcomeDescription,
            position: 'bottom',
          },
        });
      } else {
        // views = 0, collections > 0
        driverSteps.push({
          element: '[data-tour="collection-add"]',
          popover: {
            title: welcomeTitle,
            description: this.getStepCounter(stepNo++, totalSteps) + welcomeDescription,
            position: 'right',
          },
        });
      }
    } else {
      // views > 0, collections?
      driverSteps.push({
        element: '[data-tour="search-views"]',
        popover: {
          title: welcomeTitle,
          description:
            this.getStepCounter(stepNo++, totalSteps) +
            this.i18n({
              id: 'appTour.description.searchViews',
              value:
                'Views are the central nerve of Lumeer. These are pre-configured ways to see your data. Try opening them!',
            }),
          position: 'top',
        },
      });
      driverSteps.push({
        element: '[data-tour="tables-tab"]',
        popover: {
          title: this.i18n({
            id: 'appTour.title.tablesView',
            value: 'See the tables',
          }),
          description:
            this.getStepCounter(stepNo++, totalSteps) +
            this.i18n({
              id: 'appTour.description.tablesTab',
              value: 'The raw data are stored in Tables which can be accessed on their own tab.',
            }),
          position: 'right',
        },
      });
    }

    driverSteps.push({
      element: '[data-tour="logo"]',
      popover: {
        title: this.i18n({
          id: 'appTour.title.home',
          value: 'Get home',
        }),
        description:
          this.getStepCounter(stepNo++, totalSteps) +
          this.i18n({
            id: 'appTour.description.home',
            value:
              'By clicking on the Lumeer icon, you can always return to this page where you can best find and access your stored data.',
          }),
        position: 'right',
      },
    });

    driverSteps.push({
      element: '[data-tour="search-box"]',
      popover: {
        title: this.i18n({
          id: 'appTour.title.search',
          value: 'Search for information',
        }),
        description:
          this.getStepCounter(stepNo++, totalSteps) +
          this.i18n({
            id: 'appTour.description.search',
            value:
              'The best way to locate your stored information is to search for it. Lumeer will guide you, just start typing in the search box.',
          }),
        position: 'bottom',
      },
    });

    driverSteps.push({
      element: '[data-tour="perspective"]',
      popover: {
        title: this.i18n({
          id: 'appTour.title.perspectives',
          value: 'Perspectives',
        }),
        description:
          this.getStepCounter(stepNo++, totalSteps) +
          this.i18n({
            id: 'appTour.description.perspectives',
            value:
              'When you open your table or search results, try selecting a different visual perspective. Update an event in a calendar, plan tasks in timelines, track addresses on a map, drag point in a chart, create a pivot table report and more.',
          }),
        position: 'right',
      },
    });

    driverSteps.push({
      element: '[data-tour="view"]',
      popover: {
        title: this.i18n({
          id: 'appTour.title.views',
          value: 'Views and sharing',
        }),
        description:
          this.getStepCounter(stepNo++, totalSteps) +
          this.i18n({
            id: 'appTour.description.views',
            value:
              'Once you fine tune your visual perspective, give it a name and save it. Later you can access the stored view on the home page or you can share the view with your colleagues.',
          }),
        position: 'bottom',
      },
    });

    driverSteps.push({
      element: '[data-tour="video-menu"]',
      popover: {
        title: this.i18n({
          id: 'appTour.title.videos',
          value: 'Help with Lumeer',
        }),
        description:
          this.getStepCounter(stepNo++, totalSteps) +
          this.i18n({
            id: 'appTour.description.videos',
            value: 'Here you can find a list of one-minute videos that explain controls on each page.',
          }),
        position: 'left',
      },
    });

    driverSteps.push({
      element: '[data-tour="user-menu"]',
      popover: {
        title: this.i18n({
          id: 'appTour.title.userMenu',
          value: 'Return to this Tour',
        }),
        description:
          this.getStepCounter(stepNo, totalSteps) +
          this.i18n({
            id: 'appTour.description.userMenu',
            value:
              'You can always return to this tour and find more information in our knowledge base which can be accessed in the user menu.',
          }),
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
}
