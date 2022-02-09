import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonService } from '../../core/services/common/common.service';
import { IetmModalService } from '../../core/services/ietm-modal/ietm-modal.service';
import { Router } from '@angular/router';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { DBBackupStates } from 'src/app/models/db-backup-states';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-backupmanager',
  templateUrl: './backupmanager.component.html',
  styleUrls: ['./backupmanager.component.css']
})
export class BackupmanagerComponent implements OnInit {

  @ViewChild('restore') public restore: ModalDirective;
  @ViewChild('restorefile') public restorefile: ElementRef;
  @ViewChild('backdrop') public backdrop: ModalDirective;

  backupdata = [];
  interval: any;
  uploaded_filename = "";
  trrigered_backup = 0;
  filesToUpload: Array<File>;

  restoreProgress = 0;

  fetchStatusSub$: Subscription = null;

  errorOccurred = false;

  constructor(
    public router: Router,
    public cs: CommonService,
    public etmdl: IetmModalService
  ) {
    this.cs.emitChange('1');
  }

  fileChangeEvent(fileInput: any) {
    //alert( fileInput.target.file_name);
    this.filesToUpload = <Array<File>>fileInput.target.files;
    let file = fileInput.target.files[0];
    let fileName = file.name;
    // alert(fileName);
    //   console.log( JSON.stringify(file));
    this.uploaded_filename = fileName;
    this.cs.makeFileRequest("upload", ['/staticassets/dbbackups/uploads'], this.filesToUpload).then((result) => {
      //   console.log(JSON.stringify(result));
      if (result['result']['success'] == true) {
        this.showBackdrop();
        this.getbackupmanager(DBBackupStates.STATE_RESTORE_NOW);
      }
    })
      .catch((err) => {
        console.error(err);
        this.cs.openGrowl('', 'Status', 'Some error Occured, Please try Again');
      });
    //console.log( this.filesToUpload );
  }

  trigerclick() {
    this.restorefile.nativeElement.click();
    //restorefile.click()
  }

  getbackupmanager(type: DBBackupStates) {
    // update process type
    clearInterval(this.interval);
    if (type == DBBackupStates.STATE_BACKUP_NOW) {
      this.trrigered_backup = 1;
      this.showBackdrop();
    }
    this.fetchStatusSub$ = this.cs.postData({ sourceid: 'data_backup', info: { dmtype: type, file_name: this.uploaded_filename } })
      .subscribe(data => {
        //  console.log("//////////////"+JSON.stringify(data));
        if (data['status'] == 1) {
          this.backupdata = data['response'];
          if (this.backupdata[0]['status'] == '2' && this.trrigered_backup == 1) {
            //    alert("trigger file downlaod=="+this.backupdata[0]['file_name']);
            this.cs.downloadData(this.backupdata[0]['file_name']);
            this.trrigered_backup = 0;
            this.hideBackdrop();
          } else if (this.backupdata[1].endtime.length > 0 && this.trrigered_backup != 1) {
            // restore complete, hide modal
            this.hideBackdrop();
          } else if(this.backupdata[1].endtime.length == 0) {
            // restore in progress
            this.showBackdrop();
            if (this.backupdata[1].progress)
              this.restoreProgress = this.backupdata[1].progress;
          }
          this.interval = setInterval(() => {
            this.getbackupmanager(DBBackupStates.STATE_FETCH_HISTORY);
          }, 6000);
        } else {
          this.cs.openGrowl('', 'Status', 'Some error occurred');
          this.hideBackdrop();
        }
      }, 
      err => {
        console.error(err);
        this.errorOccurred=true;
      });
  }

  showBackdrop() {
    if (this.backdrop.isShown) return;
    this.backdrop.show();
    this.etmdl.popdragabale();
  }

  hideBackdrop() {
    this.backdrop.hide();
    // reset UI
    this.restoreProgress = 0;
    this.errorOccurred = false;
  }

  ngOnInit() {
    this.cs.page_header = "Backup and Restore";
    this.getbackupmanager(DBBackupStates.STATE_FETCH_HISTORY);
  }

  ngOnDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.fetchStatusSub$?.unsubscribe();
    this.hideBackdrop();
  }

  openconfirm() {
    this.restore.show();
    this.etmdl.popdragabale();
  }

}
