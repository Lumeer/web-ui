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
import {ResourceAttributeSettings, ViewSettings} from '../views/view';
import {Collection} from '../collections/collection';
import {LinkType} from '../link-types/link.type';

export enum ViewSettingsActionType {
  SET_SETTINGS = '[View Settings] Set Settings',
  RESET_SETTINGS = '[View Settings] Reset Settings',

  HIDE_ATTRIBUTES = '[View Settings] Hide Attributes',
  SHOW_ATTRIBUTES = '[View Settings] Show Attributes',
  MOVE_ATTRIBUTE = '[View Settings] Move Attribute',
  ADD_ATTRIBUTE = '[View Settings] Add Attribute',
  SET_ATTRIBUTE = '[View Settings] Set Attribute',

  CLEAR = '[View Settings] Clear',
}

export namespace ViewSettingsAction {
  export class SetSettings implements Action {
    public readonly type = ViewSettingsActionType.SET_SETTINGS;

    public constructor(public payload: {settingsId: string; settings: ViewSettings}) {}
  }

  export class ResetSettings implements Action {
    public readonly type = ViewSettingsActionType.RESET_SETTINGS;

    public constructor(public payload: {settingsId: string}) {}
  }

  export class MoveAttribute implements Action {
    public readonly type = ViewSettingsActionType.MOVE_ATTRIBUTE;

    public constructor(
      public payload: {settingsId: string; from: number; to: number; collection: Collection; linkType?: LinkType}
    ) {}
  }

  export class HideAttributes implements Action {
    public readonly type = ViewSettingsActionType.HIDE_ATTRIBUTES;

    public constructor(
      public payload: {
        settingsId: string;
        collectionAttributeIds: string[];
        collection: Collection;
        linkTypeAttributeIds?: string[];
        linkType?: LinkType;
      }
    ) {}
  }

  export class ShowAttributes implements Action {
    public readonly type = ViewSettingsActionType.SHOW_ATTRIBUTES;

    public constructor(
      public payload: {
        settingsId: string;
        collectionAttributeIds: string[];
        collection: Collection;
        linkTypeAttributeIds?: string[];
        linkType?: LinkType;
      }
    ) {}
  }

  export class SetAttribute implements Action {
    public readonly type = ViewSettingsActionType.SET_ATTRIBUTE;

    public constructor(
      public payload: {
        settingsId: string;
        attributeId: string;
        settings: Partial<ResourceAttributeSettings>;
        collection: Collection;
        linkType?: LinkType;
      }
    ) {}
  }

  export class AddAttribute implements Action {
    public readonly type = ViewSettingsActionType.ADD_ATTRIBUTE;

    public constructor(
      public payload: {
        settingsId: string;
        attributeId: string;
        position: number;
        collection: Collection;
        linkType?: LinkType;
      }
    ) {}
  }

  export class Clear implements Action {
    public readonly type = ViewSettingsActionType.CLEAR;
  }

  export type All =
    | SetSettings
    | ResetSettings
    | HideAttributes
    | ShowAttributes
    | MoveAttribute
    | AddAttribute
    | SetAttribute
    | Clear;
}
