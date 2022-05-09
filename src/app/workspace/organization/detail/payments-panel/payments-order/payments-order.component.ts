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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {DatePipe} from '@angular/common';
import {ServiceLimits} from '../../../../../core/store/organizations/service-limits/service.limits';
import {ServiceLevelType} from '../../../../../core/dto/service-level-type';
import {isDateValid} from '../../../../../shared/utils/common.utils';

@Component({
  selector: 'payments-order',
  templateUrl: './payments-order.component.html',
  styleUrls: ['./payments-order.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsOrderComponent implements OnChanges {
  @Input()
  public serviceLimits: ServiceLimits;

  @Output()
  public pay = new EventEmitter<{users: number; months: number; currency: string; amount: number; start: Date}>();

  private static CZK_FULL = 290;
  private static CZK_SALE = 220;
  private static EUR_FULL = 11.5;
  private static EUR_SALE = 9.0;
  private static USD_FULL = 13.0;
  private static USD_SALE = 10.0;

  public discountAmount = 0;
  public discountDescription: string;

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

  public trial: boolean; // are we on a trial subscription?

  constructor() {
    this.discountDescription = $localize`:@@organizations.tab.detail.order.discount:Special Early Bird Prices!`;
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.serviceLimits) {
      if (!this.serviceLimits || this.serviceLimits.serviceLevel === ServiceLevelType.FREE) {
        this.trial = true;
        this.setStartDate(floorDate(new Date()));
      } else {
        this.trial = false;
        this.numberOfUsers = this.serviceLimits?.users;
        this.setStartDate(new Date(this.serviceLimits?.validUntil.getTime() + 1));
      }
    }
  }

  private setStartDate(d: Date) {
    this.startDate = d;
    this.startDateText = new DatePipe('en-US').transform(d, 'yyyy-MM-dd'); // `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
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

  public onSliderUpdated(data: {position: number; value: string}) {
    this.subscriptionLength = data.value;
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

  public updateStartDate(event: any) {
    const date = new Date(event.target.value);
    if (isDateValid(date)) {
      this.startDate = floorDate(date);
    }
  }
}

function floorDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}
