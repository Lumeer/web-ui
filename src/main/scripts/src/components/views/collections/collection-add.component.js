"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var core_1 = require("@angular/core");
var ng2_webstorage_1 = require("ng2-webstorage");
var document_service_1 = require("../../../services/document.service");
var CollectionAddComponent = (function () {
    function CollectionAddComponent(documentService) {
        this.documentService = documentService;
        this.pickerVisible = false;
        this.newDocument = { links: [] };
        this.initColors();
        this.initIcons();
    }
    /*  public newDocumentInfo() {
     if (!this.newDocument.title) {
     return;
     }
     if (!this.newDocument.color) {
     this.newDocument.color = 'white';
     }
     // this.documents.push(_.cloneDeep(this.newDocument)); // commented out because it shows error
     this.newDocument = {
     links: []
     };
     }*/
    /* public setActiveDocument(document) {
     this.activeDocument = document;
     this.documentService.setActiveDocument(document);
     }*/
    CollectionAddComponent.prototype.setIcon = function (icon) {
        this.newDocument.icon = icon;
    };
    CollectionAddComponent.prototype.setColor = function (color) {
        this.newDocument.color = color;
    };
    CollectionAddComponent.prototype.initColors = function () {
        this.colors = [
            '#c7254e',
            '#18BC9C',
            '#3498DB',
            '#F39C12',
            '#E74C3C'
        ];
    };
    CollectionAddComponent.prototype.initIcons = function () {
        this.icons = [
            'fa-user-circle-o',
            'fa-dot-circle-o',
            'fa-snowflake-o',
            'fa-superpowers',
            'fa-eye-slash'
        ];
    };
    return CollectionAddComponent;
}());
__decorate([
    core_1.Input(),
    __metadata("design:type", Object)
], CollectionAddComponent.prototype, "documents", void 0);
__decorate([
    ng2_webstorage_1.LocalStorage(),
    __metadata("design:type", Object)
], CollectionAddComponent.prototype, "lastDocument", void 0);
CollectionAddComponent = __decorate([
    core_1.Component({
        selector: 'collection-add',
        template: require('./collection-add.component.html'),
        styles: [require('./collection-add.component.scss').toString()],
        animations: [
            core_1.trigger('animateVisible', [
                core_1.state('in', core_1.style({ height: '*', width: '*', opacity: 1 })),
                core_1.transition('void => *', [
                    core_1.animate(200, core_1.keyframes([
                        core_1.style({ height: 0, width: 0, opacity: 0, offset: 0 }),
                        core_1.style({ height: '*', width: '*', opacity: 1, offset: 1 })
                    ]))
                ]),
                core_1.transition('* => void', [
                    core_1.animate(200, core_1.keyframes([
                        core_1.style({ height: '*', width: '*', opacity: 1, offset: 0 }),
                        core_1.style({ height: 0, width: 0, opacity: 0, offset: 1 })
                    ]))
                ])
            ])
        ]
    }),
    __metadata("design:paramtypes", [document_service_1.DocumentService])
], CollectionAddComponent);
exports.CollectionAddComponent = CollectionAddComponent;
//# sourceMappingURL=collection-add.component.js.map