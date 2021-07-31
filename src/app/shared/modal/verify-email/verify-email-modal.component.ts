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

import {ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {DialogType} from '../dialog-type';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {User} from '../../../core/store/users/user';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {selectCurrentUser} from '../../../core/store/users/users.state';
import {filter, first} from 'rxjs/operators';
import {UsersAction} from '../../../core/store/users/users.action';
import {BehaviorSubject, Subscription} from 'rxjs';

@Component({
  selector: 'verify-email-modal',
  templateUrl: './verify-email-modal.component.html',
  styleUrls: ['./verify-email-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailModalComponent implements OnInit, OnDestroy {
  @Input()
  public user: User;

  public emailSent$ = new BehaviorSubject(0);

  public performingAction$ = new BehaviorSubject(false);

  public readonly dialogType = DialogType;

  private subscription: Subscription;

  public constructor(private bsModalRef: BsModalRef, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.subscription = this.store$
      .pipe(
        select(selectCurrentUser),
        filter(user => !!user && user.emailVerified),
        first()
      )
      .subscribe(user => this.hideDialog());
  }

  private hideDialog(): void {
    this.bsModalRef.hide();
  }

  public reloadUser(): void {
    this.performingAction$.next(true);
    this.store$.dispatch(
      new UsersAction.GetCurrentUser({
        onSuccess: () => setTimeout(() => this.performingAction$.next(false), 1000),
        onFailure: () => setTimeout(() => this.performingAction$.next(false), 1000),
      })
    );
  }

  public sendEmail(): void {
    this.emailSent$.next(1);
    this.store$.dispatch(
      new UsersAction.ResendVerificationEmail({
        onSuccess: () => this.emailSent$.next(3),
        onFailure: () => this.emailSent$.next(2),
      })
    );
  }

  public ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
