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

import {Injectable} from '@angular/core';

import {I18n} from '@ngx-translate/i18n-polyfill';
import {Template, TemplateType} from '../model/template';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TemplateService {
  private readonly baseUrl = 'https://www.lumeer.io';

  constructor(private i18n: I18n) {}

  public getTemplates(): Template[] {
    return Object.values(TemplateType)
      .map(type => this.createTemplate(type))
      .filter(template => !!template);
  }

  private createTemplate(type: TemplateType): Template {
    switch (type) {
      case TemplateType.Empty:
        return this.createEmptyTemplate();
      case TemplateType.OKR:
        return this.createOKRTemplate();
      case TemplateType.HR:
        return this.createHRTemplate();
      default:
        return null;
    }
  }

  private createEmptyTemplate(): Template {
    return {
      type: TemplateType.Empty,
      icon: 'fal fa-empty-set',
      title: this.i18n({id: 'template.empty.title', value: 'Empty'}),
      description: this.i18n({id: 'template.empty.description', value: 'Build your project from scratch'}),
      url: this.createUrlForType(TemplateType.Empty),
    };
  }

  private createOKRTemplate(): Template {
    return {
      type: TemplateType.OKR,
      imagePath: 'assets/templates/okr.jpg',
      title: this.i18n({id: 'template.okr.title', value: 'OKR Tracking'}),
      description: this.i18n({
        id: 'template.okr.description',
        value:
          'Set your objectives, their measurements, and initiatives moving you in the right direction. You can track your progress and see how things are getting done.',
      }),
      url: this.createUrlForType(TemplateType.OKR),
    };
  }

  private createHRTemplate(): Template {
    return {
      type: TemplateType.HR,
      imagePath: 'assets/templates/hr.jpg',
      title: this.i18n({id: 'template.hr.title', value: 'Candidates Coordination'}),
      description: this.i18n({
        id: 'template.hr.description',
        value: 'Ensure your candidates have the best experience interviewing with your team.',
      }),
      url: this.createUrlForType(TemplateType.HR),
    };
  }

  private createUrlForType(type: TemplateType): string | null {
    switch (type) {
      case TemplateType.Empty:
        return null;
      case TemplateType.OKR:
        return this.getOKRUrl();
      case TemplateType.HR:
        return this.getHRUrl();
    }
  }

  private getOKRUrl(): string {
    switch (environment.locale) {
      case 'cs':
        return this.createUrl('cs/cile-s-okr');
      default:
        return this.createUrl('okr');
    }
  }

  private getHRUrl(): string {
    switch (environment.locale) {
      case 'cs':
        return this.createUrl('cs/koordinace-kandidatu');
      default:
        return this.createUrl('tracking-job-candidates');
    }
  }

  private createUrl(suffix: string): string {
    return `${this.baseUrl}/${suffix}`;
  }
}
