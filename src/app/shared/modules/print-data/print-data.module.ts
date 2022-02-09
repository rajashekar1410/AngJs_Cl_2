import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrintDataComponent } from './components/print-data/print-data.component';
import { PdfJsViewerModule } from 'ng2-pdfjs-viewer';
import { ModalModule } from 'ngx-bootstrap/modal';
import { LongRunningModalModule } from '../long-running-modal/long-running-modal.module';
import { HttpClientModule } from '@angular/common/http';



@NgModule({
  declarations: [PrintDataComponent],
  imports: [
    CommonModule,
    PdfJsViewerModule,
    ModalModule,
    LongRunningModalModule,
    HttpClientModule
  ],
  exports: [PrintDataComponent]
})
export class PrintDataModule { }
