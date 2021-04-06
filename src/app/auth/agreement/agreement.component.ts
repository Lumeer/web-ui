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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs';
import {filter} from 'rxjs/operators';
import {AppState} from '../../core/store/app.state';
import {UsersAction} from '../../core/store/users/users.action';
import {selectCurrentUser} from '../../core/store/users/users.state';
import {AuthService} from '../auth.service';
import {ModalsAction} from '../../core/store/modals/modals.action';
import {ConfigurationService} from '../../configuration/configuration.service';
import {LanguageCode} from '../../shared/top-panel/user-panel/user-menu/language';

const termsOfServiceLinks = {
  cs: 'https://www.lumeer.io/cs/vseobecne-obchodni-podminky/',
  en: 'https://www.lumeer.io/terms-of-service/',
};

const privacyPolicyLinks = {
  cs: 'https://www.lumeer.io/cs/zasady-ochrany-osobnich-udaju/',
  en: 'https://www.lumeer.io/privacy-statement/',
};

const dataProcessingAgreementLinks = {
  cs: 'https://www.lumeer.io/cs/souhlas-se-zpracovanim-osobnich-udaju-novinky/',
  en: 'https://www.lumeer.io/agreement-with-personal-information-processing-news/',
};

@Component({
  selector: 'agreement',
  templateUrl: './agreement.component.html',
  styleUrls: ['./agreement.component.scss'],
})
export class AgreementComponent implements OnInit, OnDestroy {
  public readonly agreementName = 'agreement';
  public readonly newsletterName = 'newsletter';

  public readonly termsOfServiceLink: string;
  public readonly privacyPolicyLink: string;
  public readonly dataProcessingAgreementLink: string;

  public stage = 0;

  public form = new FormGroup({
    [this.agreementName]: new FormControl(false, Validators.requiredTrue),
    [this.newsletterName]: new FormControl(false),
  });

  public loading: boolean;

  private subscriptions = new Subscription();

  public constructor(
    private configurationService: ConfigurationService,
    private authService: AuthService,
    private router: Router,
    private store$: Store<AppState>
  ) {
    const locale = this.configurationService.getConfiguration().locale;
    const supportedLocales = [LanguageCode.CZ.toString(), LanguageCode.EN.toString()];
    const supportedLocale = supportedLocales.includes(locale) ? locale : LanguageCode.EN;
    this.termsOfServiceLink = termsOfServiceLinks[supportedLocale];
    this.privacyPolicyLink = privacyPolicyLinks[supportedLocale];
    this.dataProcessingAgreementLink = dataProcessingAgreementLinks[supportedLocale];
  }

  public ngOnInit() {
    this.store$.dispatch(new ModalsAction.Hide());
    this.subscriptions.add(
      this.store$
        .select(selectCurrentUser)
        .pipe(filter(user => !!user))
        .subscribe(user => {
          this.agreement.setValue(user.agreement || false);
          this.newsletter.setValue(user.newsletter || false);
        })
    );
    this.stage = 0;
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onSubmit() {
    if (this.form.invalid) {
      return;
    }

    if (this.newsletter.value || this.stage === 1) {
      this.sendAgreement();
    } else {
      this.stage = 1;
    }
  }

  private sendAgreement() {
    this.loading = true;

    this.store$.dispatch(
      new UsersAction.PatchCurrentUser({
        user: {
          agreement: this.agreement.value || false,
          newsletter: this.newsletter.value || false,
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
    const path = this.authService.getAndClearLoginRedirectPath();
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
