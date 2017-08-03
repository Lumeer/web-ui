/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
 */

import {Component, Input} from '@angular/core';

import {Collection} from '../../../../../core/dto/collection';
import {Document} from '../../../../../core/dto/document';

@Component({
  selector: 'post-it-document',
  templateUrl: './post-it-document.component.html',
  styleUrls: ['./post-it-document.component.scss']
})
export class PostItDocumentComponent {

  @Input()
  public collection: Collection;

  @Input()
  public document: Document;

  @Input()
  public editable: boolean;

  // /**
  //  * Toggles edit menu on/ off
  //  */
  // public toggleEditing(event: MouseEvent): void {
  //   // havent selected document yet
  //   if (isUndefined(this.currentlyClickedDocument)) {
  //     return;
  //   }
  //
  //   // dislable previous
  //   if (this.lastClickedDocument) {
  //     this.documents[this.lastClickedDocument].edited = false;
  //   }
  //
  //   let document = this.documents[this.currentlyClickedDocument];
  //
  //   // if clicked on editSwitch
  //   if (this.getEditSwitch(this.currentlyClickedDocument).contains(event.target)) {
  //     document.edited = !document.edited;
  //     return;
  //   }
  //
  //   // if clicked on document
  //   if (this.getDocumentElement(this.currentlyClickedDocument).contains(event.target)) {
  //     return;
  //   }
  //
  //   // click outside
  //   document.edited = false;
  // }
  //
  // /**
  //  * Save indexes of currently and preciously clicked documents
  //  */
  // public documentClick(idx: number): void {
  //   if (idx === this.currentlyClickedDocument) {
  //     return;
  //   }
  //
  //   this.lastClickedDocument = this.currentlyClickedDocument;
  //   this.currentlyClickedDocument = idx;
  // }

  /**
   * @returns {string} Color of background of edit button
   */
  public editBackground(document: Document): string {
    if (document.edited) {
      return '#E2E2E4';
    }

    if (document.underCursor) {
      return '#EFEFEF';
    }

    return 'transparent';
  }

}
