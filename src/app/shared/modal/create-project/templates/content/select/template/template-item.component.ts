import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import {Project} from '../../../../../../../core/store/projects/project';

@Component({
  selector: 'template-item',
  templateUrl: './template-item.component.html',
  styleUrls: ['./template-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TemplateItemComponent implements OnInit {

  @Input()
  public template: Project;

  constructor() { }

  ngOnInit(): void {
  }

}
