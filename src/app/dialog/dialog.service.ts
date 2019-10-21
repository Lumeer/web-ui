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

import {Injectable} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {distinctUntilChanged, filter, map} from 'rxjs/operators';
import {environment} from '../../environments/environment';
import {AppState} from '../core/store/app.state';
import {LinkType} from '../core/store/link-types/link.type';
import {VideosAction} from '../core/store/videos/videos.action';
import {getAllVideos} from '../core/store/videos/videos.data';
import {DialogPath} from './dialog-path';
import {isDialogPathInUrl} from './dialog.utils';
import {isNotNullOrUndefined} from '../shared/utils/common.utils';

/**
 * If callback is provided in any of the open*() methods, the calling component is responsible for closing the dialog
 * inside callback. If it was not implemented this way, the default redirect for closing the dialog would collide with
 * custom redirects made by a calling site inside the callback.
 */
@Injectable({
  providedIn: 'root',
})
export class DialogService {
  public callback: any;

  private open$: Observable<boolean>;

  public constructor(private router: Router, private store: Store<AppState>) {
    if (environment.videoKey) {
      this.store.dispatch(new VideosAction.LoadVideos({videos: getAllVideos(), apiKey: environment.videoKey}));
    }

    this.open$ = this.bindOpen();
  }

  public bindOpen(): Observable<boolean> {
    return this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map((event: NavigationEnd) => isDialogPathInUrl(event.url)),
      distinctUntilChanged()
    );
  }

  public closeDialog(): Promise<boolean> {
    this.callback = null;
    return this.navigateToDialog(null);
  }

  public closeFullscreenDialog(): Promise<boolean> {
    this.callback = null;
    return this.navigateToFullscreenDialog(null);
  }

  public closeAllDialogs() {
    this.closeDialog();
    this.closeFullscreenDialog();
  }

  public openCreateLinkDialog(linkCollectionIds: string, callback?: (linkType: LinkType) => void) {
    this.callback = callback;
    this.navigateToDialog([DialogPath.CREATE_LINK, linkCollectionIds]);
  }

  public openFeedbackDialog() {
    this.navigateToDialog([DialogPath.FEEDBACK]);
  }

  public openShareViewDialog(viewCode: string) {
    this.navigateToDialog([DialogPath.SHARE_VIEW, viewCode]);
  }

  public openVideoPlayer(videoId: string) {
    this.navigateToDialog([DialogPath.PLAY_VIDEO, videoId]);
  }

  private navigateToDialog(path: any[]) {
    return this.router.navigate(['', {outlets: {dialog: path, fsdialog: null}}], {queryParamsHandling: 'preserve'});
  }

  private navigateToFullscreenDialog(path: any[]) {
    return this.router.navigate(['', {outlets: {fsdialog: path, dialog: null}}], {queryParamsHandling: 'preserve'});
  }
}
