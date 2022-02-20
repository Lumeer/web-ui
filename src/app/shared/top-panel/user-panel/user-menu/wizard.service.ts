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
import {Router} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../../core/store/app.state';
import * as Driver from 'driver.js';
import {combineLatest, Observable, switchMap} from 'rxjs';
import {selectCurrentUser} from '../../../../core/store/users/users.state';
import {selectAllCollections} from '../../../../core/store/collections/collections.state';
import {selectAllViews} from '../../../../core/store/views/views.state';
import {selectUrl} from '../../../../core/store/navigation/navigation.state';
import {filter, first, map} from 'rxjs/operators';
import {User} from '../../../../core/store/users/user';
import {Perspective} from '../../../../view/perspectives/perspective';
import {SearchTab} from '../../../../core/store/navigation/search-tab';
import {NotificationsAction} from '../../../../core/store/notifications/notifications.action';
import {UsersAction} from '../../../../core/store/users/users.action';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {ModalService} from '../../../modal/modal.service';

@Injectable()
export class WizardService {
  private starting = false;
  private driver: Driver;
  private dismissing = false;
  private workspace: Workspace;
  private onStart: () => void;

  constructor(private store$: Store<AppState>, private router: Router, private modalService: ModalService) {}

  public init() {
    this.driver = new Driver({
      opacity: 0.5,
      scrollIntoViewOptions: {block: 'start'},
      closeBtnText: $localize`:@@button.dismiss:Dismiss`,
      doneBtnText: $localize`:@@button.onward:Onward!`,
      nextBtnText: $localize`:@@button.next:Next`,
      prevBtnText: $localize`:@@button.previous:Previous`,
      onReset: () => this.dismissWizard(),
    });

    combineLatest([
      this.observeWizardStartUser$(),
      this.store$.pipe(select(selectAllCollections)),
      this.store$.pipe(select(selectAllViews)),
      this.store$.pipe(select(selectUrl)),
    ])
      .pipe(
        filter(([user, collections, views, url]) => !!user && !!collections && !!views && !!url),
        filter(([, , , url]) => isViewSearchAll(url)),
        first()
      )
      .subscribe(([user, collections, views]) => this.startTour(user, false, collections.length, views.length));
  }

  private observeWizardStartUser$(): Observable<User> {
    return this.store$.pipe(
      select(selectCurrentUser),
      filter(user => user && !user.wizardDismissed && user.emailVerified && user.onboarding?.videoShowed),
      switchMap(user =>
        this.modalService.isSomeModalOpened$().pipe(
          filter(opened => !opened),
          map(() => user)
        )
      )
    );
  }

  public setWorkspace(workspace: Workspace) {
    this.workspace = workspace;
  }

  public setOnStart(onStart: () => void) {
    this.onStart = onStart;
  }

  public restartTour() {
    this.recallWizard();

    combineLatest([
      this.store$.pipe(select(selectCurrentUser)),
      this.store$.pipe(select(selectAllCollections)),
      this.store$.pipe(select(selectAllViews)),
    ])
      .pipe(
        filter(([, collections, views]) => !!collections && !!views),
        first()
      )
      .subscribe(([user, collections, views]) => this.startTour(user, true, collections.length, views.length));
  }

  private startTour(user: User, manual: boolean, collectionsCount: number, viewsCount: number) {
    if (!this.starting && !this.dismissing) {
      this.starting = true;

      if (manual) {
        // we need to make sure to be on the home page
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
      } else {
        // we already checked the url
        this.kickstartTour(collectionsCount, viewsCount);
      }
    }
  }

  private kickstartTour(collectionsCount: number, viewsCount: number) {
    this.onStart?.();

    setTimeout(() => {
      // trick to allow access to all document elements
      this.driver.reset(true);
      this.defineSteps(collectionsCount, viewsCount);

      document.getElementsByClassName('search-perspective')?.[0]?.scrollTo(0, 0);

      this.driver.start();
      this.starting = false;
    }, 500);
  }

