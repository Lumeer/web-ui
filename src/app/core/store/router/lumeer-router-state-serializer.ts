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

import {Params, RouterStateSnapshot} from '@angular/router';
import {Data} from '@angular/router/src/config';
import {RouterStateSerializer} from '@ngrx/router-store';

export interface RouterStateUrl {
  url: string;
  params: Params;
  queryParams: Params;
  data: Data;
}

export class LumeerRouterStateSerializer implements RouterStateSerializer<RouterStateUrl> {
  public serialize(routerState: RouterStateSnapshot): RouterStateUrl {
    let route = routerState.root;

    let data: Data = {};
    const params: Params = {};
    const queryParams: Params = {};

    while (route) {
      data = {...data, ...route.data};
      for (const param of route.paramMap.keys) {
        params[param] = route.paramMap.get(param);
      }
      for (const queryParam of route.queryParamMap.keys) {
        queryParams[queryParam] = route.queryParamMap.get(queryParam);
      }
      route = route.firstChild;
    }

    const {url} = routerState;

    return {url, params, queryParams, data};
  }
}
