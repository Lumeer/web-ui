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

import {newPlot} from 'plotly.js';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {ChartVisualizer} from './chart-visualizer';
import {CollectionModel} from '../../../../core/store/collections/collection.model';

export class LineVisualizer extends ChartVisualizer {

  private collections: CollectionModel[];

  private documents: DocumentModel[];

  private attributeX: string;

  private attributeY: string;

  public update(collections: CollectionModel[], documents: DocumentModel[], attributeX: string, attributeY: string) {
    this.collections = collections;
    this.documents = this.sorter.sortData(documents);
    this.attributeX = attributeX;
    this.attributeY = attributeY;

    this.setData();
  }

  public setData() {
    const trace = this.getTraceStyle();

    if (this.attributeY && this.attributeX) {
      this.addBothAxisValues(trace);

    } else if (this.attributeY) {
      this.addSingleAxisValues(trace, this.attributeY, 'y');

    } else if (this.attributeX) {
      this.addSingleAxisValues(trace, this.attributeX, 'x');
    }

    this.data = [trace];
  }

  private getTraceStyle(): object {
    const trace = {
      mode: 'markers',
      type: 'scatter'
    };

    if (this.documents && this.documents[0]) {
      trace['marker'] = {color: this.getCollectionColor(this.documents[0].collectionId)};
    }

    return trace;
  }

  private getCollectionColor(id: string): string {
    const collection = this.collections.find(coll => coll.id === id);
    return collection && collection.color;
  }

  private addBothAxisValues(trace: object) {
    const values = this.documents.map(document => {
      return [document.data[this.attributeX], document.data[this.attributeY]];
    });

    trace['x'] = values.map(([valueX, valueY]) => valueX);
    trace['y'] = values.map(([valueX, valueY]) => valueY);
  }

  private addSingleAxisValues(trace: object, attribute: string, axis: string) {
    trace[axis] = this.documents.map(document => document.data[attribute]);
  }

  public showChart() {
    const shownElement = this.chartElement.nativeElement;
    newPlot(shownElement, this.data, this.style);
  }

}
