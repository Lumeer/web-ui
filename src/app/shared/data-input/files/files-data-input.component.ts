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
import {HttpEvent, HttpEventType} from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import {Store, select} from '@ngrx/store';

import {BehaviorSubject, Observable, combineLatest, of} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';

import {FilesDataValue} from '@lumeer/data-filters';

import {NotificationService} from '../../../core/notifications/notification.service';
import {FileApiService} from '../../../core/service/file-api.service';
import {AppState} from '../../../core/store/app.state';
import {FileAttachment, FileAttachmentType} from '../../../core/store/file-attachments/file-attachment.model';
import {createFileAttachmentUniqueName} from '../../../core/store/file-attachments/file-attachment.utils';
import {FileAttachmentsAction} from '../../../core/store/file-attachments/file-attachments.action';
import {selectFileAttachmentsByDataCursor} from '../../../core/store/file-attachments/file-attachments.state';
import {KeyCode, keyboardEventCode} from '../../key-code';
import {preventEvent} from '../../utils/common.utils';
import {DataCursor, isDataCursorEntityInitialized} from '../data-cursor';
import {FileDataInputConfiguration} from '../data-input-configuration';
import {FileDownloadService} from './file-download.service';

@Component({
  selector: 'files-data-input',
  templateUrl: './files-data-input.component.html',
  styleUrls: ['./files-data-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FileDownloadService],
})
export class FilesDataInputComponent implements OnInit, OnChanges {
  @Input()
  public cursor: DataCursor;

  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public value: FilesDataValue;

  @Input()
  public configuration: FileDataInputConfiguration;

  @Output()
  public save = new EventEmitter<FilesDataValue>();

  @Output()
  public cancel = new EventEmitter();

  @ViewChild('hiddenInput')
  public hiddenInput: ElementRef<HTMLInputElement>;

  public fileAttachments$: Observable<FileAttachment[]>;

  public uploadProgress$ = new BehaviorSubject<number>(null);
  public removedFilesIds$ = new BehaviorSubject<string[]>([]);
  public dataValue$ = new BehaviorSubject<FilesDataValue>(null);

  private cursor$ = new BehaviorSubject<DataCursor>(null);

  private preparedFile: File;
  private keyDownListener: (event: KeyboardEvent) => void;
  private clickListener: (event: KeyboardEvent) => void;

  constructor(
    public element: ElementRef,
    private fileApiService: FileApiService,
    private notificationService: NotificationService,
    private store$: Store<AppState>
  ) {}

  public ngOnInit() {
    this.fileAttachments$ = combineLatest([this.cursor$, this.removedFilesIds$, this.dataValue$]).pipe(
      switchMap(([cursor, removedFilesIds, dataValue]) => {
        if (cursor && !!(cursor.documentId || cursor.linkInstanceId)) {
          const formattedValue = dataValue?.format() || '';
          return this.store$.pipe(
            select(selectFileAttachmentsByDataCursor(cursor)),
            map(files =>
              files.filter(file => !removedFilesIds.includes(file.id) && formattedValue.includes(file.uniqueName))
            )
          );
        } else {
          return of([]);
        }
      })
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.cursor && this.cursor) {
      this.cursor$.next(this.cursor);

      if (
        this.preparedFile &&
        isDataCursorEntityInitialized(this.cursor) &&
        !isDataCursorEntityInitialized(changes.cursor.previousValue)
      ) {
        this.createFile(this.preparedFile);
      }
    }
    if (changes.value) {
      this.removedFilesIds$.next(this.value?.removedFiles || []);
      this.dataValue$.next(this.value);
    }
    if (changes.readonly) {
      if (this.readonly) {
        this.removeListeners();
        setTimeout(() => this.hiddenInput.nativeElement.blur());
      } else {
        this.addListeners();
        setTimeout(() => this.hiddenInput.nativeElement.focus());
      }
    }
  }

  private addListeners() {
    this.removeListeners();

    this.keyDownListener = event => this.onKeyDown(event);
    this.element.nativeElement.addEventListener('keydown', this.keyDownListener);

    this.clickListener = event => this.onClick(event);
    this.element.nativeElement.addEventListener('click', this.clickListener);
  }

  private removeListeners() {
    if (this.keyDownListener) {
      this.element.nativeElement.removeEventListener('keydown', this.keyDownListener);
    }
    this.keyDownListener = null;

    if (this.clickListener) {
      this.element.nativeElement.removeEventListener('click', this.clickListener);
    }
    this.clickListener = null;
  }

  public onAdd(file: File) {
    if (this.configuration?.saveInMemory) {
      const value = this.value.copy();
      value.addFileInMemory(file);
      this.save.emit(value);
    } else if (isDataCursorEntityInitialized(this.cursor)) {
      this.createFile(file);
    } else {
      this.preparedFile = file;
      this.addFileNameToData(file.name);
    }
  }

  private createFile(file: File) {
    const fileAttachment: FileAttachment = {
      collectionId: this.cursor.collectionId,
      documentId: this.cursor.documentId,
      linkTypeId: this.cursor.linkTypeId,
      linkInstanceId: this.cursor.linkInstanceId,
      attributeId: this.cursor.attributeId,
      attachmentType: this.cursor.collectionId ? FileAttachmentType.Document : FileAttachmentType.Link,
      fileName: file.name,
      uniqueName: createFileAttachmentUniqueName(file.name),
    };

    this.store$.dispatch(
      new FileAttachmentsAction.Create({
        fileAttachment,
        onSuccess: fa => this.uploadFile(fa, file),
        onFailure: () => this.onCreateFailure(),
      })
    );
  }

  private uploadFile(fileAttachment: FileAttachment, file: File) {
    this.fileApiService.uploadFileWithProgress(fileAttachment.presignedUrl, file.type, file).subscribe({
      next: (event: HttpEvent<any>) => {
        switch (event.type) {
          case HttpEventType.Response:
            this.uploadProgress$.next(null);
            this.onSuccess(fileAttachment);
            return;
          case HttpEventType.UploadProgress:
            this.uploadProgress$.next(Math.round((event.loaded / event.total) * 100));
            return;
        }
      },
      error: () => this.onUploadFailure(fileAttachment.id),
    });
  }

  private onSuccess(fileAttachment: FileAttachment) {
    this.showSuccessNotification();
    this.store$.dispatch(new FileAttachmentsAction.SetUploading({fileId: fileAttachment.id, uploading: false}));
    this.addFileNameToData(fileAttachment.uniqueName);
  }

  private showSuccessNotification() {
    this.notificationService.success($localize`:@@file.attachment.upload.success:The file is successfully saved.`);
  }

  private onCreateFailure() {
    this.showErrorNotification();
  }

  private onUploadFailure(fileId: string) {
    this.uploadProgress$.next(null);
    this.removeFileAttachment(fileId);
    this.showErrorNotification();
  }

  private removeFileAttachment(fileId: string) {
    this.store$.dispatch(new FileAttachmentsAction.Remove({fileId}));
  }

  private showErrorNotification() {
    this.notificationService.error(
      $localize`:@@file.attachment.upload.failure:Could not save the file. Please try again later.`
    );
  }

  public onRemoveFile(index: number) {
    const value = this.value.copy();
    value.removeFileInMemory(index);

    this.save.emit(value);
  }

  public onRemoveFileAttachment(fileId: string, fileAttachments: FileAttachment[]) {
    if (this.configuration?.saveInMemory) {
      const value = this.value.copy();
      value.removeFile(fileId);

      this.save.emit(value);
    } else {
      const message = $localize`:@@file.attachment.delete.confirm.message:Do you really want to permanently delete this file?`;
      const title = $localize`:@@file.attachment.delete.confirm.title:Delete file?`;

      this.notificationService.confirmYesOrNo(message, title, 'danger', () => {
        // we don't remove file in server in order to revert function properly
        this.removeFileNameFromData(fileId, fileAttachments);
      });
    }
  }

  private addFileNameToData(fileName: string) {
    const serializedValue = this.value?.serialize();
    const value = serializedValue ? `${serializedValue},${fileName}` : fileName;
    const dataValue = this.value.copy(value);
    this.save.emit(dataValue);
  }

  private removeFileNameFromData(fileId: string, fileAttachments: FileAttachment[]) {
    const value = fileAttachments
      .filter(file => file.id !== fileId)
      .map(file => file.uniqueName)
      .join(',');
    const dataValue = this.value.copy(value);
    this.save.emit(dataValue);
  }

  public onCancel() {
    this.removeListeners();
    this.cancel.emit();
  }

  private onClick(event: KeyboardEvent) {
    preventEvent(event);
    this.hiddenInput.nativeElement.focus();
  }

  private onKeyDown(event: KeyboardEvent) {
    switch (keyboardEventCode(event)) {
      case KeyCode.Escape:
        this.cancel.emit();
        return;
    }
  }
}
