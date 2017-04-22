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
  @ViewChild('comps') public companiesEl: any;
  @ViewChild('projs') public projectsEl: any;
  @Output() public saveAction: EventEmitter<any> = new EventEmitter();
  public activeProject: any;
  public companiesWidth: Number = 0;
  public activeIndex: Number;

  constructor(public companyProject: CompanyProject) {}

  public ngOnInit() {
    this.companyProject.fetchAllCompanies()
      .subscribe(data => {
        this.companyProject.allCompanies = data;
        this.companiesWidth =  this.companyProject.allCompanies.length * 170;
      });
    this.companyProject.fetchAllProjects()
      .subscribe(data => this.companyProject.allProjects = data);
  }

  public onCompanySelected(company: any, index: Number) {
    this.companyProject.allCompanies.forEach((oneCompany: any) => oneCompany.active = false);
    this.activeIndex = index;
    company.active = true;
  }

  public onProjectSelected(project: any, index: Number) {
    this.companyProject.allProjects.forEach((oneProject: any) => oneProject.active = false);
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
    if (this.companyProject.allCompanies.filter((item: any) => item.active).length !== 0 &&
      this.companyProject.allProjects.filter((item: any) => item.active).length) {
      this.companyProject.activeCompany = 'COM';
      this.companyProject.activeProject = 'PRJ2';
      this.saveAction.next();
    }
  }
}
