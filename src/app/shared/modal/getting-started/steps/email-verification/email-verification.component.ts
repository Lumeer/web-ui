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

import {Component, ChangeDetectionStrategy} from '@angular/core';
import {GettingStartedService} from '../../getting-started.service';

@Component({
  selector: 'email-verification',
  templateUrl: './email-verification.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'd-block p-4'},
})
export class EmailVerificationComponent {
  constructor(public service: GettingStartedService) {}
}
