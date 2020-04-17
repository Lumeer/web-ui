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

export interface Template {
  imagePath?: string;
  icon?: string;
  title: string;
  description: string;
  type: TemplateType;
  url?: string;
}

export enum TemplateType {
  RMTW = 'RMTW',
  PROJ = 'PROJ',
  WORK = 'WORK',
  SCRUM = 'SCRUM',
  SUPPLY = 'SUPPLY',
  BUG = 'BUG',
  HR = 'HR',
  CRM = 'CRM',
  EDCAL = 'EDCAL',
  OKR = 'OKR',
  TIME = 'TIME',
  TASK = 'TASK',
  CMTRY = 'CMTRY',
  Empty = 'EMPTY',
}

export const templateTypesMap: Record<string, TemplateType> = {
  [TemplateType.Empty]: TemplateType.Empty,
  [TemplateType.OKR]: TemplateType.OKR,
  [TemplateType.HR]: TemplateType.HR,
  [TemplateType.CRM]: TemplateType.CRM,
  [TemplateType.PROJ]: TemplateType.PROJ,
  [TemplateType.WORK]: TemplateType.WORK,
  [TemplateType.TIME]: TemplateType.TIME,
  [TemplateType.BUG]: TemplateType.BUG,
  [TemplateType.SUPPLY]: TemplateType.SUPPLY,
  [TemplateType.EDCAL]: TemplateType.EDCAL,
  [TemplateType.TASK]: TemplateType.TASK,
  [TemplateType.SCRUM]: TemplateType.SCRUM,
  [TemplateType.CMTRY]: TemplateType.CMTRY,
  [TemplateType.RMTW]: TemplateType.RMTW,
};
