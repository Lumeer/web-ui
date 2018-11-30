/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {AppState} from '../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {VideoModel} from '../../../../core/store/videos/video.model';
import {selectVideosByUrl} from '../../../../core/store/videos/videos.state';
import {VideoPlayerService} from '../../../../video-player/video-player.service';
import {Router} from '@angular/router';

@Component({
  selector: 'video-menu',
  templateUrl: './video-menu.component.html',
  styleUrls: ['./video-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoMenuComponent implements OnInit {
  public videos$: Observable<VideoModel[]>;

  constructor(private store: Store<AppState>, private videoPlayerService: VideoPlayerService, private router: Router) {}

  public ngOnInit(): void {
    this.videos$ = this.store.pipe(select(selectVideosByUrl('')));
    /*this.videos$ = this.router.events
      .pipe(
        filter(event => event instanceof NavigationStart),
        mergeMap((event: NavigationStart) => this.store.pipe(select(selectVideosByUrl(event.url))))
      );*/
  }

  public openPlayer(id: string): void {
    this.videoPlayerService.openPlayer(id);
  }
}
