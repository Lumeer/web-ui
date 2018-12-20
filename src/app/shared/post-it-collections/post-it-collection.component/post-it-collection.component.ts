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

import {Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {Collection} from '../../../core/store/collections/collection';
import {Workspace} from '../../../core/store/navigation/workspace';
import {convertQueryModelToString} from '../../../core/store/navigation/query.converter';
import {Subject, Subscription} from 'rxjs';
import {debounceTime, filter} from 'rxjs/operators';
import {PostItCollectionNameComponent} from '../collection-name/post-it-collection-name.component';
import {Query} from '../../../core/store/navigation/query';
import {isNullOrUndefined} from '../../utils/common.utils';

declare let $: any;

@Component({
  selector: 'post-it-collection',
  templateUrl: './post-it-collection.component.html',
  styleUrls: ['./post-it-collection.component.scss'],
})
export class PostItCollectionComponent implements OnInit, OnDestroy {
  @Input() public collection: Collection;
  @Input() public focused: boolean;
  @Input() public selected: boolean;
  @Input() public workspace: Workspace;

  @Output() public resize = new EventEmitter();
  @Output() public update = new EventEmitter<Collection>();
  @Output() public create = new EventEmitter<Collection>();
  @Output() public select = new EventEmitter();
  @Output() public unselect = new EventEmitter();
  @Output() public delete = new EventEmitter();
  @Output() public togglePanel = new EventEmitter<any>();
  @Output() public favoriteChange = new EventEmitter<{favorite: boolean; onlyStore: boolean}>();

  @ViewChild(PostItCollectionNameComponent)
  public collectionNameComponent: PostItCollectionNameComponent;

  public isPickerVisible: boolean = false;
  public newDropdownId = 'dropdown-' + Math.floor((1 + Math.random()) * 1000000000000).toString(16);
  private lastSyncedFavorite: boolean;
  private favoriteChange$ = new Subject<boolean>();
  private subscriptions = new Subscription();
  private oldColor: string;
  private oldIcon: string;
  private clickedComponent: any;

  @HostListener('document:click', ['$event'])
  public documentClicked($event): void {
    if (this.clickedComponent && $event.target !== this.clickedComponent) {
      this.collection.icon = this.oldIcon || this.collection.icon;
      this.collection.color = this.oldColor || this.collection.color;
      $event.stopPropagation();
    }
  }

  public ngOnInit() {
    this.subscribeData();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onNameChanged(name: string) {
    if (name === '') {
      return;
    }
    const resourceModel = {...this.collection, name};
    if (this.collection.id) {
      this.update.emit(resourceModel);
    } else {
      this.create.emit(resourceModel);
    }
  }

  public onNameSelect() {
    this.select.emit();
  }

  public onNameUnselect() {
    this.unselect.emit();
    this.resize.emit();
  }

  public onDelete() {
    this.delete.emit();
  }

  public toggleFavorite() {
    if (isNullOrUndefined(this.lastSyncedFavorite)) {
      this.lastSyncedFavorite = this.collection.favorite;
    }

    const value = !this.collection.favorite;
    this.favoriteChange$.next(value);
    this.favoriteChange.emit({favorite: value, onlyStore: true});
  }

  public togglePanelVisible(event, success: boolean): void {
    this.clickedComponent = event.target;

    if (this.isPickerVisible) {
      this.onPickerBlur(success);
    } else {
      this.oldColor = this.collection.color;
      this.oldIcon = this.collection.icon;
      this.isPickerVisible = true;
    }
    this.togglePanel.emit(event);
  }

  public onPickerBlur(success: boolean) {
    if (!this.isPickerVisible) {
      return;
    }

    if (!success) {
      this.collection.icon = this.oldIcon || this.collection.icon;
      this.collection.color = this.oldColor || this.collection.color;
    } else {
      this.oldIcon = null;
      this.oldColor = null;
    }

    this.isPickerVisible = false;
  }

  public workspacePath(): string {
    return `/w/${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }

  public queryForCollectionDocuments(): string {
    const query: Query = {stems: [{collectionId: this.collection.id}]};
    return convertQueryModelToString(query);
  }

  public revertSelectedColor($event: MouseEvent): void {
    this.collection.icon = this.oldIcon || this.collection.icon;
    this.collection.color = this.oldColor || this.collection.color;
    this.togglePanelVisible($event, false);
    $event.stopPropagation();
    $(`#${this.newDropdownId}`).dropdown('toggle');
  }

  public saveSelectedColor($event: MouseEvent): void {
    this.update.emit(this.collection);
    this.togglePanelVisible($event, true);
    $event.stopPropagation();
    $(`#${this.newDropdownId}`).dropdown('toggle');
  }

  private subscribeData() {
    const favoriteChangeSubscription = this.favoriteChange$
      .pipe(
        debounceTime(1000),
        filter(favorite => favorite !== this.lastSyncedFavorite)
      )
      .subscribe(favorite => {
        this.lastSyncedFavorite = null;
        this.favoriteChange.emit({favorite, onlyStore: false});
      });
    this.subscriptions.add(favoriteChangeSubscription);
  }
}