  private dismissWizard() {
    if (!this.starting && !this.dismissing) {
      this.dismissing = true;
      this.store$.dispatch(
        new UsersAction.PatchCurrentUser({
          user: {wizardDismissed: true},
          onSuccess: () => (this.dismissing = false),
          onFailure: () => (this.dismissing = false),
        })
      );
    }
  }

  private recallWizard() {
    if (!this.dismissing) {
      this.store$.dispatch(
        new UsersAction.PatchCurrentUser({
          user: {wizardDismissed: false},
        })
      );
    }
  }

  private defineSteps(collectionsCount: number, viewsCount: number) {
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
          stepCounterString(stepNo++, totalSteps) +
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
            description: stepCounterString(stepNo++, totalSteps) + basicDescription,
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
              stepCounterString(stepNo++, totalSteps) +
              $localize`:@@appTour.description.searchViewsNoView:Views are the central nerve of Lumeer. They are the main booster of your productivity and save your precious time. Your first task is to create a View!`,
            position: 'top',
          },
        });

        driverSteps.push({
          element: '[data-tour="collection-add"]',
          popover: {
            title: basicTitle,
            description: stepCounterString(stepNo++, totalSteps) + basicDescription,
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
            stepCounterString(stepNo++, totalSteps) +
            $localize`:@@appTour.description.searchViews:Views are the central nerve of Lumeer. These are pre-configured ways to see your data. Try opening them!`,
          position: 'bottom',
        },
      });

      driverSteps.push({
        element: '[data-tour="tables-tab"]',
        popover: {
          title: $localize`:@@appTour.title.tablesView:See the tables`,
          description:
            stepCounterString(stepNo++, totalSteps) +
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
          stepCounterString(stepNo++, totalSteps) +
          $localize`:@@appTour.description.search:The best way to locate your stored information is to search for it. Lumeer will guide you, just start typing in the search box.`,
        position: 'bottom',
      },
    });

    driverSteps.push({
      element: '[data-tour="perspective"]',
      popover: {
        title: $localize`:@@appTour.title.perspectives:Perspectives`,
        description:
          stepCounterString(stepNo++, totalSteps) +
          $localize`:@@appTour.description.perspectives:When you open your table or search results, try selecting a different visual perspective. Update an event in a calendar, plan tasks in timelines, track addresses on a map, drag point in a chart, create a pivot table report and more.`,
        position: 'bottom',
      },
    });

    driverSteps.push({
      element: '[data-tour="view"]',
      popover: {
        title: $localize`:@@appTour.title.views:Views and sharing`,
        description:
          stepCounterString(stepNo++, totalSteps) +
          $localize`:@@appTour.description.views:Once you fine tune your visual perspective, give it a name and save it. Later you can access the stored view on the home page or you can share the view with your colleagues.`,
        position: 'bottom',
      },
    });

    driverSteps.push({
      element: '[data-tour="get-help-button"]',
      popover: {
        title: $localize`:@@appTour.title.getHelp:Help with Lumeer`,
        description:
          stepCounterString(stepNo++, totalSteps) +
          $localize`:@@appTour.description.getHelp:Here you can always get help in case you got lost.`,
        position: 'top-right',
      },
    });

    driverSteps.push({
      element: '[data-tour="user-menu"]',
      popover: {
        title: $localize`:@@appTour.title.userMenu:Return to this Tour`,
        description:
          stepCounterString(stepNo++, totalSteps) +
          $localize`:@@appTour.description.userMenu:You can always return to this tour and find more information in our knowledge base which can be accessed in the user menu.`,
        position: 'left',
      },
    });

    this.driver.defineSteps(driverSteps);
  }

  public checkDismiss() {
    if (!this.starting && this.driver.isActivated) {
      this.dismissWizard();
      this.driver.reset(true);
    }
  }
}

function isViewSearchAll(url: string): boolean {
  const [urlPrefix] = url.split('?');
  return urlPrefix.includes('view/search/all');
}

function stepCounterString(stepNo: number, totalSteps: number): string {
  return '(' + stepNo + '/' + totalSteps + ') ';
}
