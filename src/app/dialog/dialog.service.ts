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
import {Collection} from '../core/store/collections/collection';
import {LinkType} from '../core/store/link-types/link.type';
import {Organization} from '../core/store/organizations/organization';
import {Project} from '../core/store/projects/project';
import {DialogPath} from './dialog-path';
import {environment} from '../../environments/environment';
import {VideosAction} from '../core/store/videos/videos.action';
import {getAllVideos} from '../core/store/videos/videos.data';
import {AppState} from '../core/store/app.state';
import {Store} from '@ngrx/store';

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
  private open: boolean;

  public constructor(private router: Router, private store: Store<AppState>) {
    if (environment.videoKey) {
      this.store.dispatch(new VideosAction.LoadVideos({videos: getAllVideos(), apiKey: environment.videoKey}));
    }
  }

  public closeDialog() {
    this.callback = null;
    this.navigateToDialog(null);
  }

  public openAttributeConfigDialog(collectionId: string, attributeId: string) {
    this.navigateToDialog([DialogPath.ATTRIBUTE_TYPE, collectionId, attributeId]);
  }

  public openCreateOrganizationDialog(callback?: (organization: Organization) => void) {
    this.callback = callback;
    this.navigateToDialog([DialogPath.CREATE_ORGANIZATION]);
  }

  public openCreateProjectDialog(organizationId: string, callback?: (project: Project) => void) {
    this.callback = callback;
    this.navigateToDialog([DialogPath.CREATE_PROJECT, organizationId]);
  }

  public openCreateCollectionDialog(callback?: (collection: Collection) => void) {
    this.callback = callback;
    this.navigateToDialog([DialogPath.CREATE_COLLECTION]);
  }

  public openCreateCollectionAndLinkDialog(linkedCollectionId: string, callback?: (linkType: LinkType) => void) {
    this.callback = callback;
    this.navigateToDialog([DialogPath.CREATE_COLLECTION, linkedCollectionId]);
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

  public isDialogOpen(): boolean {
    return this.open;
  }

  private navigateToDialog(path: any[]) {
    this.open = !!path;
    return this.router.navigate(['', {outlets: {dialog: path}}], {queryParamsHandling: 'preserve'});
  }
}
