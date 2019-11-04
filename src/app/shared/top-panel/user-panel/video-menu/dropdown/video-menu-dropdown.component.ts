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

import {Component, ChangeDetectionStrategy, Input, ElementRef, ViewChild, EventEmitter, Output} from '@angular/core';
import {VideoModel} from '../../../../../core/store/videos/video.model';
import {DropdownComponent} from '../../../../dropdown/dropdown.component';
import {DropdownPosition} from '../../../../dropdown/dropdown-position';

@Component({
  selector: 'video-menu-dropdown',
  templateUrl: './video-menu-dropdown.component.html',
  styleUrls: ['./video-menu-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoMenuDropdownComponent {
  @Input()
  public videos: VideoModel[];

  @Input()
  public origin: ElementRef | HTMLElement;

  @Output()
  public openPlayer = new EventEmitter<VideoModel>();

  @ViewChild(DropdownComponent, {static: false})
  public dropdown: DropdownComponent;

  public readonly dropdownPositions = [DropdownPosition.BottomEnd];

  public trackByVideo(index: number, video: VideoModel): string {
    return video.id;
  }

  public onVideoClick(video: VideoModel) {
    this.openPlayer.emit(video);
  }

  public open() {
    if (this.dropdown) {
      this.dropdown.open();
    }
  }

  public close() {
    if (this.dropdown) {
      this.dropdown.close();
    }
  }
}
