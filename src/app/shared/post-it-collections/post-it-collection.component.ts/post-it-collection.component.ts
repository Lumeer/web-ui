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
import {CollectionModel} from '../../../core/store/collections/collection.model';
import {PostItLayout} from '../../utils/layout/post-it-layout';
import {Workspace} from '../../../core/store/navigation/workspace.model';
import {QueryConverter} from '../../../core/store/navigation/query.converter';
import {QueryModel} from '../../../core/store/navigation/query.model';
import {Role} from '../../../core/model/role';

@Component({
  selector: 'post-it-collection',
  templateUrl: './post-it-collection.component.html',
  styleUrls: ['./post-it-collection.component.scss']
})
export class PostItCollectionComponent {

  @Input() public collection: CollectionModel;
  @Input() public layout: PostItLayout;
  @Input() public focused: boolean;
  @Input() public selected: boolean;
  @Input() public userRoles: string[];
  @Input() public workspace: Workspace;

  @Output() public update = new EventEmitter<CollectionModel>();
  @Output() public create = new EventEmitter<CollectionModel>();
  @Output() public select = new EventEmitter();
  @Output() public unselect = new EventEmitter();
  @Output() public delete = new EventEmitter();
  @Output() public togglePanel = new EventEmitter<any>();


  public isPickerVisible: boolean = false;
  private lastIcon: string;
  private lastColor: string;

  public onNameChanged(name: string) {
    const resourceModel = {...this.collection, name};
    if(this.collection.id) {
      this.update.emit(resourceModel);
    }else{
      this.create.emit(resourceModel);
    }
  }

  public onNameSelect() {
    this.select.emit();
  }

  public onNameUnselect() {
    this.unselect.emit();
  }

  public onDelete() {
    this.delete.emit();
  }


  public toggleFavorite() {
    // TODO

  }

  public togglePanelVisible(event) {
    this.isPickerVisible = true;
    this.togglePanel.emit(event);
  }

  public onNewColor(color: string) {
    this.lastColor = color;
  }

  public onNewIcon(icon: string) {
    this.lastIcon = icon;
  }

  public onPickerBlur() {
    if (!this.isPickerVisible) return;

    if (this.collection.id) {
      if (this.shouldUpdateIcons()) {
        const resourceModel = {
          ...this.collection,
          icon: this.lastIcon || this.collection.icon,
          color: this.lastColor || this.collection.color
        };
        this.update.emit(resourceModel);
      }
    }

    this.isPickerVisible = false;
  }

  private shouldUpdateIcons(): boolean {
    return (this.lastIcon && this.collection.icon !== this.lastIcon) ||
      (this.lastColor && this.collection.color !== this.lastColor);
  }

  public workspacePath(): string {
    return `/w/${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }

  public queryForCollectionDocuments(): string {
    const query: QueryModel = {collectionIds: [this.collection.id]};
    return QueryConverter.toString(query);
  }

  public hasManageRole(): boolean {
    return this.hasRole(Role.Manage);
  }

  public hasWriteRole(): boolean {
    return this.hasRole(Role.Write);
  }

  private hasRole(role: string): boolean {
    const roles = this.userRoles || [];
    return roles.includes(role);
  }


}
