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

import {Data, Layout} from 'plotly.js';
import {ChartConfig, ChartType} from '../../../../../core/store/charts/chart';
import {Collection} from '../../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {ElementRef} from '@angular/core';

export abstract class PlotMaker {
  protected collections: Collection[];

  protected documents: DocumentModel[];

  protected config: ChartConfig;

  protected onValueChanged?: (valueChange: ValueChange) => void;

  protected onDataChanged?: (dataChange: DataChange) => void;

  constructor(protected element: ElementRef) {}

  public updateData(collections: Collection[], documents: DocumentModel[], config: ChartConfig) {
    this.collections = collections;
    this.documents = documents;
    this.config = config;
  }

  public setOnValueChanged(onValueChanged: (valueChange: ValueChange) => void) {
    this.onValueChanged = onValueChanged;
  }

  public setOnDataChanged(onDataChanged: (dataChange: DataChange) => void) {
    this.onDataChanged = onDataChanged;
  }

  public currentConfig(): ChartConfig {
    return this.config ? {...this.config} : null;
  }

  public abstract createData(): Data[];

  public abstract createLayout(): Partial<Layout>;

  public abstract currentType(): ChartType;
}

export interface ValueChange {
  documentId: string;
  attributeId: string;
  value: string;
}

export interface DataChange {
  trace: number;
  axis: string;
  index: number;
  value: string;
}
