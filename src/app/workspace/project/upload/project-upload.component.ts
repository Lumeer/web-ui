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
import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';

import {Store, select} from '@ngrx/store';

import {Subscription} from 'rxjs';

import {DEFAULT_FILE_SIZE_MB} from '../../../core/constants';
import {NotificationService} from '../../../core/notifications/notification.service';
import {AppState} from '../../../core/store/app.state';
import {selectServiceLimitsByWorkspace} from '../../../core/store/organizations/service-limits/service-limits.state';

@Component({
  selector: 'project-upload',
  templateUrl: './project-upload.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectUploadComponent implements OnInit, OnDestroy {
  @Input()
  public uploadProgress: number;

  @Output()
  public add = new EventEmitter<File>();

  private fileSizeMb = DEFAULT_FILE_SIZE_MB;
  private subscriptions = new Subscription();

  constructor(
    private store$: Store<AppState>,
    private notificationService: NotificationService
  ) {}

  public ngOnInit() {
    this.subscriptions.add(
      this.store$
        .pipe(select(selectServiceLimitsByWorkspace))
        .subscribe(limits => (this.fileSizeMb = limits?.fileSizeMb || DEFAULT_FILE_SIZE_MB))
    );
  }

  private get maxFileUploadSize(): number {
    return this.fileSizeMb * 1024 * 1024;
  }

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
    if (file.size > this.maxFileUploadSize) {
      const message = $localize`:@@project.settings.upload.tooLarge:The file size is above the upload limit (${this.fileSizeMb.toFixed(
        0
      )}:size: MB).`;
      this.notificationService.error(message);
    } else {
      this.add.emit(file);
    }
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
