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

import {
  Component,
  ChangeDetectionStrategy,
  Input,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {Router} from '@angular/router';
import {checkSizeType, SearchViewsConfig} from '../../../../../../core/store/searches/search';
import {QueryData} from '../../../../../../shared/top-panel/search-box/util/query-data';
import {View} from '../../../../../../core/store/views/view';
import {ViewFavoriteToggleService} from '../../../../../../shared/toggle/view-favorite-toggle.service';
import {Query} from '../../../../../../core/store/navigation/query/query';
import {Workspace} from '../../../../../../core/store/navigation/workspace';
import {AllowedPermissions} from '../../../../../../core/model/allowed-permissions';
import {SizeType} from '../../../../../../shared/slider/size/size-type';
import {createObjectFolders, ObjectFolders} from './util/object-folders';

@Component({
  selector: 'views-folders-content',
  templateUrl: './views-folders-content.component.html',
  styleUrls: ['./views-folders-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ViewFavoriteToggleService],
})
export class ViewsFoldersContentComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public config: SearchViewsConfig;

  @Input()
  public views: View[];

  @Input()
  public queryData: QueryData;

  @Input()
  public query: Query;

  @Input()
  public workspace: Workspace;

  @Input()
  public permissions: Record<string, AllowedPermissions>;

  @Input()
  public foldersPath: string[];

  @Output()
  public configChange = new EventEmitter<SearchViewsConfig>();

  @Output()
  public folderPathChange = new EventEmitter<string[]>();

  public currentSize: SizeType;
  public viewFolders: ObjectFolders<View>;

  constructor(private router: Router, private toggleService: ViewFavoriteToggleService) {}

  public ngOnInit() {
    this.toggleService.setWorkspace(this.workspace);
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.config) {
      this.currentSize = checkSizeType(this.config?.size);
    }
    if (changes.views) {
      this.viewFolders = createObjectFolders(this.views);
    }
  }

  public onSizeChange(size: SizeType) {
    const newConfig: SearchViewsConfig = {...this.config, size};
    this.configChange.emit(newConfig);
  }

  public showView(view: View) {
    this.router.navigate(['/w', this.workspace.organizationCode, this.workspace.projectCode, 'view', {vc: view.code}]);
  }

  public onFavoriteToggle(view: View) {
    this.toggleService.set(view.id, !view.favorite);
  }

  public ngOnDestroy() {
    this.toggleService.onDestroy();
  }

  public showFolder(name: string) {
    const pathCopy = [...(this.foldersPath || []), name];
    this.folderPathChange.emit(pathCopy);
  }
}
