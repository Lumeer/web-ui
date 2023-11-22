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

import Big from 'big.js';
import {Observable, Subject} from 'rxjs';
import {debounceTime, map} from 'rxjs/operators';

import {
  ConstraintType,
  DataValue,
  DateTimeConstraint,
  NumberConstraint,
  PercentageConstraint,
  TextConstraint,
} from '@lumeer/data-filters';
import {objectsByIdMap} from '@lumeer/utils';

import {Attribute, Collection} from '../../../../../../core/store/collections/collection';
import {
  FormAttributeCellConfig,
  FormCell,
  FormCellType,
  FormConfig,
  FormLinkCellConfig,
} from '../../../../../../core/store/form/form-model';
import {arraySubtract} from '../../../../../../shared/utils/array.utils';
import {mergeAttributeOverride} from '../../../../../../shared/utils/attribute.utils';
import {FormLinkData, FormLinkSelectedData} from '../model/form-link-data';
import {FormError, FormValidation, FormViewErrorType} from './form-validation';

@Injectable()
export class FormValidationService {
  public validation$: Observable<FormValidation>;

  private revalidateSubject$ = new Subject();

  private documentId: string;
  private config: FormConfig;
  private attributesMap: Record<string, Attribute>;
  private documentDataValues: Record<string, DataValue> = {};
  private userDataValues: Record<string, DataValue> = {};
  private linkData: Record<string, FormLinkData> = {};
  private userLinkData: Record<string, FormLinkSelectedData> = {};

  constructor() {
    this.validation$ = this.revalidateSubject$.pipe(
      debounceTime(50),
      map(() => this.validate())
    );
  }

  public setConfig(config: FormConfig) {
    this.config = config;
    this.checkValidation();
  }

  public setCollection(collection: Collection) {
    this.attributesMap = objectsByIdMap(collection?.attributes || []);
    this.checkValidation();
  }

  public setDataValues(documentDataValues: Record<string, DataValue>, dataValues: Record<string, DataValue>) {
    this.documentDataValues = documentDataValues || {};
    this.userDataValues = dataValues || {};
    this.checkValidation();
  }

  public setLinkData(data: Record<string, FormLinkData>, selectedLinkData: Record<string, FormLinkSelectedData>) {
    this.linkData = data;
    this.userLinkData = selectedLinkData;
    this.checkValidation();
  }

  public setDocumentId(documentId: string) {
    this.documentId = documentId;
    this.checkValidation();
  }

  private get isCreating(): boolean {
    return !this.documentId;
  }

  private checkValidation() {
    if (!this.isAllDataDefined()) {
      return;
    }

    this.revalidateSubject$.next(null);
  }

  private validate(): FormValidation {
    const errors = (this.config?.sections || []).reduce((errors, section) => {
      for (const row of section.rows || []) {
        for (const cell of row.cells || []) {
          const cellErrors = this.formCellValidationErrors(cell);
          const cellValidationErrors = cellErrors.map(error => ({
            ...error,
            sectionId: section.id,
            rowId: row.id,
            cellId: cell.id,
          }));
          errors.push(...cellValidationErrors);
        }
      }
      return errors;
    }, []);
    return {errors};
  }

  private formCellValidationErrors(cell: FormCell): FormPartialError[] {
    switch (cell?.type) {
      case FormCellType.Attribute:
        return this.attributeCellFormErrors(<FormAttributeCellConfig>cell.config || {});
      case FormCellType.Link:
        return this.linkCellFormErrors(<FormLinkCellConfig>cell.config || {});
      default:
        return [];
    }
  }

  private attributeCellFormErrors(config: FormAttributeCellConfig): FormPartialError[] {
    const errors: FormPartialError[] = [];

    const dataValue = this.getDataValue(config.attributeId);
    const attribute = mergeAttributeOverride(this.attributesMap?.[config.attributeId], config.attribute);

    if (attribute?.mandatory) {
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
      const validationError = this.invalidDataValueError(dataValue, attribute);
      if (validationError) {
        errors.push(validationError);
      } else {
        errors.push(
          this.validationError($localize`:@@perspective.form.view.validation.attribute.invalid:Value is not valid.`)
        );
      }
    }

    return errors;
  }

