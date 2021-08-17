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

import {Component, ElementRef, EventEmitter, Input, Output} from '@angular/core';
import {FileAttachment} from '../../../core/store/file-attachments/file-attachment.model';
import {ConfigurationService} from '../../../configuration/configuration.service';
import {NotificationService} from '../../../core/notifications/notification.service';

@Component({
  selector: 'project-upload',
  templateUrl: './project-upload.component.html',
  styleUrls: ['./project-upload.component.css'],
})
export class ProjectUploadComponent {
  @Input()
  public files: FileAttachment[];

  @Input()
  public origin: ElementRef | HTMLElement;

  @Input()
  public uploadProgress: number;

  @Output()
  public add = new EventEmitter<File>();

  constructor(private configurationService: ConfigurationService, private notificationService: NotificationService) {}

  public onFileChange($event: Event) {
    if (this.uploadProgress) {
      const message = $localize`:@@project.settings.upload.inProgress:Previous upload is already in progress. Please wait for it to finish first.`;
      this.notificationService.error(message);

      return;
    }

    const files: FileList = $event.target['files'];

    if (files.length !== 1) {
      return;
    }

    const file = files.item(0);
    const size = this.configurationService.getConfiguration().maxFileUploadSize;

    if (file.size > size * 1024 * 1024) {
      const message = $localize`:@@project.settings.upload.tooLarge:The file size is above the upload limit (${size.toFixed(
        0
      )}:size: MB).`;
      this.notificationService.error(message);

      return;
    }

    this.add.emit(file);
  }
}
