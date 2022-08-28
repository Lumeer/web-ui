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

import {NgModule} from '@angular/core';

import {AttributeDescriptionModalModule} from './description/attribute-description-modal.module';
import {AttributeFunctionModalModule} from './function/attribute-function-modal.module';
import {AttributeLockModalModule} from './lock/attribute-lock-modal.module';
import {AttributeTypeModalModule} from './type/attribute-type-modal.module';
import {AttributeCommonModalModule} from './common/attribute-common-modal.module';
import {ConditionalFormattingModalComponent} from './conditional-formatting/conditional-formatting-modal.component';
import {ConditionalFormattingModalModule} from './conditional-formatting/conditional-formatting-modal.module';

@NgModule({
  imports: [
    AttributeDescriptionModalModule,
    AttributeFunctionModalModule,
    AttributeLockModalModule,
    AttributeTypeModalModule,
    ConditionalFormattingModalModule,
    AttributeCommonModalModule,
  ],
  exports: [
    AttributeDescriptionModalModule,
    AttributeFunctionModalModule,
    AttributeLockModalModule,
    AttributeTypeModalModule,
    ConditionalFormattingModalModule,
    AttributeCommonModalModule,
  ],
})
export class AttributeModalModule {}
