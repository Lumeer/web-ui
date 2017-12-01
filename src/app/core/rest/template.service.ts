/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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
import {Observable} from 'rxjs/Observable';

import {TemplateDto} from '../dto/template.dto';
import {LocalStorage} from '../../shared/utils/local-storage';
import {TemplatePartType} from '../store/templates/template.model';

const TEMPLATES_KEY = 'templates';

@Injectable()
export class TemplateService {

  public createTemplate(template: TemplateDto): Observable<TemplateDto> {
    const templates = LocalStorage.get(TEMPLATES_KEY) || {};

    template.id = String(Math.floor(Math.random() * 1000000000000000) + 1);
    templates[template.id] = template;

    LocalStorage.set(TEMPLATES_KEY, templates);

    return Observable.of(template);
  }

  public updateTemplate(template: TemplateDto): Observable<TemplateDto> {
    const templates = LocalStorage.get(TEMPLATES_KEY) || {};

    templates[template.id] = template;

    LocalStorage.set(TEMPLATES_KEY, templates);

    return Observable.of(template);
  }

  public deleteTemplate(id: string): Observable<string> {
    const templates = LocalStorage.get(TEMPLATES_KEY) || {};

    delete templates[id];

    LocalStorage.set(TEMPLATES_KEY, templates);

    return Observable.of(id);
  }

  public getTemplatesById(id: string): Observable<TemplateDto[]> {
    const templates = LocalStorage.get(TEMPLATES_KEY) || {};

    const template: TemplateDto = templates[id];
    const childIds = template.parts.filter(part => part.type === TemplatePartType.Embedded)
      .map(part => part.templateId);

    if (childIds.length === 0) {
      return Observable.of([template]);
    }

    return Observable.combineLatest(
      [].concat.apply([], childIds.map(id => this.getTemplatesById(id)))
    );
  }

}
