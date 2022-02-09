import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { CommonService } from 'src/app/core/services/common/common.service';
import { IetmModalService } from 'src/app/core/services/ietm-modal/ietm-modal.service';

@Component({
  selector: 'app-module-del',
  templateUrl: './module-del.component.html',
  styleUrls: ['./module-del.component.scss']
})
export class ModuleDelComponent implements OnInit {

  constructor(
    public mdls: IetmModalService,
    public cs : CommonService
  ) { }

  moduleInfo = {
    id: -1,
    name: ''
  }

  triggerDel$ = new Subject();

  ngOnInit() {
  }

  deleteModule() {
    if(this.moduleInfo.id >= 0) {
      this.cs.postData({ sourceid: 'delete_module', info: { module_id: this.moduleInfo.id } }).subscribe((data: any) => {
        if(data.status == 1) {
          //console.log(JSON.stringify(data));
          this.triggerDel$.next(data.status);
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
