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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';

import {Project} from '../../../../core/store/projects/project';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Query} from '../../../../core/store/navigation/query/query';
import {ResourceType} from '../../../../core/model/resource-type';
import {CollectionImportData} from '../import-button/post-it-collection-import-button.component';

@Component({
  selector: 'empty-collections',
  templateUrl: './empty-collections.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyCollectionsComponent {
  @Input()
  public query: Query;

  @Input()
  public project: Project;

  @Output()
  public newCollection = new EventEmitter();

  @Output()
  public error = new EventEmitter<string>();

  @Output()
  public import = new EventEmitter<CollectionImportData>();

  public readonly projectType = ResourceType.Project;

  constructor(public i18n: I18n) {}

  public onNewCollection() {
    this.newCollection.emit();
  }

  public onError(message: string) {
    this.error.emit(message);
  }

  public onImport(importInfo: CollectionImportData) {
    this.import.emit(importInfo);
  }
}
