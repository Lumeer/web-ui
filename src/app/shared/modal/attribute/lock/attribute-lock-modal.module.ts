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
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {ModalWrapperModule} from '../../wrapper/modal-wrapper.module';
import {PipesModule} from '../../../pipes/pipes.module';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {AttributeLockModalComponent} from './attribute-lock-modal.component';
import {AttributeCommonModalModule} from '../common/attribute-common-modal.module';
import {AttributeLockContentComponent} from './content/attribute-lock-content.component';
import {DataInputModule} from '../../../data-input/data-input.module';
import {AttributeLockExceptionGroupComponent} from './content/exception-group/attribute-lock-exception-group.component';
import {BoxModule} from '../../../box/box.module';
import {SelectModule} from '../../../select/select.module';

@NgModule({
  declarations: [AttributeLockModalComponent, AttributeLockContentComponent, AttributeLockExceptionGroupComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ModalWrapperModule,
    PipesModule,
    TooltipModule,
    AttributeCommonModalModule,
    DataInputModule,
    BoxModule,
    SelectModule,
  ],
  exports: [AttributeLockModalComponent],
})
export class AttributeLockModalModule {}
