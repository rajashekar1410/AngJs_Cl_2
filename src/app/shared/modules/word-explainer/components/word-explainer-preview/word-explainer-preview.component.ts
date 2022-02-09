import { Component, OnInit, Input, ViewChild, AfterContentInit } from '@angular/core';
import { Subject } from 'rxjs';
import { CommonService } from 'src/app/core/services/common/common.service';
import { ModalDirective } from 'ngx-bootstrap/modal';

@Component({
  selector: 'wem-word-explainer-preview',
  templateUrl: './word-explainer-preview.component.html',
  styleUrls: ['./word-explainer-preview.component.scss']
})
export class WordExplainerPreviewComponent implements OnInit, AfterContentInit {

  constructor(
    public cs: CommonService
  ) { }


  myTitle = ''
  myData = { id: '', content_type: 1, content_title: '', content: '', content_path_type: 0 }
  myValidation = ''

  @Input('wmpEmitter')
  wmpEmitter: Subject<any> = null

  @ViewChild('explainermdl', { static: true }) public wmpModal: ModalDirective;


  ngAfterContentInit(): void {
    // listen to modal hidden state
    this.wmpModal.onHidden.subscribe(_ => {
      this.reset()
      this.cs.stopvideo()
    })
  }

  ngOnInit() {
    if (!this.wmpEmitter)
      throw new Error('wmpEmitter not set')
    this.wmpEmitter.subscribe(
      resp => {
        const type = resp.type
        if (type == 'type_init') {
          this.loadData(resp.data)
        }
      }
    )
  }

  loadData(id) {
    this.cs.postData({
      sourceid: 'listingdetails', info: { query: 'wordsexplainer', pdata: { id: 'id', value: id }, selcolumns: Object.keys(this.myData) }
    })
      .subscribe((data: any) => {
        if (data.status == 1) {
          if (data.response) {
            this.myData = data.response;
            this.wmpModal.show()
            this.cs.popdragabale()
          } else {
            this.cs.openGrowl('', 'Status', 'Word explainer unavailable.')
          }
        }
      })
  }

  editWE() {
    if (!this.wmpEmitter)
      throw new Error('wmpEmitter is null')
    // request edit modal
    this.wmpEmitter.next({
      type: 'type_edit',
      data: this.myData.id
    })
    // hide current dialog
    this.closeWE(false)
  }

  delWE() {
    if (!this.wmpEmitter)
      throw new Error('wmpEmitter is null')
    // request del confirmation
    this.wmpEmitter.next({
      type: 'type_del',
      data: this.myData.id
    })
    // hide current dialog
    this.closeWE(false)
  }

  reset() {
    this.myTitle = ''
    this.myData = { id: '', content_type: 1, content_title: '', content: '', content_path_type: 0 }
    this.myValidation = ''
  }

  closeWE(resetData = false) {
    if (resetData)
      this.reset()
    // pause video playback (if applicable)
    this.cs.stopvideo()
    this.wmpModal.hide()
  }

}
