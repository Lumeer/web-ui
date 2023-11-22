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

import {InformationRecordModel} from './information-record.model';

export enum InformationRecordsActionType {
  GET = '[InformationRecords] Get',
  GET_SUCCESS = '[InformationRecords] Get :: Success',
  GET_FAILURE = '[InformationRecords] Get :: Failure',
}

export namespace InformationRecordsAction {
  export class Get implements Action {
    public readonly type = InformationRecordsActionType.GET;

    public constructor(
      public payload: {
        id: string;
        onSuccess?: (InformationRecord: InformationRecordModel) => void;
      }
    ) {}
  }

  export class GetSuccess implements Action {
    public readonly type = InformationRecordsActionType.GET_SUCCESS;

    public constructor(public payload: {informationRecord: InformationRecordModel}) {}
  }

  export class GetFailure implements Action {
    public readonly type = InformationRecordsActionType.GET_FAILURE;

    public constructor(public payload: {error: any}) {}
  }
}
