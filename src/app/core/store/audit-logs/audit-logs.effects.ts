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

import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {catchError, map, mergeMap, tap} from 'rxjs/operators';
import {of} from 'rxjs';
import {NotificationsAction} from '../notifications/notifications.action';
import {AuditLogService} from '../../data-service/audit-log/audit-log.service';
import {convertAuditLogDtoToModel} from './audit-log.converter';
import * as AuditLogActions from './audit-logs.actions';

@Injectable()
export class AuditLogsEffects {
  public getByDocument$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuditLogActions.getByDocument),
      mergeMap(action =>
        this.service.getByDocument(action.collectionId, action.documentId, action.workspace).pipe(
          map(dtos => dtos.map(dto => convertAuditLogDtoToModel(dto))),
          map(auditLogs => AuditLogActions.getByDocumentSuccess({auditLogs, documentId: action.documentId})),
          catchError(error => of(AuditLogActions.getByDocumentFailure({error})))
        )
      )
    )
  );

  public getByDocumentFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuditLogActions.getByDocumentFailure),
      tap(action => console.error(action.error)),
      map(() => {
        const message = $localize`:@@audit.get.document.fail:Could not get activity logs for the selected record`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public getByProject$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuditLogActions.getByProject),
      mergeMap(action =>
        this.service.getByProject(action.workspace).pipe(
          map(dtos => dtos.map(dto => convertAuditLogDtoToModel(dto))),
          map(auditLogs => AuditLogActions.getByProjectSuccess({auditLogs})),
          catchError(error => of(AuditLogActions.getFailure({error})))
        )
      )
    )
  );

  public getByCollection$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuditLogActions.getByCollection),
      mergeMap(action =>
        this.service.getByCollection(action.collectionId, action.workspace).pipe(
          map(dtos => dtos.map(dto => convertAuditLogDtoToModel(dto))),
          map(auditLogs => AuditLogActions.getByCollectionSuccess({collectionId: action.collectionId, auditLogs})),
          catchError(error => of(AuditLogActions.getFailure({error})))
        )
      )
    )
  );

  public getByLinkType$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuditLogActions.getByLinkType),
      mergeMap(action =>
        this.service.getByLinkType(action.linkTypeId, action.workspace).pipe(
          map(dtos => dtos.map(dto => convertAuditLogDtoToModel(dto))),
          map(auditLogs => AuditLogActions.getByLinkTypeSuccess({linkTypeId: action.linkTypeId, auditLogs})),
          catchError(error => of(AuditLogActions.getFailure({error})))
        )
      )
    )
  );

  public getFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuditLogActions.getFailure),
      tap(action => console.error(action.error)),
      map(() => {
        const message = $localize`:@@audit.get.any.fail:Could not get activity logs`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public revert$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuditLogActions.revert),
      mergeMap(action =>
        this.service.revert(action.auditLogId, action.workspace).pipe(
          mergeMap(() => [AuditLogActions.revertSuccess({auditLogId: action.auditLogId})]),
          catchError(error => of(AuditLogActions.revertFailure({error, auditLogId: action.auditLogId})))
        )
      )
    )
  );

  public revertFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuditLogActions.revertFailure),
      tap(action => console.error(action.error)),
      map(() => {
        const message = $localize`:@@audit.revert.fail:Could not revert record`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public getByLink$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuditLogActions.getByLink),
      mergeMap(action =>
        this.service.getByLink(action.linkTypeId, action.linkInstanceId, action.workspace).pipe(
          map(dtos => dtos.map(dto => convertAuditLogDtoToModel(dto))),
          map(auditLogs => AuditLogActions.getByLinkSuccess({auditLogs, linkInstanceId: action.linkInstanceId})),
          catchError(error => of(AuditLogActions.getByLinkFailure({error})))
        )
      )
    )
  );

  public getByLinkFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuditLogActions.getByLinkFailure),
      tap(action => console.error(action.error)),
      map(() => {
        const message = $localize`:@@audit.get.link.fail:Could not get activity logs for the selected link`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  constructor(private actions$: Actions, private service: AuditLogService) {}
}
