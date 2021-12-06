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

import {ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {BehaviorSubject, Observable, switchMap} from 'rxjs';
import {FileAttachment} from '../../../../core/store/file-attachments/file-attachment.model';
import {FileDownloadService} from '../file-download.service';
import {objectChanged} from '../../../utils/common.utils';
import {AppState} from '../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {User} from '../../../../core/store/users/user';
import {distinctUntilChanged, filter} from 'rxjs/operators';
import {selectUserById} from '../../../../core/store/users/users.state';

@Component({
  selector: 'file-attachment-button',
  templateUrl: './file-attachment-button.component.html',
  styleUrls: ['./file-attachment-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileAttachmentButtonComponent implements OnInit, OnChanges {
  @Input()
  public fileAttachment: FileAttachment;

  public downloading$: Observable<boolean>;
  public createdByUser$: Observable<User>;

  private createdBy$ = new BehaviorSubject(null);

  constructor(private downloadService: FileDownloadService, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.createdByUser$ = this.createdBy$.pipe(
      distinctUntilChanged(),
      filter(id => !!id),
      switchMap(id => this.store$.pipe(select(selectUserById(id))))
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (objectChanged(changes.fileAttachment)) {
      this.downloading$ = this.downloadService.isDownloading$(this.fileAttachment);
    }
    if (changes.fileAttachment) {
      this.createdBy$.next(this.fileAttachment.createdBy);
    }
  }

  public onClick() {
    this.downloadService.download(this.fileAttachment);
  }
}
