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

import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {LanguageCode} from '../top-panel/user-panel/user-menu/language';
import {ConfigurationService} from '../../configuration/configuration.service';

@Component({
  selector: 'get-help',
  templateUrl: './get-help.component.html',
  styleUrls: ['./get-help.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GetHelpComponent implements OnInit {
  public link: string;

  constructor(private configurationService: ConfigurationService) {}

  public ngOnInit(): void {
    if (this.configurationService.getConfiguration().locale === LanguageCode.CZ) {
      this.link = 'https://www.lumeer.io/cs/pomoc';
    } else {
      this.link = 'https://www.lumeer.io/get-help';
    }
  }
}
