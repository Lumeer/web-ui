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

import {Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges} from '@angular/core';
import {View} from '../../../../../../../core/store/views/view';
import {Perspective} from '../../../../../perspective';
import {PerspectiveConfiguration} from '../../../../../perspective-configuration';
import {SearchTab} from '../../../../../../../core/store/navigation/search-tab';
import {objectChanged} from '../../../../../../../shared/utils/common.utils';
import {AppState} from '../../../../../../../core/store/app.state';
import {Store} from '@ngrx/store';
import {FileAttachmentsAction} from '../../../../../../../core/store/file-attachments/file-attachments.action';
import {ViewSettingsService} from '../../../../../../../core/service/view-settings.service';

@Component({
  selector: 'perspective-preview',
  templateUrl: './perspective-preview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'perspective-preview'},
})
export class PerspectivePreviewComponent implements OnChanges {
  @Input()
  public view: View;

  @Input()
  public perspectiveConfiguration: PerspectiveConfiguration;

  public readonly perspective = Perspective;
  public readonly searchTab = SearchTab;

  constructor(private store$: Store<AppState>, private viewSettingsService: ViewSettingsService) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (objectChanged(changes.view) && this.view) {
      this.store$.dispatch(new FileAttachmentsAction.GetByView({viewId: this.view.id}));

      this.viewSettingsService.checkViewSettings(changes.view.previousValue, changes.view.currentValue);
    }
  }
}
