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
      case TemplateType.PROJ:
        return this.createPROJTemplate();
      case TemplateType.WORK:
        return this.createWORKTemplate();
      case TemplateType.BUG:
        return this.createBUGTemplate();
      case TemplateType.TIME:
        return this.createTIMETemplate();
      case TemplateType.SUPPLY:
        return this.createSupplyTemplate();
      case TemplateType.EDCAL:
        return this.createEdcalTemplate();
      case TemplateType.TASK:
        return this.createTaskTemplate();
      case TemplateType.CRM:
        return this.createCrmTemplate();
      case TemplateType.SCRUM:
        return this.createScrumTemplate();
      case TemplateType.RMTW:
        return this.createRemoteWorkTemplate();
      default:
        return null;
    }
  }

  private createEmptyTemplate(): Template {
    return {
      type: TemplateType.Empty,
      imagePath: 'assets/templates/empty.jpg',
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

  private createPROJTemplate(): Template {
    return {
      type: TemplateType.PROJ,
      imagePath: 'assets/templates/proj.jpg',
      title: this.i18n({id: 'template.proj.title', value: 'Project Tracker'}),
      description: this.i18n({
        id: 'template.proj.description',
        value: 'Manage all your projects like a pro in no time.',
      }),
      url: this.createUrlForType(TemplateType.PROJ),
    };
  }

  private createWORKTemplate(): Template {
    return {
      type: TemplateType.WORK,
      imagePath: 'assets/templates/work.jpg',
      title: this.i18n({id: 'template.work.title', value: 'Work Tracker'}),
      description: this.i18n({
        id: 'template.work.description',
        value: 'Do you have too many balls in the air at the same time? Make their management an easy task.',
      }),
      url: this.createUrlForType(TemplateType.WORK),
    };
  }

  private createTIMETemplate(): Template {
    return {
      type: TemplateType.TIME,
      imagePath: 'assets/templates/time.jpg',
      title: this.i18n({id: 'template.time.title', value: 'Time Management'}),
      description: this.i18n({
        id: 'template.time.description',
        value: 'Getting Things Done. Avoid distractions by urgent things and manage your time efficiently.',
      }),
      url: this.createUrlForType(TemplateType.TIME),
    };
  }

  private createBUGTemplate(): Template {
    return {
      type: TemplateType.BUG,
      imagePath: 'assets/templates/bug.jpg',
      title: this.i18n({id: 'template.bug.title', value: 'Issue Tracker'}),
      description: this.i18n({
        id: 'template.bug.description',
        value: 'No more bugs will ever escape when tracked and organized in this tracker.',
      }),
      url: this.createUrlForType(TemplateType.BUG),
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

  private createSupplyTemplate(): Template {
    return {
      type: TemplateType.SUPPLY,
      imagePath: 'assets/templates/supply.jpg',
      title: this.i18n({id: 'template.supply.title', value: 'Supply Chain Management'}),
      description: this.i18n({
        id: 'template.supply.description',
        value: 'Be ready to move goods to the right location in time to satisfy your customers.',
      }),
      url: this.createUrlForType(TemplateType.SUPPLY),
    };
  }

  private createEdcalTemplate(): Template {
    return {
      type: TemplateType.EDCAL,
      imagePath: 'assets/templates/edcal.jpg',
      title: this.i18n({id: 'template.edcal.title', value: 'Editorial Calendar'}),
      description: this.i18n({
        id: 'template.edcal.description',
        value: 'Any editor picks are now easily planned and visualized.',
      }),
      url: this.createUrlForType(TemplateType.EDCAL),
    };
  }

  private createTaskTemplate(): Template {
    return {
      type: TemplateType.TASK,
      imagePath: 'assets/templates/task.jpg',
      title: this.i18n({id: 'template.task.title', value: 'Task Tracker'}),
      description: this.i18n({
        id: 'template.task.description',
        value: 'No more tasks will be ever missed when tracked and organized in Lumeer.',
      }),
      url: this.createUrlForType(TemplateType.TASK),
    };
  }

  private createCrmTemplate(): Template {
    return {
      type: TemplateType.CRM,
      imagePath: 'assets/templates/crm.jpg',
      title: this.i18n({id: 'template.crm.title', value: 'Sales CRM'}),
      description: this.i18n({
        id: 'template.crm.description',
        value:
          'Win deals your way with a visual CRM to manage accounts, contacts, activities, sales teams, deals, and pipelines.',
      }),
      url: this.createUrlForType(TemplateType.CRM),
    };
  }

  private createScrumTemplate(): Template {
    return {
      type: TemplateType.SCRUM,
      imagePath: 'assets/templates/scrum.jpg',
      title: this.i18n({id: 'template.scrum.title', value: 'Scrum'}),
      description: this.i18n({
        id: 'template.scrum.description',
        value: 'Turn your projects into agile ones with Scrum. Plan sprints, assign tasks and manage your backlog.',
      }),
      url: this.createUrlForType(TemplateType.SCRUM),
    };
  }

  private createRemoteWorkTemplate(): Template {
    return {
      type: TemplateType.RMTW,
      imagePath: 'assets/templates/remote.jpg',
      title: this.i18n({id: 'template.rmtw.title', value: 'Remote Work'}),
      description: this.i18n({
        id: 'template.rmtw.description',
        value:
          'Work anywhere, anytime. Enable remote teams to stay productive. Keep everyone on your team aligned and motivated.',
      }),
      url: this.createUrlForType(TemplateType.RMTW),
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
      case TemplateType.PROJ:
        return this.getPROJUrl();
      case TemplateType.WORK:
        return this.getWORKUrl();
      case TemplateType.TIME:
        return this.getTIMEUrl();
      case TemplateType.BUG:
        return this.getBUGUrl();
      case TemplateType.SUPPLY:
        return this.getSupplyUrl();
      case TemplateType.EDCAL:
        return this.getEdcalUrl();
      case TemplateType.TASK:
        return this.getTaskUrl();
      case TemplateType.CRM:
        return this.getCrmUrl();
      case TemplateType.SCRUM:
        return this.getScrumUrl();
      case TemplateType.RMTW:
        return this.getRemoteWorkUrl();
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
        return this.createUrl('cs/sablona-koordinacia-kandidatov');
      default:
        return this.createUrl('template-candidates-coordination');
    }
  }

  private getPROJUrl(): string {
    switch (environment.locale) {
      case 'cs':
        return this.createUrl('cs/rizeni-projektu');
      default:
        return this.createUrl('project-tracker');
    }
  }

  private getWORKUrl(): string {
    switch (environment.locale) {
      case 'cs':
        return this.createUrl('cs/sablona-vykazy-prace');
      default:
        return this.createUrl('template-work-tracker');
    }
  }

  private getTIMEUrl(): string {
    switch (environment.locale) {
      case 'cs':
        return this.createUrl('cs/sablona-riadenie-energie');
      default:
        return this.createUrl('template-energy-management');
    }
  }

  private getBUGUrl(): string {
    switch (environment.locale) {
      case 'cs':
        return this.createUrl('cs/system-hlaseni-chyb');
      default:
        return this.createUrl('issue-tracker');
    }
  }

  private getSupplyUrl(): string {
    switch (environment.locale) {
      case 'cs':
        return this.createUrl('cs/sablona-manazment-skladovych-zasob');
      default:
        return this.createUrl('template-supply-chain-management');
    }
  }

  private getEdcalUrl(): string {
    switch (environment.locale) {
      case 'cs':
        return this.createUrl('cs/editoruv-vyber');
      default:
        return this.createUrl('editorial-calendar');
    }
  }

  private getTaskUrl(): string {
    switch (environment.locale) {
      case 'cs':
        return this.createUrl('cs/rizeni-ukolu');
      default:
        return this.createUrl('task-tracker');
    }
  }

  private getCrmUrl(): string {
    switch (environment.locale) {
      case 'cs':
        return this.createUrl('cs/prodejni-crm');
      default:
        return this.createUrl('sales-crm');
    }
  }

  public getDateTimeConstraintHelpUrl(): string {
    switch (environment.locale) {
      case 'cs':
        return this.createUrl('cs/typ-sloupce-datum');
      default:
        return this.createUrl('date-column-type');
    }
  }

  public getScrumUrl(): string {
    switch (environment.locale) {
      case 'cs':
        return this.createUrl('cs/scrum-sablona');
      default:
        return this.createUrl('scrum-template');
    }
  }

  public getRemoteWorkUrl(): string {
    switch (environment.locale) {
      case 'cs':
        return this.createUrl('cs/prace-z-domu-sablona');
      default:
        return this.createUrl('remote-work-template');
    }
  }

  private createUrl(suffix: string): string {
    return `${this.baseUrl}/${suffix}`;
  }
}
