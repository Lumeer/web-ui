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
import {FormError, FormValidation, FormViewErrorType} from './form-validation';
import {BehaviorSubject, Observable} from 'rxjs';
import {
  FormAttributeCellConfig,
  FormCell,
  FormCellType,
  FormConfig,
  FormLinkCellConfig,
} from '../../../../../../core/store/form/form-model';
import {DataValue} from '@lumeer/data-filters';
import {Attribute, Collection} from '../../../../../../core/store/collections/collection';
import {FormMode} from '../../mode/form-mode';
import {objectsByIdMap} from '../../../../../../shared/utils/common.utils';
import {FormLinkData} from '../model/form-link-data';
import {arraySubtract} from '../../../../../../shared/utils/array.utils';

@Injectable()
export class FormValidationService {
  public validation$: Observable<FormValidation>;

  private formValidation$ = new BehaviorSubject<FormValidation>({errors: []});

  private mode: FormMode;
  private config: FormConfig;
  private attributesMap: Record<string, Attribute>;
  private documentDataValues: Record<string, DataValue> = {};
  private dataValues: Record<string, DataValue> = {};
  private linkData: Record<string, FormLinkData> = {};

  constructor() {
    this.validation$ = this.formValidation$.asObservable();
  }

  public setMode(mode: FormMode) {
    if (this.mode !== mode) {
      this.mode = mode;
      this.revalidate();
    }
  }

  public setConfig(config: FormConfig) {
    this.config = config;
    this.revalidate();
  }

  public setCollection(collection: Collection) {
    this.attributesMap = objectsByIdMap(collection?.attributes || []);
    this.revalidate();
  }

  public setDataValues(documentDataValues: Record<string, DataValue>, dataValues: Record<string, DataValue>) {
    this.documentDataValues = documentDataValues || {};
    this.dataValues = dataValues || {};
    this.revalidate();
  }

  public setLinkData(data: Record<string, FormLinkData>) {
    this.linkData = data;
    this.revalidate();
  }

  private get isCreating(): boolean {
    return this.mode === FormMode.Create;
  }

  private get isUpdating(): boolean {
    return this.mode === FormMode.Update;
  }

  private revalidate() {
    if (!this.isAllDataDefined()) {
      return;
    }

    const validationErrors: FormError[] = [];
    for (const section of this.config.sections || []) {
      for (const row of section.rows || []) {
        for (const cell of row.cells || []) {
          const cellErrors = this.formCellValidationErrors(cell);
          const cellValidationErrors = cellErrors.map(error => ({
            ...error,
            sectionId: section.id,
            rowId: row.id,
            cellId: cell.id,
          }));
          validationErrors.push(...cellValidationErrors);
        }
      }
    }

    this.formValidation$.next({errors: validationErrors});
  }

  private formCellValidationErrors(cell: FormCell): FormPartialError[] {
    switch (cell?.type) {
      case FormCellType.Attribute:
        return this.attributeCellFormErrors(<FormAttributeCellConfig>cell.config || {});
      case FormCellType.Link:
        return this.linkCellFormErrors(<FormLinkCellConfig>cell.config || {});
    }
  }

  private attributeCellFormErrors(config: FormAttributeCellConfig): FormPartialError[] {
    const errors: FormPartialError[] = [];

    const dataValue = this.getDataValue(config.attributeId);

    if (config.mandatory) {
      const formattedValue = dataValue?.format() || '';
      if (!formattedValue) {
        errors.push({
          type: FormViewErrorType.Mandatory,
          title: $localize`:@@perspective.form.view.validation.attribute.mandatory:Field is mandatory`,
          display: this.isCreating ? !!dataValue : true,
        });
      }
    }

    if (dataValue && !dataValue.isValid()) {
      errors.push({
        type: FormViewErrorType.Validation,
        title: $localize`:@@perspective.form.view.validation.attribute.invalid:Value is not valid`,
        display: true,
      });
    }

    return errors;
  }

  private getDataValue(attributeId: string): DataValue {
    if (this.isCreating) {
      return this.dataValues?.[attributeId];
    }
    return this.documentDataValues?.[attributeId] || this.dataValues?.[attributeId];
  }

  private linkCellFormErrors(config: FormLinkCellConfig): FormPartialError[] {
    const errors: FormPartialError[] = [];

    const linkData = this.linkData?.[config.linkTypeId];

    if (config.minLinks > 0 || config.maxLinks > 0) {
      const selectedIds = [
        ...arraySubtract(linkData?.linkDocumentIds, linkData?.removedDocumentIds),
        ...(linkData?.addedDocumentIds || []),
      ];

      if (selectedIds.length < (config.minLinks || Number.MIN_SAFE_INTEGER)) {
        errors.push({
          type: FormViewErrorType.Validation,
          title: $localize`:@@perspective.form.view.validation.link.minimum:Number of links should be greater than ${config.minLinks}.`,
          display: true,
        });
      } else if (selectedIds.length > (config.maxLinks || Number.MAX_SAFE_INTEGER)) {
        errors.push({
          type: FormViewErrorType.Validation,
          title: $localize`:@@perspective.form.view.validation.link.maximum:Number of links should be lower than ${config.minLinks}.`,
          display: true,
        });
      }
    }

    return errors;
  }

  private isAllDataDefined(): boolean {
    if (!this.attributesMap || !this.config || !this.mode) {
      return false;
    }
    return true;
  }
}

type FormPartialError = Pick<FormError, 'type' | 'title' | 'display'>;
