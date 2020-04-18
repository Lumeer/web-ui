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

import {Component, OnInit, ChangeDetectionStrategy, Input, HostListener} from '@angular/core';
import {VideoModel} from '../../../../../core/store/videos/video.model';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {DialogType} from '../../../../modal/dialog-type';

@Component({
  templateUrl: './play-video-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayVideoModalComponent implements OnInit {
  @Input()
  public video: VideoModel;

  public readonly dialogType = DialogType;

  public videoUrl: SafeResourceUrl;

  constructor(private bsRef: BsModalRef, private sanitizer: DomSanitizer) {}

  public ngOnInit() {
    this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${this.video.id}?autoplay=1&fs=1&origin=https://get.lumeer.io/`
    );
  }

  public hideDialog() {
    this.bsRef.hide();
  }
}
