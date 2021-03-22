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

import {Injectable, Renderer2} from '@angular/core';
import {ConfigurationService} from '../../configuration/configuration.service';

export interface BlocklyLoadFn {
  (): void;
}

@Injectable({
  providedIn: 'root',
})
export class BlocklyService {
  private readonly blocklyId = 'blocklyScript';

  constructor(private configurationService: ConfigurationService) {}

  public loadBlockly(renderer2: Renderer2, document: Document, onLoad?: BlocklyLoadFn): void {
    const e = document.getElementById(this.blocklyId);

    if (!e) {
      const script = renderer2.createElement('script');
      script.id = this.blocklyId;
      script.type = 'text/javascript';
      script.src = this.configurationService.getConfiguration().blocklyCdn;
      if (onLoad) {
        script.onload = onLoad;
      }
      renderer2.appendChild(document.body, script);
    } else if (onLoad) {
      onLoad();
    }
  }
}
