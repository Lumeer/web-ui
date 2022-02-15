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
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {GettingStartedService} from '../../getting-started.service';
import {ConfigurationService} from '../../../../../configuration/configuration.service';

@Component({
  selector: 'getting-started-video',
  templateUrl: './getting-started-video.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./getting-started-video.component.scss'],
  host: {class: 'd-block p-3'},
})
export class GettingStartedVideoComponent implements OnInit {
  public videoUrl: SafeResourceUrl;

  constructor(
    private sanitizer: DomSanitizer,
    private service: GettingStartedService,
    private configurationService: ConfigurationService
  ) {}

  public get locale(): string {
    return this.configurationService.getConfiguration().locale;
  }

  public ngOnInit() {
    this.videoUrl = this.makeVideoUrl();
  }

  private makeVideoUrl(): SafeResourceUrl {
    switch (this.service.selectedTemplate?.code) {
      default:
        return this.makeDefaultVideoUrl();
    }
  }

  private makeDefaultVideoUrl(): SafeResourceUrl {
    switch (this.locale) {
      // case LanguageCode.CZ:
      default:
        return this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/G1hx35S13Oo');
    }
  }
}
