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

import {Action} from '@ngrx/store';
import {QueryModel} from '../navigation/query.model';
import {SmartDocModel} from '../smartdoc/smartdoc.model';
import {TableConfig} from '../tables/table.model';
import {PostItConfigModel, SearchConfigModel, TableConfigModel, ViewConfigModel, ViewModel} from './view.model';

export enum ViewsActionType {

  GET = '[Views] Get',
  GET_BY_CODE = '[Views] Get By Code',
  GET_SUCCESS = '[Views] Get :: Success',
  GET_FAILURE = '[Views] Get :: Failure',

  CREATE = '[Views] Create',
  CREATE_SUCCESS = '[Views] Create :: Success',
  CREATE_FAILURE = '[Views] Create :: Failure',

  UPDATE = '[Views] Update',
  UPDATE_SUCCESS = '[Views] Update :: Success',
  UPDATE_FAILURE = '[Views] Update :: Failure',

  CHANGE_CONFIG = '[Views] Change Config',
  CHANGE_POSTIT_CONFIG = '[Views] Change Post-it Config',
  CHANGE_SEARCH_CONFIG = '[Views] Change Search Config',
  CHANGE_SMARTDOC_CONFIG = '[Views] Change Smart Document Config',
  CHANGE_TABLE_CONFIG = '[Views] Change Table Config',
  CHANGE_TABLE2_CONFIG = '[Views] Change Table 2 Config',

  CLEAR = '[Views] Clear'

}

export namespace ViewsAction {

  export class Get implements Action {
    public readonly type = ViewsActionType.GET;

    public constructor(public payload: { query: QueryModel }) {
    }
  }

  export class GetByCode implements Action {
    public readonly type = ViewsActionType.GET_BY_CODE;

    public constructor(public payload: { viewCode: string }) {
    }
  }

  export class GetSuccess implements Action {
    public readonly type = ViewsActionType.GET_SUCCESS;

    public constructor(public payload: { views: ViewModel[] }) {
    }
  }

  export class GetFailure implements Action {
    public readonly type = ViewsActionType.GET_FAILURE;

    public constructor(public payload: { error: any }) {
    }
  }

  export class Create implements Action {
    public readonly type = ViewsActionType.CREATE;

    public constructor(public payload: { view: ViewModel }) {
    }
  }

  export class CreateSuccess implements Action {
    public readonly type = ViewsActionType.CREATE_SUCCESS;

    public constructor(public payload: { view: ViewModel }) {
    }
  }

  export class CreateFailure implements Action {
    public readonly type = ViewsActionType.CREATE_FAILURE;

    public constructor(public payload: { error: any }) {
    }
  }

  export class Update implements Action {
    public readonly type = ViewsActionType.UPDATE;

    public constructor(public payload: { viewCode: string, view: ViewModel, nextAction?: Action }) {
    }
  }

  export class UpdateSuccess implements Action {
    public readonly type = ViewsActionType.UPDATE_SUCCESS;

    public constructor(public payload: { view: ViewModel, nextAction?: Action }) {
    }
  }

  export class UpdateFailure implements Action {
    public readonly type = ViewsActionType.UPDATE_FAILURE;

    public constructor(public payload: { error: any }) {
    }
  }

  export class ChangeConfig implements Action {
    public readonly type = ViewsActionType.CHANGE_CONFIG;

    public constructor(public payload: { config: ViewConfigModel }) {
    }
  }

  export class ChangePostItConfig implements Action {
    public readonly type = ViewsActionType.CHANGE_POSTIT_CONFIG;

    public constructor(public payload: { config: PostItConfigModel }) {
    }
  }

  export class ChangeSearchConfig implements Action {
    public readonly type = ViewsActionType.CHANGE_SEARCH_CONFIG;

    public constructor(public payload: { config: SearchConfigModel }) {
    }
  }

  export class ChangeSmartDocConfig implements Action {
    public readonly type = ViewsActionType.CHANGE_SMARTDOC_CONFIG;

    public constructor(public payload: { config: SmartDocModel }) {
    }
  }

  export class ChangeTableConfig implements Action {
    public readonly type = ViewsActionType.CHANGE_TABLE_CONFIG;

    public constructor(public payload: { config: TableConfigModel }) {
    }
  }

  export class ChangeTable2Config implements Action {
    public readonly type = ViewsActionType.CHANGE_TABLE2_CONFIG;

    public constructor(public payload: { config: TableConfig }) {
    }
  }

  export class Clear implements Action {
    public readonly type = ViewsActionType.CLEAR;

    public constructor() {
    }
  }

  export type All = GetByCode | GetSuccess | GetFailure |
    Create | CreateSuccess | CreateFailure |
    Update | UpdateSuccess | UpdateFailure |
    ChangeConfig | ChangePostItConfig | ChangeSearchConfig | ChangeSmartDocConfig | ChangeTableConfig | ChangeTable2Config |
    Clear;

}