  private validationError(title: string): FormPartialError {
    return {type: FormViewErrorType.Validation, title, display: true};
  }

  private invalidDataValueError(dataValue: DataValue, attribute: Attribute): FormPartialError {
    const constraint = attribute?.constraint;
    switch (constraint?.type) {
      case ConstraintType.Text:
        return this.invalidTextValueError(<TextConstraint>constraint);
      case ConstraintType.Number:
        return this.invalidNumberValueError(<NumberConstraint>constraint, dataValue);
      case ConstraintType.Percentage:
        return this.invalidPercentageValueError(<PercentageConstraint>constraint, dataValue);
      case ConstraintType.DateTime:
        return this.invalidDateValueError(<DateTimeConstraint>constraint, dataValue);
    }

    return null;
  }

  private invalidTextValueError(constraint: TextConstraint): FormPartialError {
    const textConfig = constraint.config || {};
    if (textConfig.minLength === textConfig.maxLength) {
      return this.validationError(
        $localize`:@@perspective.form.view.validation.attribute.text.length:Number of characters must be ${textConfig.minLength}.`
      );
    } else if (textConfig.minLength > 0 && textConfig.maxLength > 0) {
      return this.validationError(
        $localize`:@@perspective.form.view.validation.attribute.text.range:Number of characters must be from range ${textConfig.minLength}-${textConfig.maxLength}`
      );
    } else if (textConfig.minLength > 0) {
      return this.validationError(
        $localize`:@@perspective.form.view.validation.attribute.text.minimum:Number of characters must be at least ${textConfig.minLength}.`
      );
    } else if (textConfig.maxLength > 0) {
      return this.validationError(
        $localize`:@@perspective.form.view.validation.attribute.text.maximum:Number of characters must be at most ${textConfig.maxLength}.`
      );
    }
  }

  private invalidNumberValueError(constraint: NumberConstraint, dataValue: DataValue): FormPartialError {
    const numberConfig = constraint.config || {};
    const minValue = numberConfig.minValue;
    const maxValue = numberConfig.maxValue;
    const minFormatted = dataValue.copy(minValue).format();
    const maxFormatted = dataValue.copy(maxValue).format();
    const zero = Big(0);
    if (minValue?.gt(zero) && maxValue?.gt(zero) && minValue?.eq(maxValue)) {
      return this.validationError(
        $localize`:@@perspective.form.view.validation.attribute.numeric.length:Value must be ${minFormatted}.`
      );
    } else if (minValue?.gt(zero) && maxValue?.gt(zero)) {
      return this.validationError(
        $localize`:@@perspective.form.view.validation.attribute.numeric.range:Value must be from range ${minFormatted} - ${maxFormatted}`
      );
    } else if (minValue?.gt(zero)) {
      return this.validationError(
        $localize`:@@perspective.form.view.validation.attribute.numeric.minimum:Value must be equal to or greater than ${minFormatted}.`
      );
    } else if (maxValue?.gt(zero)) {
      return this.validationError(
        $localize`:@@perspective.form.view.validation.attribute.numeric.maximum:Value must be equal to or lower than ${maxFormatted}.`
      );
    }
    return null;
  }

  private invalidPercentageValueError(constraint: PercentageConstraint, dataValue: DataValue): FormPartialError {
    const numberConfig = constraint.config || {};
    const minValue = numberConfig.minValue;
    const maxValue = numberConfig.maxValue;
    const minFormatted = dataValue.copy(minValue ? minValue / 100 : minValue).format();
    const maxFormatted = dataValue.copy(maxValue ? maxValue / 100 : maxValue).format();
    if (minValue > 0 && maxValue > 0 && minValue === maxValue) {
      return this.validationError(
        $localize`:@@perspective.form.view.validation.attribute.numeric.length:Value must be ${minFormatted}.`
      );
    } else if (minValue > 0 && maxValue > 0) {
      return this.validationError(
        $localize`:@@perspective.form.view.validation.attribute.numeric.range:Value must be from range ${minFormatted} - ${maxFormatted}`
      );
    } else if (minValue > 0) {
      return this.validationError(
        $localize`:@@perspective.form.view.validation.attribute.numeric.minimum:Value must be equal to or greater than ${minFormatted}.`
      );
    } else if (maxValue > 0) {
      return this.validationError(
        $localize`:@@perspective.form.view.validation.attribute.numeric.maximum:Value must be equal to or lower than ${maxFormatted}.`
      );
    }
    return null;
  }

