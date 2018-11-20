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

import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Store} from '@ngrx/store';
import {Router} from '@angular/router';
import {selectServiceLimitsByWorkspace} from '../../../../../core/store/organizations/service-limits/service-limits.state';
import {Subscription} from 'rxjs';
import {filter} from 'rxjs/operators';
import {isNullOrUndefined} from 'util';
import {AppState} from '../../../../../core/store/app.state';
import {DatePipe} from '@angular/common';
import {ServiceLimitsModel} from '../../../../../core/store/organizations/service-limits/service-limits.model';
import {ServiceLevelType} from '../../../../../core/dto/service-level-type';

@Component({
  selector: 'payments-order',
  templateUrl: './payments-order.component.html',
  styleUrls: ['./payments-order.component.scss'],
})
export class PaymentsOrderComponent implements OnInit {
  private static CZK_FULL = 205;
  private static CZK_SALE = 169;
  private static EUR_FULL = 8.0;
  private static EUR_SALE = 6.7;
  private static USD_FULL = 9.9;
  private static USD_SALE = 8.3;

  public discountAmount = 0;
  public discountDescription: string;

  @Output()
  public pay = new EventEmitter<{users: number; months: number; currency: string; amount: number; start: Date}>();

  public subscriptionLength: string;

  public numberOfUsers: number = 10;

  public currency: string = 'EUR';

  public startDate: Date = new Date();
  public startDateText: string;

  public price: number = 12 * this.numberOfUsers * PaymentsOrderComponent.EUR_SALE;

  public prefix = '€';
  public suffix = '';

  public pricePerUser: number = PaymentsOrderComponent.EUR_SALE;
  private months: number = 12;
  public discount: boolean = true;
  public discountInfoPerUser: string = '';
  public discountInfo: number = 0;

  private serviceLimitsSubscription: Subscription;

  public trial: boolean = true; // are we on a trial subscription?
  public serviceLimits: ServiceLimitsModel;

  constructor(private i18n: I18n, private router: Router, private store: Store<AppState>) {
    this.discountDescription = this.i18n({
      id: 'organizations.tab.detail.order.discount',
      value: 'Special Early Bird Prices!',
    });
  }

  public ngOnInit() {
    this.subscribeToStore();
  }

  private subscribeToStore() {
    this.serviceLimitsSubscription = this.store
      .select(selectServiceLimitsByWorkspace)
      .pipe(filter(serviceLimits => !isNullOrUndefined(serviceLimits)))
      .subscribe(serviceLimits => {
        this.serviceLimits = serviceLimits;
        if (serviceLimits.serviceLevel === ServiceLevelType.FREE) {
          this.trial = true;
          this.setStartDate(PaymentsOrderComponent.floorDate(new Date()));
        } else {
          this.trial = false;
          this.numberOfUsers = this.serviceLimits.users;
          this.setStartDate(new Date(serviceLimits.validUntil.getTime() + 1));
        }
      });
  }

  private static floorDate(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }

  private setStartDate(d: Date) {
    this.startDate = d;
    this.startDateText = new DatePipe('en-US').transform(d, 'yyyy-MM-dd'); // `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  public ngOnDestroy(): void {
    if (this.serviceLimitsSubscription) {
      this.serviceLimitsSubscription.unsubscribe();
    }
  }

  private calculatePrice() {
    this.discount =
      this.subscriptionLength.indexOf(this.i18n({id: 'organizations.tab.detail.order.term', value: 'year'})) > 0;
    this.months = +this.subscriptionLength.split(' ')[0] * (this.discount ? 12 : 1);

    switch (this.currency) {
      case 'EUR':
        return this.calculatePriceFromMonthly(
          this.discount ? PaymentsOrderComponent.EUR_SALE : PaymentsOrderComponent.EUR_FULL
        );
      case 'USD':
        return this.calculatePriceFromMonthly(
          this.discount ? PaymentsOrderComponent.USD_SALE : PaymentsOrderComponent.USD_FULL
        );
      case 'CZK':
        return this.calculatePriceFromMonthly(
          this.discount ? PaymentsOrderComponent.CZK_SALE : PaymentsOrderComponent.CZK_FULL
        );
    }
  }

  private calculatePriceFromMonthly(monthlyPrice: number): number {
    return (
      Math.round(
        this.months *
          this.numberOfUsers *
          monthlyPrice *
          (this.discountAmount > 0 ? this.discountAmount / 100 : 1) *
          100
      ) / 100
    );
  }

  public sliderValue($event) {
    this.subscriptionLength = $event.value;
    this.updatePrice();
  }

  public updatePrice() {
    switch (this.currency) {
      case 'EUR':
        this.prefix = '€';
        this.suffix = '';
        break;
      case 'USD':
        this.prefix = '$';
        this.suffix = '';
        break;
      case 'CZK':
        this.prefix = '';
        this.suffix = 'Kč';
        break;
    }
    this.price = this.calculatePrice();
    this.pricePerUser = Math.round((this.price / this.months / this.numberOfUsers) * 100) / 100;

    if (this.discountAmount > 0) {
      this.discountInfoPerUser =
        this.prefix + Math.round(this.pricePerUser * (100 / this.discountAmount) * 100) / 100 + this.suffix;
      this.discountInfo = Math.round(this.price * (100 / this.discountAmount) * 100) / 100;
    } else {
      this.discountInfoPerUser = '';
      this.discountInfo = 0;
    }
  }

  public placeOrder() {
    this.pay.emit({
      months: this.months,
      users: this.numberOfUsers,
      amount: this.price,
      currency: this.currency,
      start: this.startDate,
    });
  }

  public updateStartDate($event) {
    const d = new Date($event.target.value);
    if (!isNaN(d.getTime())) {
      this.startDate = PaymentsOrderComponent.floorDate(d);
    }
  }
}
