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
import * as Driver from 'driver.js';
import {combineLatest, filter, Observable, switchMap} from 'rxjs';
import {Workspace} from '../store/navigation/workspace';
import {AppState} from '../store/app.state';
import {ModalService} from '../../shared/modal/modal.service';
import {selectUrl, selectWorkspace} from '../store/navigation/navigation.state';
import {map, take} from 'rxjs/operators';
import {User} from '../store/users/user';
import {selectCurrentUser} from '../store/users/users.state';
import {selectAllCollectionsCount} from '../store/collections/collections.state';
import {selectAllViewsCount} from '../store/views/views.state';
import {selectProjectPermissions} from '../store/user-permissions/user-permissions.state';
import {Perspective} from '../../view/perspectives/perspective';
import {SearchTab} from '../store/navigation/search-tab';
import {NotificationsAction} from '../store/notifications/notifications.action';
import {UsersAction} from '../store/users/users.action';
import {AllowedPermissions} from '../model/allowed-permissions';
import {AppPropertiesAction} from '../store/app-properties/app-properties.action';
import {scrollToTopInSearchPerspective} from '../../shared/utils/app.utils';

@Injectable({providedIn: 'root'})
export class ApplicationTourService {
  private starting: boolean;
  private dismissing: boolean;
  private tourDone: boolean;
  private driver: Driver;
  private workspace: Workspace;

  constructor(private store$: Store<AppState>, private router: Router, private modalService: ModalService) {}

  public init() {
    const scrollIntoViewOptions: ScrollIntoViewOptions = {behavior: 'auto', block: 'start'};
    this.driver = new Driver({
      animate: true,
      opacity: 0.5,
      allowClose: false,
      overlayClickNext: true,
      scrollIntoViewOptions,
      closeBtnText: $localize`:@@button.dismiss:Dismiss`,
      doneBtnText: $localize`:@@button.onward:Onward!`,
      nextBtnText: $localize`:@@button.next:Next`,
      prevBtnText: $localize`:@@button.previous:Previous`,
      onReset: () => this.dismissWizard(),
      onNext: () => this.onNextStep(),
      onHighlightStarted: element => (element.getNode() as HTMLElement)?.scrollIntoView(scrollIntoViewOptions),
    });

    combineLatest([this.observeWizardStartUser$(), this.selectTourData$(), this.store$.pipe(select(selectUrl))])
      .pipe(
        filter(([, , url]) => isViewSearchAll(url)),
        take(1)
      )
      .subscribe(([user, data]) => this.startTour(user, false, data));

    this.store$.pipe(select(selectWorkspace)).subscribe(workspace => (this.workspace = workspace));
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

  public restartTour() {
    combineLatest([this.store$.pipe(select(selectCurrentUser)), this.selectTourData$()])
      .pipe(take(1))
      .subscribe(([user, data]) => this.startTour(user, true, data));
  }

  private selectTourData$(): Observable<TourData> {
    return combineLatest([
      this.store$.pipe(select(selectAllCollectionsCount)),
      this.store$.pipe(select(selectAllViewsCount)),
      this.store$.pipe(select(selectProjectPermissions)),
    ]).pipe(map(([collectionsCount, viewsCount, permissions]) => ({collectionsCount, viewsCount, permissions})));
  }

  private startTour(user: User, manual: boolean, data: TourData) {
    if (!this.starting && !this.dismissing) {
      this.starting = true;

      if (manual) {
        // we need to make sure to be on the home page
        const organizationCode = this.workspace?.organizationCode || user.defaultWorkspace?.organizationCode;
        const projectCode = this.workspace?.projectCode || user.defaultWorkspace?.projectCode;

        if (organizationCode && projectCode) {
          this.router
            .navigate(['/', 'w', organizationCode, projectCode, 'view', Perspective.Search, SearchTab.All])
            .then(() => {
              this.log('Tour recall');
              this.kickstartTour(data);
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
        this.kickstartTour(data);
      }
    }
  }

  private kickstartTour(data: TourData) {
    this.store$.dispatch(new AppPropertiesAction.OpenTopPanel());

    setTimeout(() => {
      // trick to allow access to all document elements
      this.driver.reset(true);
      this.defineSteps(data);
      this.scrollToTop();

      this.log('Tour started');

      this.driver.start();
      this.starting = false;
      this.tourDone = false;
    }, 500);
  }

  private scrollToTop() {
    scrollToTopInSearchPerspective();
  }

  private dismissWizard() {
    if (!this.starting && !this.dismissing) {
      this.dismissing = true;

      if (this.tourDone) {
        this.log('Tour done');
      } else {
        this.log('Tour dismissed');
      }

      this.patchWizardDismissed();
    }
  }

  private patchWizardDismissed() {
    this.store$.pipe(select(selectCurrentUser), take(1)).subscribe(currentUser => {
      if (!currentUser.wizardDismissed) {
        this.store$.dispatch(
          new UsersAction.PatchCurrentUser({
            user: {wizardDismissed: true},
            onSuccess: () => (this.dismissing = false),
            onFailure: () => (this.dismissing = false),
          })
        );
      }
    });
  }

  private log(event: string) {
    this.store$.dispatch(new UsersAction.LogEvent({event}));
  }

  private defineSteps(data: TourData) {
    const totalSteps = this.createSteps(data).length;
    const driverSteps = this.createSteps(data, totalSteps);

    this.driver.defineSteps(driverSteps);
  }

  private createSteps(data: TourData, totalSteps?: number): Driver.Step[] {
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

    if (data.viewsCount === 0 && data.collectionsCount === 0 && data.permissions?.roles?.CollectionContribute) {
      driverSteps.push({
        element: '[data-tour="collection-create"]',
        popover: {
          title: basicTitle,
          description: stepCounterString(stepNo++, totalSteps) + basicDescription,
          position: 'top',
        },
      });
    }

    if (data.viewsCount === 0 && data.collectionsCount > 0) {
      if (data.permissions?.roles?.ViewContribute) {
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
      }

      if (data.permissions?.roles?.CollectionContribute) {
        driverSteps.push({
          element: '[data-tour="collection-add"]',
          popover: {
            title: basicTitle,
            description: stepCounterString(stepNo++, totalSteps) + basicDescription,
            position: 'top',
          },
        });
      }
    }

    if (data.viewsCount > 0) {
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
    }

    if (data.viewsCount > 0 && data.collectionsCount > 0) {
      driverSteps.push({
        element: '[data-tour="tab-tables"]',
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

    if (data.permissions?.roles?.ViewContribute) {
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
    }

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

    if (data.permissions?.roles?.UserConfig) {
      driverSteps.push({
        element: '[data-tour="invite-users"]',
        popover: {
          title: $localize`:@@appTour.title.inviteUsers:Invite teammates`,
          description:
            stepCounterString(stepNo++, totalSteps) +
            $localize`:@@appTour.description.inviteUsers:Working together can make difference. Invite teammates and boost your productivity.`,
          position: 'left',
        },
      });
    }

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

    return driverSteps;
  }

  public checkDismiss() {
    if (!this.starting && this.driver.isActivated) {
      this.dismissWizard();
      this.driver.reset(true);
    }
  }

  private onNextStep() {
    this.tourDone = this.driver.hasNextStep();
  }
}

function isViewSearchAll(url: string): boolean {
  const [urlPrefix] = url.split('?');
  return urlPrefix.includes('view/search/all');
}

function stepCounterString(stepNo: number, totalSteps: number): string {
  return '(' + stepNo + '/' + totalSteps + ') ';
}

interface TourData {
  collectionsCount: number;
  viewsCount: number;
  permissions: AllowedPermissions;
}
