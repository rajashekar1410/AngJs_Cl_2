import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LRModalComponent } from './components/l-r-modal/l-r-modal.component';
import { ModalModule } from 'ngx-bootstrap/modal';


@NgModule({
  declarations: [LRModalComponent],
  imports: [
    CommonModule,
    ModalModule
  ],
  exports: [LRModalComponent]
})
export class LongRunningModalModule { }
