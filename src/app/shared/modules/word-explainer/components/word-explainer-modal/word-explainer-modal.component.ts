import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { CommonService } from 'src/app/core/services/common/common.service';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { IetmModalService } from 'src/app/core/services/ietm-modal/ietm-modal.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'wem-word-explainer-modal',
  templateUrl: './word-explainer-modal.component.html',
  styleUrls: ['./word-explainer-modal.component.scss']
})
export class WordExplainerModalComponent implements OnInit {

  constructor(
    public cs: CommonService,
    public mdls: IetmModalService
  ) { }

  myTitle = ''
  myData = { id: '', content_type: 1, content_title: '', content: '', content_path_type: 0, page_id: this.cs.selpage_id }
  myValidation = ''

  @Input('editMode')
  editMode = false

  @Input('wmEmitter')
  wmEmitter: Subject<any> = null

  @ViewChild('logadd', { static: true }) public addlog: ModalDirective;

  filesToUpload = []

  buttonText = ''

  ngOnInit() {
    this.updateMode(this.editMode)
    if(!this.wmEmitter) {
      throw new Error('wmEmitter is null')
    }
    this.wmEmitter.subscribe(resp => {
      const type = resp.type
      if (type == 'add_mode') {
        this.updateMode(false)
        this.logaddform()
      } else if(type == 'edit_mode') {
        this.updateMode(true)
        this.editlog(resp.data)
      }
    })
  }

  ngAfterContentInit(): void {
    // listen to modal hidden state
    this.addlog.onHidden.subscribe(_ => {
      this.reset()
      this.cs.stopvideo()
    })
  }

  updateMode(edit: boolean) {
    this.editMode = edit
    if (!this.editMode) {
      this.myTitle = 'Add Hotspot'
      this.buttonText = 'SAVE'
    } else {
      this.myTitle = 'Edit Hotspot'
      this.buttonText = 'UPDATE'
    }
  }

  changeContentPath(type: number) {
    this.myData.content_path_type=type;
    this.myData.content='';
  }

  logaddform() {
    this.myData = { id: '', content_type: 1, content_title: '', content: '', content_path_type: 0, page_id: this.cs.selpage_id };
    this.filesToUpload = [];
    this.addlog.show();
    this.mdls.popdragabale();
  }

  manageformsub(pageform) {
    //console.log("/////////24")
    if (pageform.valid) {
      if (this.myData.content_path_type == 0 && this.filesToUpload.length > 0) {
        var temppth = "";
        if (this.myData.content_type == 1) {
          temppth = "explainer/images";
        }
        else if (this.myData.content_type == 2) {
          temppth = "explainer/videos";
        }
        this.cs.makeFileRequest("uploadbasic", [temppth], this.filesToUpload).then((result) => {
          // console.log(JSON.stringify(result));
          this.myData.content = result['filename'];
          this.managelogform();
        }, (error) => {
          console.error(error);
          this.myValidation = "Some error occurred while file upload form submission";
        });
      } else if(this.myData.content_path_type == 1) {
        // ADD WE via path mode
        this.managelogform()
      } else {
        //console.log('elseqwerty////');
        // console.log('elseqwerty////');
        if (this.myData.content_type != 3 && this.myData.id == '') {
          this.myValidation = "Upload a File";
        }
        else {
          this.managelogform();
        }
      }
    } else {
      this.myValidation = "Fill out mandatory fields";
    }
  }

  reset() {
    this.myTitle = ''
    this.myData = { id: '', content_type: 1, content_title: '', content: '', content_path_type: 0, page_id: this.cs.selpage_id }
    this.myValidation = ''
    this.filesToUpload = []
    // reset file field
    $('[type=file]').val('')
  }

  managelogform() {
    this.cs.postData({ sourceid: 'listmgr', info: { tdata: this.myData, query: 'wordsexplainer', pdata: { id: 'id', value: this.myData.id } } })
      .subscribe((data: any) => {
        if (data.status == 1) {
          this.wmEmitter.next({
            type: 'action_done',
            data: {
              ...this.myData,
              mode: this.editMode,
              // send newly created row's `id` (default value is '')
              id: data.response
            }
          })
          // reset appr. fields
          this.reset()
          // this.cs.openGrowl('', "Status", "Submitted Successfully");

          this.addlog.hide();
        } else {
          console.error('something went wrong with shared/word-explainer component')
          // this.cs.openGrowl('', "Status", "Some error ocured");
        }
      });
  }

  fileChangeEvent(event) {
    this.filesToUpload = event.target.files;
  }

  editlog(id) {
    this.editMode = true;
    this.filesToUpload = [];
    this.cs.postData({
      sourceid: 'listingdetails', info: { query: 'wordsexplainer', pdata: { id: 'id', value: id }, selcolumns: Object.keys(this.myData) }
    }).subscribe((data: any) => {
      if (data.status == 1) {
        this.myData = data.response;
        this.addlog.show();
        this.mdls.popdragabale();
      } else {
        this.cs.openGrowl('', 'Status', 'Some error Occured');
      }
    })
  }

}
