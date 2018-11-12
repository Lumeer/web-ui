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

import {Contact} from '../../../dto';
import {ContactModel} from './contact.model';

export class ContactConverter {
  public static fromDto(dto: Contact): ContactModel {
    return {
      id: dto.id,
      organizationId: dto.organizationId,
      company: dto.company,
      firstName: dto.firstName,
      lastName: dto.lastName,
      address1: dto.address1,
      address2: dto.address2,
      city: dto.city,
      zip: dto.zip,
      state: dto.state,
      country: dto.country,
      email: dto.email,
      phone: dto.phone,
      ic: dto.ic,
      dic: dto.dic,
    };
  }

  public static toDto(contact: ContactModel): Contact {
    return {
      id: contact.id,
      organizationId: contact.organizationId,
      company: contact.company,
      firstName: contact.firstName,
      lastName: contact.lastName,
      address1: contact.address1,
      address2: contact.address2,
      city: contact.city,
      zip: contact.zip,
      state: contact.state,
      country: contact.country,
      email: contact.email,
      phone: contact.phone,
      ic: contact.ic,
      dic: contact.dic,
    };
  }
}
