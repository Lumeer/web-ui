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

export interface Payment {
  id: string;
  organizationId: string;
  date: Date;
  amount: number;
  paymentId: string;
  start: Date;
  validUntil: Date;
  state: string;
  serviceLevel: string;
  users: number;
  language: string;
  currency: string;
  gwUrl: string;
  version?: number;
}

export enum PaymentState {
  FREE = 'FREE',
  PAID = 'PAID',
  CANCELED = 'CANCELED',
  TIMEOUTED = 'TIMEOUTED',
  AUTHORIZED = 'AUTHORIZED',
}

export interface PaymentStats {
  registeredUsers: number;
  commissions: PaymentAmount[];
  paidCommissions: PaymentAmount[];
}

export interface PaymentAmount {
  currency: string;
  amount: number;
}
