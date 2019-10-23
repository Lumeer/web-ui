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

import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {PickerModule} from '../shared/picker/picker.module';
import {SharedModule} from '../shared/shared.module';
import {DialogBaseComponent} from './dialog-base.component';
import {DialogRoutingModule} from './dialog-routing.module';
import {CreateLinkDialogComponent} from './create-link/create-link-dialog.component';
import {CollectionNameInputComponent} from './shared/collection-name-input/collection-name-input.component';
import {LinkNameInputComponent} from './shared/link-name-input/link-name-input.component';
import {FeedbackDialogComponent} from './dialog/feedback-dialog.component';
import {ShareViewDialogModule} from './share-view/share-view-dialog.module';
import {DialogWrapperModule} from './shared/wrapper/dialog-wrapper.module';
import {PlayVideoComponent} from './play-video/play-video.component';
import {FullscreenDialogComponent} from './fullscreen-dialog/fullscreen-dialog.component';
import {ClickOutsideModule} from 'ng-click-outside';
import {PresenterModule} from '../shared/presenter/presenter.module';

@NgModule({
  imports: [
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    PickerModule,
    PresenterModule,
    DialogRoutingModule,
    DialogWrapperModule,
    ShareViewDialogModule,
    ClickOutsideModule,
  ],
  declarations: [
    CollectionNameInputComponent,
    LinkNameInputComponent,
    CreateLinkDialogComponent,
    DialogBaseComponent,
    FeedbackDialogComponent,
    PlayVideoComponent,
    FullscreenDialogComponent,
  ],
  entryComponents: [CreateLinkDialogComponent],
  exports: [DialogBaseComponent, FullscreenDialogComponent],
})
export class DialogModule {}
