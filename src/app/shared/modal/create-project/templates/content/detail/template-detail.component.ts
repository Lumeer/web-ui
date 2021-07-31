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

import {Component, ChangeDetectionStrategy, Input, EventEmitter, Output, OnChanges, SimpleChanges} from '@angular/core';
import {Project} from '../../../../../../core/store/projects/project';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {ConfigurationService} from '../../../../../../configuration/configuration.service';

@Component({
  selector: 'template-detail',
  templateUrl: './template-detail.component.html',
  styleUrls: ['./template-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateDetailComponent implements OnChanges {
  @Input()
  public template: Project;

  @Output()
  public selectTag = new EventEmitter<string>();

  public publicViewUrl: SafeUrl;

  constructor(private domSanitizer: DomSanitizer, private configurationService: ConfigurationService) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.template && this.template) {
      this.publicViewUrl = this.createPublicViewUrl();
    }
  }

  private createPublicViewUrl(): SafeUrl {
    const url = `${this.configurationService.getConfiguration().publicViewCdn}?o=${
      this.template.templateMetadata?.organizationId
    }&p=${this.template.id}`;
    return this.domSanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
