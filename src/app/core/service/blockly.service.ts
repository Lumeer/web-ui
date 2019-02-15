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

import {Inject, Injectable, Renderer2} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {environment} from '../../../environments/environment';

export interface BlocklyLoadFn {
  (): void;
}

@Injectable({
  providedIn: 'root',
})
export class BlocklyService {
  private readonly blocklyId = 'blocklyScript';

  constructor(private renderer2: Renderer2, @Inject(DOCUMENT) private document) {}

  public loadBlockly(onLoad?: BlocklyLoadFn): void {
    const e = this.document.getElementById(this.blocklyId);

    if (!e) {
      const script = this.renderer2.createElement('script');
      script.id = this.blocklyId;
      script.type = 'text/javascript';
      script.src = environment.blocklyCdn;
      if (onLoad) {
        script.onload = onLoad;
      }
      this.renderer2.appendChild(this.document.body, script);
    } else if (onLoad) {
      onLoad();
    }
  }
}
