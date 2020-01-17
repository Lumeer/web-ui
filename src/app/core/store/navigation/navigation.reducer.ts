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

import {ROUTER_CANCEL, ROUTER_NAVIGATED, RouterCancelAction, RouterNavigatedAction} from '@ngrx/router-store';
import {deepObjectsEquals} from '../../../shared/utils/common.utils';
import {Perspective, perspectivesMap} from '../../../view/perspectives/perspective';
import {AppState} from '../app.state';
import {parseMapCoordinates} from '../maps/map-coordinates';
import {MapPosition} from '../maps/map.model';
import {RouterStateUrl} from '../router/lumeer-router-state-serializer';
import {initialNavigationState, NavigationState} from './navigation.state';
import {QueryParam} from './query-param';
import {convertQueryStringToModel} from './query/query.converter';
import {parseSearchTabFromUrl, SearchTab, searchTabsMap} from './search-tab';
import {convertStringToViewCursor} from './view-cursor/view-cursor';

function onRouterNavigation(state: NavigationState, action: RouterNavigatedAction<RouterStateUrl>): NavigationState {
  const {data, params, queryParams, url} = action.payload.routerState;

  const mapPosition: MapPosition =
    params['mz'] && params['mc']
      ? {
          bearing: Number(params['mb']) || 0,
          center: parseMapCoordinates(params['mc']),
          pitch: Number(params['mp']) || 0,
          zoom: Number(params['mz']),
        }
      : null;

  const query = convertQueryStringToModel(queryParams[QueryParam.Query]);
  const viewCursor = convertStringToViewCursor(queryParams[QueryParam.ViewCursor]);

  const workspace = {
    organizationCode: params['organizationCode'],
    projectCode: params['projectCode'],
    collectionId: params['collectionId'],
    viewCode: params['vc'],
  };

  return {
    mapPosition: deepObjectsEquals(mapPosition, state.mapPosition) ? state.mapPosition : mapPosition,
    query: deepObjectsEquals(query, state.query) ? state.query : query,
    workspace: deepObjectsEquals(workspace, state.workspace) ? state.workspace : workspace,
    perspective: perspectivesMap[extractPerspectiveIdFromUrl(url)],
    viewName: queryParams['viewName'],
    viewCursor: deepObjectsEquals(viewCursor, state.viewCursor) ? state.viewCursor : viewCursor,
    searchTab: parseSearchTabFromUrl(url),
    previousUrl: state.url,
    url,
  };
}

function extractPerspectiveIdFromUrl(url: string): string {
  const urlSegments = url.split('/');

  if (urlSegments.length > 5 && urlSegments[1] === 'w' && urlSegments[4].startsWith('view')) {
    const perspectiveSegment = urlSegments[5];
    const perspectiveNames = Object.values(Perspective).join('|');
    const regex = new RegExp(`^(${perspectiveNames}).*`);
    return perspectiveSegment.replace(regex, '$1');
  }
}

function onRouterCancel(state: NavigationState, action: RouterCancelAction<AppState>): NavigationState {
  return (action.payload.storeState && action.payload.storeState.navigation) || initialNavigationState;
}

export function navigationReducer(
  state: NavigationState,
  action: RouterNavigatedAction<RouterStateUrl> | RouterCancelAction<AppState>
): NavigationState {
  switch (action.type) {
    case ROUTER_NAVIGATED:
      return onRouterNavigation(state, action);
    case ROUTER_CANCEL:
      return onRouterCancel(state, action);
    default:
      return state;
  }
}
