import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../core/services/common/common.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-modulemanager',
  templateUrl: './modulemanager.component.html',
  styleUrls: ['./modulemanager.component.css']
})
export class ModulemanagerComponent implements OnInit {

  constructor(
    public cs: CommonService,
    public router: Router
  ) {
    this.cs.history_back = 1;
    this.cs.history_forward = 1; this.cs.emitChange('1');
  }

  ngOnInit() {
    // Reset heading
    this.cs.page_header = '';
  }

  openmodule(id, name) {
    this.cs.selmodule_name = name;
    this.cs.selmodule_id = id;
    this.router.navigate(['/home/pages/pagecmp/' + id + "/" + this.cs.default_category])
  }
  //'/home/pages/pagecmp/',namedt.link,'1'
}
