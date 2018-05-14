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

import {ROUTER_CANCEL, ROUTER_NAVIGATION, RouterCancelAction, RouterNavigationAction} from '@ngrx/router-store';
import {Perspective, perspectivesMap} from '../../../view/perspectives/perspective';
import {RouterStateUrl} from '../router/lumeer-router-state-serializer';
import {NavigationState} from './navigation.state';
import {QueryConverter} from './query.converter';

function onRouterNavigation(state: NavigationState, action: RouterNavigationAction<RouterStateUrl>): NavigationState {
  const {data, params, queryParams, url} = action.payload.routerState;

  return {
    query: QueryConverter.fromString(queryParams['query']),
    workspace: {
      organizationCode: params['organizationCode'],
      projectCode: params['projectCode'],
      collectionId: params['collectionId'],
      viewCode: params['vc']
    },
    perspective: perspectivesMap[extractPerspectiveIdFromUrl(url)],
    searchBoxHidden: data['searchBoxHidden'],
    viewName: queryParams['viewName'],
  };
}

function extractPerspectiveIdFromUrl(url: string): string {
  const urlSegments = url.split('/');
  const viewIndex = urlSegments.findIndex(segment => segment.startsWith('view'));

  if (viewIndex && urlSegments.length > viewIndex + 1) {
    const perspectiveSegment = urlSegments[viewIndex + 1];
    const perspectiveNames = Object.values(Perspective).join('|');
    const regex = new RegExp(`^(${perspectiveNames}).*`);
    return perspectiveSegment.replace(regex, '$1');
  }
}

function onRouterCancel(state: NavigationState, action: RouterCancelAction<NavigationState>) {
  return (action as RouterCancelAction<NavigationState>).payload.storeState;
}

export function navigationReducer(state: NavigationState, action: RouterNavigationAction<RouterStateUrl> | RouterCancelAction<NavigationState>): NavigationState {
  switch (action.type) {
    case ROUTER_NAVIGATION:
      return onRouterNavigation(state, action);
    case ROUTER_CANCEL:
      return onRouterCancel(state, action);
    default:
      return state;
  }
}
