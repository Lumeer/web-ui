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

import {Action} from '@ngrx/store';

export enum AppPropertiesActionType {
  TOGGLE_TOP_PANEL = '[App Properties] Toggle Top Panel',
  OPEN_TOP_PANEL = '[App Properties] Open Top Panel',
  SET_TOP_PANEL_OPENED = '[App Properties] Set Top Panel Opened',
  SET_FULLSCREEN = '[App Properties] Set Fullscreen',
}

export namespace AppPropertiesAction {
  export class ToggleTopPanel implements Action {
    public readonly type = AppPropertiesActionType.TOGGLE_TOP_PANEL;
  }

  export class OpenTopPanel implements Action {
    public readonly type = AppPropertiesActionType.OPEN_TOP_PANEL;
  }

  export class SetTopPanelOpened implements Action {
    public readonly type = AppPropertiesActionType.SET_TOP_PANEL_OPENED;

    public constructor(public payload: {opened: boolean}) {}
  }

  export class SetFullscreen implements Action {
    public readonly type = AppPropertiesActionType.SET_FULLSCREEN;

    public constructor(public payload: {opened: boolean}) {}
  }

  export type All = ToggleTopPanel | OpenTopPanel | SetTopPanelOpened | SetFullscreen;
}
