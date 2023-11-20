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

import {Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges} from '@angular/core';
import {FileAttachment} from '../../../../../core/store/file-attachments/file-attachment.model';
import {User} from '../../../../../core/store/users/user';
import {isDateValid} from '@lumeer/utils';

@Component({
  selector: 'file-attachment-tooltip',
  templateUrl: './file-attachment-tooltip.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileAttachmentTooltipComponent implements OnChanges {
  @Input()
  public fileAttachment: FileAttachment;

  @Input()
  public createdBy: User;

  public avatarSize = 15;
  public isDateValid: boolean;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.fileAttachment) {
      this.isDateValid = isDateValid(this.fileAttachment.creationDate);
    }
  }
}
