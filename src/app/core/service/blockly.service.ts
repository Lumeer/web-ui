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
import {Injectable} from '@angular/core';

import {loadBlockly} from '../../shared/blockly/custom/blockly-loader';

@Injectable({
  providedIn: 'root',
})
export class BlocklyService {
  /**
   * Loads Blockly on demand, it is not a part of the main bundle.
   */
  public loadBlockly(): Promise<any> {
    // Translated to the language code in each message file, so Blockly always speaks the language the application
    // was built in. The locale in configuration comes from the URL, which does not say it when running locally.
    const language = $localize`:@@blockly.language:en`;
    return loadBlockly(language);
  }
}
