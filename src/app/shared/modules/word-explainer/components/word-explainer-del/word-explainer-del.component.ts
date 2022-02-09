import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';

@Component({
  selector: 'wem-word-explainer-del',
  templateUrl: './word-explainer-del.component.html',
  styleUrls: ['./word-explainer-del.component.scss']
})
export class WordExplainerDelComponent implements OnInit {

  constructor() { }

  @ViewChild('wmdModal', { static: true }) public wmdModal: ModalDirective;

  @Input('wmdEmitter')
  wmdEmitter: Subject<any> = null

  wmdTitle = 'Delete Explainer(s)'
  wmdMsg = 'This will delete the selected Explainers(s) permanently. Would you like to proceed?'

  ngOnInit() {
    if (!this.wmdEmitter)
      throw new Error('wmdEmitter is null')
    this.wmdEmitter.subscribe(resp => {
      const type = resp.type
      if (type == 'del_cnfm') {
        // update wmdTitle, wmdMsg if available
        const data = resp.data
        if(data) {
          this.wmdTitle = data.title
          this.wmdMsg = data.msg
        }
        // show confirmation del
        this.wmdModal.show()
      }
    })
  }

  reset() {
  this.wmdTitle = 'Delete Explainer(s)'
  this.wmdMsg = 'This will delete the selected Explainers(s) permanently. Would you like to proceed?'
  }

  hideModal() {
    this.reset()
    this.wmdModal.hide()
  }

  btnYes() {
    this.wmdEmitter.next({
      type: 'del_okay'
    })
    this.hideModal()
  }

  btnNo() {
    this.hideModal()
  }

}
