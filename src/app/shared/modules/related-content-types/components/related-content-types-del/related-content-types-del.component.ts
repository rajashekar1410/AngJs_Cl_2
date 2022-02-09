import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';
import { CommonService } from 'src/app/core/services/common/common.service';


@Component({
  selector: 'app-related-content-types-del',
  templateUrl: './related-content-types-del.component.html',
  styleUrls: ['./related-content-types-del.component.scss']
})
export class RelatedContentTypesDelComponent implements OnInit {

  constructor(
    public modalRef: BsModalRef,
    public cs: CommonService
  ) { }

  contentTypeInfo = {
    id: -1,
    name: ''
  }
  triggerDel$ = new Subject();


  ngOnInit() {
  }

  deleteModule() {
    if (this.contentTypeInfo.id >= 0) {
      this.cs.postData({ sourceid: 'list_rowdel', info: { query: 'related_content_types', column: 'id', selids: [this.contentTypeInfo.id] } }).subscribe((data: any) => {
        if (data.status == 1) {
          //console.log(JSON.stringify(data));
          this.triggerDel$.next(data.status);
          this.cs.refreshRelatedContentTypes();
        }
      }, err => {
        console.error(err);
        this.cs.openGrowl('', 'Status', 'Internal error.');
      });
    } else {
      this.cs.openGrowl('', 'Status', 'Internal error.');
    }

  }

}
