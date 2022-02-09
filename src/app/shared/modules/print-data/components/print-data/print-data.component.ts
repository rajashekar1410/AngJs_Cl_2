import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { PdfJsViewerComponent } from 'ng2-pdfjs-viewer';
import { BsModalRef, ModalDirective } from 'ngx-bootstrap/modal';
import { Subscription } from 'rxjs';
import { IetmModalService } from 'src/app/core/services/ietm-modal/ietm-modal.service';
import { PrintDataService } from '../../services/print-data.service';

@Component({
  selector: 'app-print-data',
  templateUrl: './print-data.component.html',
  styleUrls: ['./print-data.component.scss']
})
export class PrintDataComponent implements OnInit, OnDestroy {

  constructor(
    private printDataService: PrintDataService,
    private mdls: IetmModalService
  ) { }

  @ViewChild('pdfViewerAutoLoad', { static: true }) public appdfViewerAutoLoad: PdfJsViewerComponent;
  @ViewChild('modalRef', { static: true }) public modalRef: ModalDirective;

  printSub$: Subscription = null;

  ngOnInit(): void {
    this.printSub$ = this.printDataService.printTrigger$.subscribe(response => {
      // console.log('request received in print-data component');
      const {data} = response;
      this.appdfViewerAutoLoad.pdfSrc = data; // pdfSrc can be Blob or Uint8Array
      this.appdfViewerAutoLoad.refresh(); // Ask pdf viewer to load/refresh pdf
      // show modal
      this.modalRef.show();
      // TODO: use `mdls` to enable draggable behavior
      this.mdls.popdragabale();
    });
  }

  ngOnDestroy() {
    this.printSub$?.unsubscribe();
  }

}
