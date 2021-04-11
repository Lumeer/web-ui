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
import {Perspective} from '../../../../perspective';
import {SearchTab} from '../../../../../../core/store/navigation/search-tab';
import {convertQueryModelToString} from '../../../../../../core/store/navigation/query/query.converter';

@Component({
  selector: 'views-preview-content',
  templateUrl: './views-preview-content.component.html',
  styleUrls: ['./views-preview-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ViewFavoriteToggleService],
})
export class ViewsPreviewContentComponent implements OnInit, OnChanges, OnDestroy {
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

  @Output()
  public configChange = new EventEmitter<SearchViewsConfig>();

  public readonly maxViews: number;

  public currentSize: SizeType;
  public truncateContent: boolean;

  constructor(private router: Router, private toggleService: ViewFavoriteToggleService) {}

  public ngOnInit() {
    this.toggleService.setWorkspace(this.workspace);
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.config) {
      this.currentSize = checkSizeType(this.config?.size);
    }
    if (changes.views || changes.maxViews) {
      this.truncateContent = this.maxViews > 0 && this.maxViews < this.views?.length;
    }
  }

  public onSizeChange(size: SizeType) {
    const newConfig: SearchViewsConfig = {...this.config, size};
    this.configChange.emit(newConfig);
  }

  public trackByView(index: number, view: View): string {
    return view.id;
  }

  public onShowAll() {
    this.router.navigate([this.workspacePath(), 'view', Perspective.Search, SearchTab.Views], {
      queryParams: {q: convertQueryModelToString(this.query)},
    });
  }

  private workspacePath(): string {
    return `/w/${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }

  public onFavoriteToggle(view: View) {
    this.toggleService.set(view.id, !view.favorite);
  }

  public ngOnDestroy() {
    this.toggleService.onDestroy();
  }
}
