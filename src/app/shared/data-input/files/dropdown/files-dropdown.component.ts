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

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {BehaviorSubject, Subscription} from 'rxjs';
import {FileAttachment} from '../../../../core/store/file-attachments/file-attachment.model';
import {DropdownComponent} from '../../../dropdown/dropdown.component';
import {DropdownPosition} from '../../../dropdown/dropdown-position';
import {FileDownloadService} from '../file-download.service';
import {AppState} from '../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectServiceLimitsByWorkspace} from '../../../../core/store/organizations/service-limits/service-limits.state';

@Component({
  selector: 'files-dropdown',
  templateUrl: './files-dropdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilesDropdownComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input()
  public filesAttachments: FileAttachment[];

  @Input()
  public files: File[];

  @Input()
  public origin: ElementRef | HTMLElement;

  @Input()
  public uploadProgress: number;

  @Output()
  public add = new EventEmitter<File>();

  @Output()
  public removeFileAttachment = new EventEmitter<string>();

  @Output()
  public removeFile = new EventEmitter<number>();

  @Output()
  public cancel = new EventEmitter();

  @ViewChild(DropdownComponent)
  public dropdown: DropdownComponent;

  public fileSizeError$ = new BehaviorSubject(null);

  public readonly dropdownPositions = [
    DropdownPosition.BottomStart,
    DropdownPosition.BottomEnd,
    DropdownPosition.TopStart,
    DropdownPosition.TopEnd,
  ];

  private fileSizeMb: number;
  private subscriptions = new Subscription();

  constructor(private downloadService: FileDownloadService, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.subscriptions.add(
      this.store$
        .pipe(select(selectServiceLimitsByWorkspace))
        .subscribe(limits => (this.fileSizeMb = limits?.fileSizeMb || 0))
    );
  }

  private get maxFileUploadSize(): number {
    return this.fileSizeMb * 1024 * 1024;
  }

  public ngAfterViewInit() {
    this.dropdown.open();
  }

  public onClick(event: MouseEvent) {
    // otherwise it is immediately closed in table
    event.stopPropagation();
  }

  public onFileChange(event: Event) {
    if (this.uploadProgress) {
      return;
    }

    const files: FileList = event.target['files'];

    if (files.length !== 1) {
      return;
    }

    const file = files.item(0);

    if (file.size > this.maxFileUploadSize * 1024 * 1024) {
      this.showFileSizeError();
      return;
    }

    this.fileSizeError$.next(null);
    this.add.emit(file);
  }

  private showFileSizeError() {
    const size = this.fileSizeMb.toFixed(0);
    this.fileSizeError$.next(
      $localize`:@@file.upload.max.size.error:Cannot process files bigger than ${size}:size: MB. Please upload smaller file.`
    );
    setTimeout(() => this.dropdown?.updatePosition());
  }

  public onRemoveFileAttachment(fileId: string) {
    this.removeFileAttachment.emit(fileId);
  }

  public onRemoveFile(index: number) {
    this.removeFile.emit(index);
  }

  public onCancel() {
    this.cancel.emit();
  }

  public close() {
    this.dropdown?.close();
  }

  public onAttachmentClick(file: FileAttachment) {
    this.downloadService.download(file);
  }

  public onFileClick(file: File) {
    this.downloadService.downloadFile(file);
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
