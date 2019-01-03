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
import {Observable} from 'rxjs';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {ActivatedRoute} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../core/store/app.state';
import {filter, map, mergeMap} from 'rxjs/operators';
import {selectVideoById} from '../../core/store/videos/videos.state';

@Component({
  selector: 'play-video',
  templateUrl: './play-video.component.html',
  styleUrls: ['./play-video.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayVideoComponent implements OnInit {
  public videoLink: Observable<SafeUrl>;
  public summary$: Observable<string>;

  constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer, private store: Store<AppState>) {}

  public ngOnInit() {
    this.videoLink = this.route.paramMap.pipe(
      map(params => params.get('videoId')),
      filter(
        videoId =>
          !!videoId &&
          videoId.length <= 16 &&
          videoId.indexOf('<') < 0 &&
          videoId.indexOf('"') < 0 &&
          videoId.indexOf("'") < 0
      ),
      map(videoId =>
        this.sanitizer.bypassSecurityTrustResourceUrl(
          `https://www.youtube.com/embed/${videoId}?autoplay=1&fs=1&origin=https://get.lumeer.io/`
        )
      )
    );
    this.summary$ = this.route.paramMap.pipe(
      map(params => params.get('videoId')),
      filter(videoId => !!videoId),
      mergeMap(videoId =>
        this.store.pipe(
          select(selectVideoById(videoId)),
          map(video => video.summary)
        )
      )
    );
  }
}
