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
import {Injectable} from '@angular/core';

import {Store} from '@ngrx/store';

import {saveAs} from 'file-saver';
import {BehaviorSubject, EMPTY, Observable} from 'rxjs';
import {catchError, map} from 'rxjs/operators';

import {ConfigurationService} from '../../../configuration/configuration.service';
import {NotificationService} from '../../../core/notifications/notification.service';
import {FileApiService} from '../../../core/service/file-api.service';
import {AppState} from '../../../core/store/app.state';
import {FileAttachment} from '../../../core/store/file-attachments/file-attachment.model';
import {FileAttachmentsAction} from '../../../core/store/file-attachments/file-attachments.action';

@Injectable()
export class FileDownloadService {
  private downloading$ = new BehaviorSubject([]);

  constructor(
    private fileApiService: FileApiService,
    private notificationService: NotificationService,
    private store$: Store<AppState>,
    private configurationService: ConfigurationService
  ) {}

  public isDownloading$(attachment: FileAttachment) {
    return this.downloading$.pipe(map(ids => ids.includes(attachment.id)));
  }

  private isDownloading(attachment: FileAttachment) {
    return this.downloading$.value.includes(attachment.id);
  }

  private markDownloadStarted(attachment: FileAttachment) {
    const newIds = [...this.downloading$.value, attachment.id];
    this.downloading$.next(newIds);
  }

  private markDownloadStopped(attachment: FileAttachment) {
    const newIds = this.downloading$.value.filter(id => id !== attachment.id);
    this.downloading$.next(newIds);
  }

  public downloadFile(file: File) {
    showBlob(file);
  }

  public download(attachment: FileAttachment) {
    if (this.isDownloading(attachment) || attachment.uploading) {
      return;
    }

    this.markDownloadStarted(attachment);

    if (
      attachment.refreshTime &&
      attachment.refreshTime.getTime() + this.configurationService.getConfiguration().presignedUrlTimeout * 1000 >
        Date.now()
    ) {
      this.downloadFileAttachment(attachment);
      return;
    }

    this.store$.dispatch(
      new FileAttachmentsAction.Get({
        ...attachment,
        onSuccess: files => this.onRefreshUrlSuccess(files, attachment),
        onFailure: error => this.onRefreshUrlFailure(error, attachment),
      })
    );
  }

  private onRefreshUrlSuccess(fileAttachments: FileAttachment[], attachment: FileAttachment) {
    const fileAttachment = fileAttachments.find(file => file.id === attachment.id);
    this.downloadFileAttachment(fileAttachment);
  }

  private onRefreshUrlFailure(error: HttpErrorResponse, attachment: FileAttachment) {
    this.showErrorNotification(error);
    this.markDownloadStopped(attachment);
  }

  private downloadFileAttachment(attachment: FileAttachment) {
    this.fileApiService
      .downloadFile(attachment.presignedUrl)
      .pipe(catchError(error => this.onDownloadFileFailure(error, attachment)))
      .subscribe(response => this.onDownloadFileSuccess(response.body, attachment));
  }

  private onDownloadFileFailure(error: HttpErrorResponse, attachment: FileAttachment): Observable<never> {
    this.showErrorNotification(error);

    this.markDownloadStopped(attachment);
    return EMPTY;
  }

  private onDownloadFileSuccess(file: Blob, attachment: FileAttachment) {
    saveAs(file, attachment.fileName);
    this.markDownloadStopped(attachment);
  }

  private showErrorNotification(error: HttpErrorResponse) {
    if (error?.status === 404) {
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

function showBlob(blob: Blob | File) {
  const fileURL: any = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = fileURL;
  a.target = '_blank';
  a.click();
}
