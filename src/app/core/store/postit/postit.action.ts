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
import {SizeType} from '../../../shared/slider/size-type';

export enum PostItActionType {
  CHANGE_SIZE = '[PostIts] Change size',
  CHANGE_ORDER = '[PostIts] Change order',
  CLEAR = '[PostIts] Clear',
}

export namespace PostItAction {
  export class ChangeSize implements Action {
    public readonly type = PostItActionType.CHANGE_SIZE;

    public constructor(public payload: {size: SizeType}) {}
  }

  export class ChangeOrder implements Action {
    public readonly type = PostItActionType.CHANGE_ORDER;

    public constructor(public payload: {documentIdsOrder: string[]}) {}
  }

  export class Clear implements Action {
    public readonly type = PostItActionType.CLEAR;
  }

  export type All = ChangeSize | ChangeOrder | Clear;
}
