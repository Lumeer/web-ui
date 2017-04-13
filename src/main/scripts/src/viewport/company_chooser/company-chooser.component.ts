import {Component, EventEmitter, HostListener, Output, ViewChild} from '@angular/core';
import {animate, keyframes, state, style, transition, trigger} from '@angular/animations';
import {CompanyProject} from '../../services/company-project.service';

@Component({
  selector: 'company-chooser',
  template: require('./company-chooser.component.html'),
  styles: [require('./company-chooser.component.scss').toString()],
  animations: [
    trigger('animateHeight', [
      state('in', style({height: '*'})),
      transition('void => *', [
        animate(500, keyframes([
          style({height: 0, offset: 0}),
          style({height: '*', offset: 1})
        ]))
      ]),
      transition('* => void', [
        animate(500, keyframes([
          style({height: '*', offset: 0}),
          style({height: 0, offset: 1})
        ]))
      ])
    ])
  ]
})
export class CompanyChooser {
  public companies = [
    {title: 'ORG', icon: 'fa-life-ring'},
    {title: 'ORG', icon: 'fa-life-ring'},
    {title: 'ORG', icon: 'fa-life-ring'},
    {title: 'ORG', icon: 'fa-life-ring'},
    {title: 'ORG', icon: 'fa-life-ring'},
    {title: 'ORG', icon: 'fa-life-ring'},
    {title: 'ORG', icon: 'fa-life-ring'},
    {title: 'ORG', icon: 'fa-life-ring'},
    {title: 'ORG', icon: 'fa-life-ring'},
    {title: 'ORG', icon: 'fa-life-ring'},
    {title: 'ORG', icon: 'fa-life-ring'}
  ];
  public projects = [
    {title: 'ORG', icon: 'fa-life-ring'},
    {title: 'ORG', icon: 'fa-life-ring'},
    {title: 'ORG', icon: 'fa-life-ring'},
    {title: 'ORG', icon: 'fa-life-ring'},
    {title: 'ORG', icon: 'fa-life-ring'},
    {title: 'ORG', icon: 'fa-life-ring'},
    {title: 'ORG', icon: 'fa-life-ring'},
    {title: 'ORG', icon: 'fa-life-ring'},
    {title: 'ORG', icon: 'fa-life-ring'},
    {title: 'ORG', icon: 'fa-life-ring'},
    {title: 'ORG', icon: 'fa-life-ring'}
  ];
  @ViewChild('comps') public companiesEl: any;
  @ViewChild('projs') public projectsEl: any;
  @Output() public saveAction: EventEmitter<any> = new EventEmitter();
  public activeProject: any;
  public companiesWidth: Number;
  public activeIndex: Number;

  constructor(private companyProject: CompanyProject) {}

  public ngOnInit() {
    this.companiesWidth =  this.companies.length * 170;
  }

  public onCompanySelected(company: any, index: Number) {
    this.companies.forEach((oneCompany: any) => oneCompany.active = false);
    this.activeIndex = index;
    company.active = true;
  }

  public onProjectSelected(project: any, index: Number) {
    this.projects.forEach((oneProject: any) => oneProject.active = false);
    this.activeProject = project;
    this.activeProject.active = true;
  }

  public onScrollCompanies(toRight?: boolean) {
    if (toRight) {
      this.companiesEl.scrollToLeft(this.companiesEl.elementRef.nativeElement.scrollLeft + 170);
    } else {
      this.companiesEl.scrollToLeft(this.companiesEl.elementRef.nativeElement.scrollLeft - 170);
    }
  }

  public onScrollProjects(toRight?: boolean) {
    if (toRight) {
      this.projectsEl.scrollToLeft(this.projectsEl.elementRef.nativeElement.scrollLeft + 170);
    } else {
      this.projectsEl.scrollToLeft(this.projectsEl.elementRef.nativeElement.scrollLeft - 170);
    }
  }

  public isCompanyActive() {
    return typeof this.activeIndex !== 'undefined';
  }

  public saveActiveItems() {
    if (this.companies.filter((item: any) => item.active).length !== 0 &&
      this.projects.filter((item: any) => item.active).length) {
      this.companyProject.activeCompany = 'COM';
      this.companyProject.activeProject = 'PRJ2';
      this.saveAction.next();
    }
  }
}
