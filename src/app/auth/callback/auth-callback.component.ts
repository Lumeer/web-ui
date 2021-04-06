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

import {animate, state, style, transition, trigger} from '@angular/animations';
import {AfterViewChecked, Component, ElementRef, HostListener, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {filter, take} from 'rxjs/operators';
import {AppState} from '../../core/store/app.state';
import {selectCurrentUser} from '../../core/store/users/users.state';
import {AuthService} from '../auth.service';
import {ModalsAction} from '../../core/store/modals/modals.action';

@Component({
  selector: 'auth-callback',
  templateUrl: './auth-callback.component.html',
  styleUrls: ['./auth-callback.component.scss'],
  animations: [
    trigger('slowlyShow', [
      state('shown', style({opacity: 1})),
      transition('void => *', [style({opacity: 0}), animate('3s 5s ease-in-out')]),
    ]),
  ],
})
export class AuthCallbackComponent implements OnInit, AfterViewChecked {
  public constructor(
    private authService: AuthService,
    private element: ElementRef,
    private router: Router,
    private store$: Store<AppState>
  ) {}

  public ngOnInit() {
    this.store$.dispatch(new ModalsAction.Hide());

    if (this.authService.isAuthenticated()) {
      this.navigateToApplication();
      return;
    }

    this.store$
      .select(selectCurrentUser)
      .pipe(
        filter(user => !!user),
        take(1)
      )
      .subscribe(() => this.navigateToApplication());
  }

  private navigateToApplication() {
    const path = this.authService.getAndClearLoginRedirectPath();
    if (path) {
      this.router.navigateByUrl(path);
    } else {
      this.router.navigate(['/']);
    }
  }

  public ngAfterViewChecked() {
    this.setAuthCallbackOffsetTop();
  }

  @HostListener('window:resize')
  public onWindowResize() {
    this.setAuthCallbackOffsetTop();
  }

  private setAuthCallbackOffsetTop() {
    const element = this.element.nativeElement as HTMLElement;
    element.style.setProperty('--auth-callback-offset-top', `${element.offsetTop}px`);
  }
}
