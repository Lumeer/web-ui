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

import {Component, EventEmitter, Input, Output} from '@angular/core';
import {PostItCollectionModel} from '../post-it-collection-model';

@Component({
  selector: 'post-it-collection-name',
  templateUrl: './post-it-collection-name.component.html',
  styleUrls: ['./post-it-collection-name.component.scss']
})
export class PostItCollectionNameComponent {

  private readonly COLLECTION_NAME_COLLAPSED_HEIGHT = 42;

  private readonly COLLECTION_NAME_MAX_HEIGHT = 500;

  private readonly COLLECTION_PLACEHOLDER_NAME = 'Name';

  private readonly COLLECTION_WHITESPACE_COLLAPSED = 'nowrap';

  private readonly COLLECTION_WHITESPACE_EXPANDED = 'normal';

  @Input()
  public postIt: PostItCollectionModel;

  @Input()
  public selected: boolean;

  @Output()
  public changed = new EventEmitter();

  public nameHeight(): string {
    if (this.selected) {
      return `${ this.COLLECTION_NAME_MAX_HEIGHT }px`;
    } else {
      return `${ this.COLLECTION_NAME_COLLAPSED_HEIGHT }px`;
    }
  }

  public nameWrapping(): string {
    if (this.selected) {
      return this.COLLECTION_WHITESPACE_EXPANDED;
    } else {
      return this.COLLECTION_WHITESPACE_COLLAPSED;
    }
  }

  public postItNamePlaceholder(collectionName: HTMLDivElement): string {
    if (this.postIt.collection && this.postIt.collection.id) {
      return '';
    }

    if (this.nameFocused(collectionName)) {
      return '';
    }

    return this.COLLECTION_PLACEHOLDER_NAME;
  }

  public nameFocused(collectionName: HTMLDivElement): boolean {
    return document.activeElement === collectionName;
  }

  public onNameChanged(newCollectionName: HTMLDivElement) {
    this.postIt.collection.name = newCollectionName.textContent;
  }

  public onNameBlurred() {
    if (this.validCollectionName(this.postIt.collection.name)) {
      this.changed.emit();
    }
  }

  private validCollectionName(collectionName: string): boolean {
    return collectionName &&
      collectionName === collectionName.trim();
  }

}
