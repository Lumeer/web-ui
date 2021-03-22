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

import {HttpErrorResponse} from '@angular/common/http';
import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {Store} from '@ngrx/store';
import {saveAs} from 'file-saver';
import {BehaviorSubject, EMPTY, Observable} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {FileApiService} from '../../../../core/service/file-api.service';
import {NotificationService} from '../../../../core/notifications/notification.service';
import {FileAttachment} from '../../../../core/store/file-attachments/file-attachment.model';
import {FileAttachmentsAction} from '../../../../core/store/file-attachments/file-attachments.action';
import {AppState} from '../../../../core/store/app.state';
import {ConfigurationService} from '../../../../configuration/configuration.service';

@Component({
  selector: 'file-attachment-button',
  templateUrl: './file-attachment-button.component.html',
  styleUrls: ['./file-attachment-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileAttachmentButtonComponent {
  @Input()
  public fileAttachment: FileAttachment;

  public downloading$ = new BehaviorSubject(false);

  constructor(
    private fileApiService: FileApiService,
    private notificationService: NotificationService,
    private store$: Store<AppState>,
    private configurationService: ConfigurationService
  ) {}

  public onClick() {
    if (this.downloading$.getValue() || this.fileAttachment.uploading) {
      return;
    }

    this.downloading$.next(true);

    if (
      this.fileAttachment.refreshTime &&
      this.fileAttachment.refreshTime.getTime() +
        this.configurationService.getConfiguration().presignedUrlTimeout * 1000 >
        Date.now()
    ) {
      this.downloadFileAttachment(this.fileAttachment);
      return;
    }

    this.store$.dispatch(
      new FileAttachmentsAction.Get({
        ...this.fileAttachment,
        onSuccess: files => this.onRefreshUrlSuccess(files),
        onFailure: error => this.onRefreshUrlFailure(error),
      })
    );
  }

  private onRefreshUrlSuccess(fileAttachments: FileAttachment[]) {
    const fileAttachment = fileAttachments.find(file => file.id === this.fileAttachment.id);
    this.downloadFileAttachment(fileAttachment);
  }

  private onRefreshUrlFailure(error: HttpErrorResponse) {
    this.showErrorNotification(error);
    this.downloading$.next(false);
  }

  private downloadFileAttachment(fileAttachment: FileAttachment) {
    this.fileApiService
      .downloadFile(fileAttachment.presignedUrl)
      .pipe(catchError(error => this.onDownloadFileFailure(error)))
      .subscribe(response => this.onDownloadFileSuccess(response.body));
  }

  private onDownloadFileFailure(error: HttpErrorResponse): Observable<never> {
    this.showErrorNotification(error);

    this.downloading$.next(false);
    return EMPTY;
  }

  private onDownloadFileSuccess(file: Blob) {
    saveAs(file, this.fileAttachment.fileName);
    this.downloading$.next(false);
  }

  private showErrorNotification(error: HttpErrorResponse) {
    if (error && error.status === 404) {
      this.showFileNotExistNotification();
    } else {
      this.showDownloadErrorNotification();
    }
  }

  private showDownloadErrorNotification() {
    this.notificationService.error(
      $localize`:@@file.attachment.download.failure:Could not download the file attachment. Please try again later.`
    );
  }

  private showFileNotExistNotification() {
    this.notificationService.error($localize`:@@file.attachment.not.exist:Could not find the file attachment.`);
  }
}
