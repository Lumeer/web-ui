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
import {SmartDocPartModel} from './smartdoc.model';

export enum SmartDocActionType {

  ADD_PART = '[Smart Document] Add Part',
  UPDATE_PART = '[Smart Document] Update Part',
  REMOVE_PART = '[Smart Document] Remove Part',
  REMOVE_PART_CONFIRM = '[Smart Document] Remove Part Confirm',
  MOVE_PART = '[Smart Document] Move Part',
  ORDER_DOCUMENTS = '[Smart Document] Order Documents',

  SELECT = '[SmartDoc Templates] Select',
  DESELECT = '[SmartDoc Templates] Deselect'

}

export namespace SmartDocAction {

  export class AddPart implements Action {
    public readonly type = SmartDocActionType.ADD_PART;

    public constructor(public payload: { partPath: number[], partIndex?: number, part: SmartDocPartModel }) {
    }
  }

  export class UpdatePart implements Action {
    public readonly type = SmartDocActionType.UPDATE_PART;

    public constructor(public payload: { partPath: number[], partIndex: number, part: SmartDocPartModel }) {
    }
  }

  export class RemovePart implements Action {
    public readonly type = SmartDocActionType.REMOVE_PART;

    public constructor(public payload: { partPath: number[], partIndex: number }) {
    }
  }

  export class RemovePartConfirm implements Action {
    public readonly type = SmartDocActionType.REMOVE_PART_CONFIRM;

    public constructor(public payload: { partPath: number[], partIndex: number }) {
    }
  }

  export class MovePart implements Action {
    public readonly type = SmartDocActionType.MOVE_PART;

    public constructor(public payload: { partPath: number[], oldIndex: number, newIndex: number }) {
    }
  }

  export class OrderDocuments implements Action {
    public readonly type = SmartDocActionType.ORDER_DOCUMENTS;

    public constructor(public payload: { partPath: number[], documentIds: string[] }) {
    }
  }

  export class Select implements Action {
    public readonly type = SmartDocActionType.SELECT;

    public constructor(public payload: { path: number[], documentId: string, partIndex: number }) {
    }
  }

  export class Deselect implements Action {
    public readonly type = SmartDocActionType.DESELECT;
  }

  export type All = AddPart | UpdatePart | RemovePart | RemovePartConfirm | MovePart |
    OrderDocuments |
    Select | Deselect;
}
