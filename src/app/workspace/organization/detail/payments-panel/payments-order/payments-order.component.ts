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

import {Component, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';
import {Store} from '@ngrx/store';
import {Router} from '@angular/router';
import {selectServiceLimitsByWorkspace} from '../../../../../core/store/organizations/service-limits/service-limits.state';
import {Subscription} from 'rxjs';
import {filter} from 'rxjs/operators';
import {AppState} from '../../../../../core/store/app.state';
import {DatePipe} from '@angular/common';
import {ServiceLimits} from '../../../../../core/store/organizations/service-limits/service.limits';
import {ServiceLevelType} from '../../../../../core/dto/service-level-type';
import {isNotNullOrUndefined} from '../../../../../shared/utils/common.utils';

@Component({
  selector: 'payments-order',
  templateUrl: './payments-order.component.html',
  styleUrls: ['./payments-order.component.scss'],
})
export class PaymentsOrderComponent implements OnInit, OnDestroy {
  private static CZK_FULL = 219;
  private static CZK_SALE = 189;
  private static EUR_FULL = 8.39;
  private static EUR_SALE = 6.99;
  private static USD_FULL = 9.59;
  private static USD_SALE = 7.99;

  public discountAmount = 0;
  public discountDescription: string;

  @Output()
  public pay = new EventEmitter<{users: number; months: number; currency: string; amount: number; start: Date}>();

  public subscriptionLength: string;

  public numberOfUsers: number = 5;

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
  public serviceLimits: ServiceLimits;

  constructor(private router: Router, private store: Store<AppState>) {
    this.discountDescription = $localize`:@@organizations.tab.detail.order.discount:Special Early Bird Prices!`;
  }

  private static floorDate(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }

  public ngOnInit() {
    this.subscribeToStore();
  }

  private subscribeToStore() {
    this.serviceLimitsSubscription = this.store
      .select(selectServiceLimitsByWorkspace)
      .pipe(filter(serviceLimits => isNotNullOrUndefined(serviceLimits)))
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

  private setStartDate(d: Date) {
    this.startDate = d;
    this.startDateText = new DatePipe('en-US').transform(d, 'yyyy-MM-dd'); // `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  public ngOnDestroy(): void {
    if (this.serviceLimitsSubscription) {
      this.serviceLimitsSubscription.unsubscribe();
    }
  }

  private isDiscount(): boolean {
    return this.subscriptionLength.indexOf($localize`:@@organizations.tab.detail.order.term:year`) > 0;
  }

  private calculatePrice() {
    this.discount = this.isDiscount();
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

  private getPricePerUser(): number {
    switch (this.currency) {
      case 'EUR':
        return this.discount ? PaymentsOrderComponent.EUR_SALE : PaymentsOrderComponent.EUR_FULL;
      case 'USD':
        return this.discount ? PaymentsOrderComponent.USD_SALE : PaymentsOrderComponent.USD_FULL;
      case 'CZK':
        return this.discount ? PaymentsOrderComponent.CZK_SALE : PaymentsOrderComponent.CZK_FULL;
    }

    return 0;
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
    this.pricePerUser = this.getPricePerUser();

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
