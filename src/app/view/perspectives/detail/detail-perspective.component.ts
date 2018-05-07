import {Component, Input, OnInit} from '@angular/core';
import {PerspectiveComponent} from "../perspective.component";
import {ViewConfigModel} from "../../../core/store/views/view.model";
import {DocumentModel} from "../../../core/store/documents/document.model";
import {QueryModel} from "../../../core/store/navigation/query.model";

@Component({
  selector: 'detail-perspective',
  templateUrl: './detail-perspective.component.html',
  styleUrls: ['./detail-perspective.component.scss']
})
export class DetailPerspectiveComponent implements PerspectiveComponent, OnInit {

  @Input()
  public linkedDocument: DocumentModel;

  @Input()
  public query: QueryModel;

  @Input()
  public config: ViewConfigModel = {};

  @Input()
  public embedded: boolean;

  @Input()
  public path: number[] = [];

  constructor() { }

  ngOnInit() {
  }

}
