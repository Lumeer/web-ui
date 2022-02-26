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
import {NotificationsAction} from '../notifications/notifications.action';
import {AuditLogService} from '../../data-service/audit-log/audit-log.service';
import {convertAuditLogDtoToModel} from './audit-log.converter';
import * as AuditLogActions from './audit-logs.actions';
import {of} from 'rxjs';
import {convertDocumentDtoToModel} from '../documents/document.converter';
import {DocumentsAction} from '../documents/documents.action';
import {convertLinkInstanceDtoToModel} from '../link-instances/link-instance.converter';
import {LinkInstancesAction} from '../link-instances/link-instances.action';

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

  public revertDocument$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuditLogActions.revertDocument),
      mergeMap(action =>
        this.service.revertDocument(action.collectionId, action.documentId, action.auditLogId, action.workspace).pipe(
          map(dto => convertDocumentDtoToModel(dto)),
          mergeMap(document => [
            new DocumentsAction.RevertData({document}),
            AuditLogActions.revertDocumentSuccess({auditLogId: action.auditLogId}),
          ]),
          catchError(error => of(AuditLogActions.revertDocumentFailure({error, auditLogId: action.auditLogId})))
        )
      )
    )
  );

  public revertDocumentFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuditLogActions.revertDocumentFailure),
      tap(action => console.error(action.error)),
      map(() => {
        const message = $localize`:@@audit.revert.document.fail:Could not revert record changes`;
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

  public revertLink$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuditLogActions.revertLink),
      mergeMap(action =>
        this.service.revertLink(action.linkTypeId, action.linkInstanceId, action.auditLogId, action.workspace).pipe(
          map(dto => convertLinkInstanceDtoToModel(dto)),
          mergeMap(linkInstance => [
            new LinkInstancesAction.RevertData({linkInstance}),
            AuditLogActions.revertLinkSuccess({auditLogId: action.auditLogId}),
          ]),
          catchError(error => of(AuditLogActions.revertLinkFailure({error, auditLogId: action.auditLogId})))
        )
      )
    )
  );

  public revertLinkFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuditLogActions.revertLinkFailure),
      tap(action => console.error(action.error)),
      map(() => {
        const message = $localize`:@@audit.revert.link.fail:Could not revert link changes`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  constructor(private actions$: Actions, private service: AuditLogService) {}
}
