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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs';
import {filter} from 'rxjs/operators';
import {environment} from '../../../environments/environment';
import {AppState} from '../../core/store/app.state';
import {UsersAction} from '../../core/store/users/users.action';
import {selectCurrentUser} from '../../core/store/users/users.state';
import {AuthService} from '../auth.service';

const termsOfServiceLinks = {
  cs: 'http://www.lumeer.io/terms_service_cz.html',
  en: 'http://www.lumeer.io/terms_service.html',
};

const privacyPolicyLinks = {
  cs: 'http://www.lumeer.io/privacy_cz.html',
  en: 'http://www.lumeer.io/privacy.html',
};

const dataProcessingAgreementLinks = {
  cs: 'http://www.lumeer.io/agree_news_cz.html',
  en: 'http://www.lumeer.io/agree_news.html',
};

@Component({
  selector: 'agreement',
  templateUrl: './agreement.component.html',
  styleUrls: ['./agreement.component.scss'],
})
export class AgreementComponent implements OnInit, OnDestroy {
  public readonly agreementName = 'agreement';
  public readonly newsletterName = 'newsletter';

  public readonly termsOfServiceLink = termsOfServiceLinks[environment.locale];
  public readonly privacyPolicyLink = privacyPolicyLinks[environment.locale];
  public readonly dataProcessingAgreementLink = dataProcessingAgreementLinks[environment.locale];

  public form = new FormGroup({
    [this.agreementName]: new FormControl(false, Validators.requiredTrue),
    [this.newsletterName]: new FormControl(false),
  });

  public loading: boolean;

  private subscriptions = new Subscription();

  public constructor(private authService: AuthService, private router: Router, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.subscriptions.add(
      this.store$
        .select(selectCurrentUser)
        .pipe(filter(user => !!user))
        .subscribe(user => {
          this.agreement.setValue(user.agreement);
          this.newsletter.setValue(user.newsletter);
        })
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onSubmit() {
    if (this.form.invalid) {
      return;
    }

    this.sendAgreement();
  }

  private sendAgreement() {
    this.loading = true;

    this.store$.dispatch(
      new UsersAction.PatchCurrentUser({
        user: {
          agreement: this.agreement.value,
          newsletter: this.newsletter.value,
        },
        onSuccess: () => this.onSuccess(),
        onFailure: () => this.onFailure(),
      })
    );
  }

  private onSuccess() {
    this.loading = false;
    this.navigateToApplication();
  }

  private navigateToApplication() {
    const path = this.authService.getLoginRedirectPath();
    this.router.navigate([path]);
  }

  private onFailure() {
    this.loading = false;
  }

  public get agreement(): AbstractControl {
    return this.form.get(this.agreementName);
  }

  public get newsletter(): AbstractControl {
    return this.form.get(this.newsletterName);
  }
}
