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

import {ChangeDetectionStrategy, Component, HostListener, OnInit} from '@angular/core';
import {LanguageCode} from '../../core/model/language';
import {ConfigurationService} from '../../configuration/configuration.service';
import {BehaviorSubject, combineLatest, Observable, switchMap} from 'rxjs';
import {ApplicationTourService} from '../../core/service/application-tour.service';
import {ModalService} from '../modal/modal.service';
import {AppState} from '../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectCurrentUser} from '../../core/store/users/users.state';
import {distinctUntilChanged, map, take} from 'rxjs/operators';
import {ButtonState, rotateAnimation, scaleAnimation, shrinkOutAnimation} from './model/get-help.utils';
import {NewsletterToggleService} from './model/newsletter-toggle.service';
import {clickedInsideElement} from '../utils/html-modifier';
import {UsersAction} from '../../core/store/users/users.action';

@Component({
  selector: 'get-help',
  templateUrl: './get-help.component.html',
  styleUrls: ['./get-help.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [shrinkOutAnimation, rotateAnimation, scaleAnimation],
  providers: [NewsletterToggleService],
})
export class GetHelpComponent implements OnInit {
  public link: string;
  public buttonState = ButtonState;

  public mouseEntered$ = new BehaviorSubject(false);
  public extendedContent$ = new BehaviorSubject(false);

  public showNewsletter$: Observable<boolean>;
  public buttonState$: Observable<ButtonState>;

  constructor(
    private configurationService: ConfigurationService,
    private wizardService: ApplicationTourService,
    private modalService: ModalService,
    private store$: Store<AppState>,
    private newsletterToggleService: NewsletterToggleService
  ) {}

  public ngOnInit() {
    if (this.configurationService.getConfiguration().locale === LanguageCode.CZ) {
      this.link = 'https://www.lumeer.io/cs/pomoc';
    } else {
      this.link = 'https://www.lumeer.io/get-help';
    }

    this.showNewsletter$ = this.store$.pipe(
      select(selectCurrentUser),
      map(currentUser => !currentUser?.newsletter),
      take(1)
    );

    this.buttonState$ = this.store$.pipe(
      select(selectCurrentUser),
      map(currentUser => currentUser?.onboarding?.helpOpened),
      distinctUntilChanged(),
      // take(1),
      switchMap(helpOpened =>
        combineLatest([this.extendedContent$, this.mouseEntered$]).pipe(
          map(([extended, mouseEntered]) => {
            if (extended) {
              return ButtonState.Open;
            }

            if (helpOpened) {
              if (mouseEntered) {
                return ButtonState.Entered;
              } else {
                return ButtonState.Compact;
              }
            }

            return ButtonState.Closed;
          })
        )
      )
    );
  }

  public openTour() {
    this.toggleContent();
    this.wizardService.restartTour();
  }

  public openVideo() {
    this.toggleContent();
    this.modalService.showOnboardingVideoDialog();
  }

  public openGetInTouch() {
    this.toggleContent();
    this.modalService.showGetInTouchDialog();
  }

  public openBookDemo() {
    this.toggleContent();
    this.modalService.showBookProductDemoDialog();
  }

  public toggleContent() {
    this.extendedContent$.next(!this.extendedContent$.value);
    this.checkPatchUser(this.extendedContent$.value);
  }

  private checkPatchUser(opened: boolean) {
    if (!opened) {
      return;
    }
    this.store$.pipe(select(selectCurrentUser), take(1)).subscribe(currentUser => {
      if (!currentUser?.onboarding?.helpOpened) {
        this.store$.dispatch(new UsersAction.SetOnboarding({key: 'helpOpened', value: true}));
      }
    });
  }

  public onNewsletterChange(checked: boolean) {
    this.newsletterToggleService.set('', checked);
  }

  @HostListener('document:click', ['$event'])
  private onClick(event: MouseEvent) {
    if (this.extendedContent$.value && !clickedInsideElement(event, 'get-help')) {
      this.toggleContent();
    }
  }
}
