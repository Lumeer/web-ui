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

import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {LanguageCode} from '../../core/model/language';
import {ConfigurationService} from '../../configuration/configuration.service';
import {BehaviorSubject} from 'rxjs';
import {shrinkOutAnimation, rotateAnimation} from './get-help.utils';
import {ApplicationTourService} from '../../core/service/application-tour.service';
import {ModalService} from '../modal/modal.service';

@Component({
  selector: 'get-help',
  templateUrl: './get-help.component.html',
  styleUrls: ['./get-help.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [shrinkOutAnimation, rotateAnimation],
})
export class GetHelpComponent implements OnInit {
  public link: string;

  public extendedContent$ = new BehaviorSubject(false);

  constructor(
    private configurationService: ConfigurationService,
    private wizardService: ApplicationTourService,
    private modalService: ModalService
  ) {}

  public ngOnInit() {
    if (this.configurationService.getConfiguration().locale === LanguageCode.CZ) {
      this.link = 'https://www.lumeer.io/cs/pomoc';
    } else {
      this.link = 'https://www.lumeer.io/get-help';
    }
  }

  public openTour() {
    this.toggleContent();
    this.wizardService.restartTour();
  }

  public openVideo() {
    this.toggleContent();
    this.modalService.showOnboardingVideoDialog();
  }

  public openGenInTouch() {
    this.toggleContent();
    this.modalService.showGetInTouchDialog();
  }

  public toggleContent() {
    this.extendedContent$.next(!this.extendedContent$.value);

    // 1. Read documentation
    // 2. Open Application tour
    // 3. Watch introduction video
    // 4. Get in Touch with us
    // 5. subscribe newsletter
    // 6. Book product demo

    // Book product demo
    // Meno; Firma; Industry; Velkost firmy; Describe use-case
  }
}
