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

import {Component, ChangeDetectionStrategy, OnInit} from '@angular/core';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {Project} from '../../../../../core/store/projects/project';
import {ConfigurationService} from '../../../../../configuration/configuration.service';
import {GettingStartedService} from '../../getting-started.service';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Component({
  selector: 'copy-project',
  templateUrl: './copy-project.component.html',
  styleUrls: ['./copy-project.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyProjectComponent implements OnInit {
  public publicViewUrl$: Observable<SafeUrl>;

  constructor(
    private domSanitizer: DomSanitizer,
    private configurationService: ConfigurationService,
    public service: GettingStartedService
  ) {}

  public ngOnInit() {
    this.publicViewUrl$ = this.service.copyProject$.pipe(map(project => this.createPublicViewUrl(project)));
  }

  private createPublicViewUrl(project: Project): SafeUrl {
    const url = `${this.configurationService.getConfiguration().publicViewCdn}?o=${project?.organizationId}&p=${
      project?.id
    }`;
    return this.domSanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
