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

import {Component, ChangeDetectionStrategy, Input, SimpleChanges, OnChanges} from '@angular/core';
import {Project} from '../../../../core/store/projects/project';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {ConfigurationService} from '../../../../configuration/configuration.service';

@Component({
  selector: 'copy-project-content',
  templateUrl: './copy-project-content.component.html',
  styleUrls: ['./copy-project-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyProjectContentComponent implements OnChanges {
  @Input()
  public project: Project;

  public publicViewUrl: SafeUrl;

  constructor(private domSanitizer: DomSanitizer, private configurationService: ConfigurationService) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.project && this.project) {
      this.publicViewUrl = this.createPublicViewUrl();
    }
  }

  private createPublicViewUrl(): SafeUrl {
    const url = `${this.configurationService.getConfiguration().publicViewCdn}?o=${this.project.organizationId}&p=${
      this.project.id
    }`;
    return this.domSanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
