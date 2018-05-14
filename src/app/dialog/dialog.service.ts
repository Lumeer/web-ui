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
import {CollectionModel} from '../core/store/collections/collection.model';
import {LinkTypeModel} from '../core/store/link-types/link-type.model';
import {DialogPath} from './dialog-path';

/**
 * If callback is provided in any of the open*() methods, the calling component is responsible for closing the dialog
 * inside callback. If it was not implemented this way, the default redirect for closing the dialog would collide with
 * custom redirects made by a calling site inside the callback.
 */
@Injectable()
export class DialogService {

  public callback: any;

  public constructor(private router: Router) {
  }

  public closeDialog() {
    this.callback = null;
    this.navigateToDialog(null);
  }

  public openCreateCollectionDialog(callback?: (collection: CollectionModel) => void) {
    this.callback = callback;
    this.navigateToDialog([DialogPath.CREATE_COLLECTION]);
  }

  public openCreateCollectionAndLinkDialog(linkedCollectionId: string, callback?: (linkType: LinkTypeModel) => void) {
    this.callback = callback;
    this.navigateToDialog([DialogPath.CREATE_COLLECTION, linkedCollectionId]);
  }

  public openCreateLinkDialog(linkCollectionIds: string, callback?: (linkType: LinkTypeModel) => void) {
    this.callback = callback;
    this.navigateToDialog([DialogPath.CREATE_LINK, linkCollectionIds]);
  }

  public openOverwriteViewDialog(existingViewCode: string, callback?: () => void) {
    this.callback = callback;
    this.navigateToDialog([DialogPath.OVERWRITE_VIEW, existingViewCode]);
  }

  public openShareViewDialog() {
    this.navigateToDialog([DialogPath.SHARE_VIEW]);
  }

  private navigateToDialog(path: any[]) {
    return this.router.navigate(['', {outlets: {dialog: path}}], {queryParamsHandling: 'preserve'});
  }

}
