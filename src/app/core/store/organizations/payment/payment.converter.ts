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

import {PaymentDto} from '../../../dto/payment.dto';
import {Payment} from './payment';

export class PaymentConverter {
  public static fromDto(organizationId: string, dto: PaymentDto): Payment {
    return {
      id: dto.id,
      organizationId: organizationId,
      date: new Date(dto.date),
      amount: dto.amount,
      paymentId: dto.paymentId,
      start: new Date(dto.start),
      validUntil: new Date(dto.validUntil),
      state: dto.state,
      serviceLevel: dto.serviceLevel,
      users: dto.users,
      language: dto.language,
      currency: dto.currency,
      gwUrl: dto.gwUrl,
      version: dto.version,
    };
  }

  public static toDto(model: Payment): PaymentDto {
    return {
      id: model.id,
      date: model.date.getTime(),
      amount: model.amount,
      paymentId: model.paymentId,
      start: model.start.getTime(),
      validUntil: model.validUntil.getTime(),
      state: model.state,
      serviceLevel: model.serviceLevel,
      users: model.users,
      language: model.language,
      currency: model.currency,
      gwUrl: model.gwUrl,
    };
  }
}
