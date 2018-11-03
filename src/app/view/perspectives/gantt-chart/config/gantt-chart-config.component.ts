import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import {CollectionModel} from "../../../../core/store/collections/collection.model";
import {DocumentModel} from "../../../../core/store/documents/document.model";

@Component({
  selector: 'gantt-chart-config',
  templateUrl: './gantt-chart-config.component.html',
  styleUrls: ['./gantt-chart-config.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GanttChartConfigComponent implements OnInit {

  @Input()
  public collections: CollectionModel[];

  @Input()
  public documents: DocumentModel[];

  constructor() { }

  ngOnInit() {
    this.collections.forEach(function (collection) {
      console.log(collection);
      console.log("kolekcia: ",collection.attributes.forEach(function (attr) {
        console.log("atribut: "+attr.name+ " _____ ", attr);
      }))
    });

    this.documents.forEach(function (document) {
      console.log("dokument: ",document)
    })
  }

}