  private invalidDateValueError(constraint: DateTimeConstraint, dataValue: DataValue): FormPartialError {
    const numberConfig = constraint.config;
    const minValue = numberConfig?.minValue && numberConfig?.minValue.getTime();
    const maxValue = numberConfig?.maxValue && numberConfig?.maxValue.getTime();
    const minFormatted = dataValue.copy(numberConfig?.minValue).format();
    const maxFormatted = dataValue.copy(numberConfig?.maxValue).format();
    if (minValue > 0 && maxValue > 0 && minValue === maxValue) {
      return this.validationError(
        $localize`:@@perspective.form.view.validation.attribute.date.length:Date must be ${minFormatted}.`
      );
    } else if (minValue > 0 && maxValue > 0) {
      return this.validationError(
        $localize`:@@perspective.form.view.validation.attribute.date.range:Date must be from range ${minFormatted} - ${maxFormatted}`
      );
    } else if (minValue > 0) {
      return this.validationError(
        $localize`:@@perspective.form.view.validation.attribute.date.minimum:Date must be on or later than ${minFormatted}.`
      );
    } else if (maxValue > 0) {
      return this.validationError(
        $localize`:@@perspective.form.view.validation.attribute.date.maximum:Date must be on or earlier than ${maxFormatted}.`
      );
    }
    return null;
  }

  private getDataValue(attributeId: string): DataValue {
    if (this.isCreating) {
      return this.userDataValues?.[attributeId];
    }
    return this.documentDataValues?.[attributeId] || this.userDataValues?.[attributeId];
  }

  private linkCellFormErrors(config: FormLinkCellConfig): FormPartialError[] {
    const errors: FormPartialError[] = [];

    const linkData = this.linkData?.[config.linkTypeId];
    const userLinkData = this.userLinkData?.[config.linkTypeId];

    if (config.minLinks > 0 || config.maxLinks > 0) {
      const selectedIds = [
        ...arraySubtract(linkData?.linkDocumentIds, linkData?.removedDocumentIds),
        ...(linkData?.addedDocumentIds || []),
      ];
      if (config.minLinks === config.maxLinks && selectedIds.length !== config.minLinks) {
        errors.push({
          type: FormViewErrorType.Validation,
          title: $localize`:@@perspective.form.view.validation.link.exact:Number of links must be ${config.minLinks}.`,
          display: this.isCreating ? !!userLinkData : true,
        });
      } else if (selectedIds.length < (config.minLinks || Number.MIN_SAFE_INTEGER)) {
        errors.push({
          type: FormViewErrorType.Validation,
          title: $localize`:@@perspective.form.view.validation.link.minimum:Number of links must be equal to or greater than ${config.minLinks}.`,
          display: this.isCreating ? !!userLinkData : true,
        });
      } else if (selectedIds.length > (config.maxLinks || Number.MAX_SAFE_INTEGER)) {
        errors.push({
          type: FormViewErrorType.Validation,
          title: $localize`:@@perspective.form.view.validation.link.maximum:Number of links must be equal to or lower than ${config.maxLinks}.`,
          display: this.isCreating ? !!userLinkData : true,
        });
      }
    }

    return errors;
  }

  private isAllDataDefined(): boolean {
    if (!this.attributesMap || !this.config) {
      return false;
    }
    return true;
  }
}

type FormPartialError = Pick<FormError, 'type' | 'title' | 'display'>;
