import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HyperlinkAddUpdComponent } from './components/hyperlink-add-upd/hyperlink-add-upd.component';
import { ModalModule } from 'ngx-bootstrap/modal';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HyperlinkPreviewComponent } from './components/hyperlink-preview/hyperlink-preview.component';
import { HyperlinkDeleteComponent } from './components/hyperlink-delete/hyperlink-delete.component';



@NgModule({
  declarations: [HyperlinkAddUpdComponent, HyperlinkPreviewComponent, HyperlinkDeleteComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ModalModule
  ],
  exports: [HyperlinkAddUpdComponent, HyperlinkPreviewComponent, HyperlinkDeleteComponent]
})
export class HyperlinkModule { }
