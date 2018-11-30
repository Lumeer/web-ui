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

import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {AppState} from '../core/store/app.state';
import {VideosAction} from '../core/store/videos/videos.action';
import {environment} from '../../environments/environment';
import {VideosData} from '../core/store/videos/videos.data';

@Injectable({
  providedIn: 'root',
})
export class VideoPlayerService {
  private open: boolean;

  constructor(private router: Router, private store: Store<AppState>) {
    if (environment.videoKey) {
      this.store.dispatch(new VideosAction.LoadVideos({videos: VideosData.allVideos, apiKey: environment.videoKey}));
    }
  }

  public closePlayer(): Promise<boolean> {
    return this.navigateToPlayer(null);
  }

  public openPlayer(videoId: string): Promise<boolean> {
    return this.navigateToPlayer([videoId]);
  }

  public isPlayerOpen(): boolean {
    return this.open;
  }

  private navigateToPlayer(path: any[]): Promise<boolean> {
    this.open = !!path;
    return this.router.navigate(['', {outlets: {video: path}}], {queryParamsHandling: 'preserve'});
  }
}
