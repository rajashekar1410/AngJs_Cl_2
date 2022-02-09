import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { CommonService } from 'src/app/core/services/common/common.service';
import { IetmModalService } from 'src/app/core/services/ietm-modal/ietm-modal.service';
import * as ClipboardJS from 'clipboard';
import { BsModalService } from 'ngx-bootstrap/modal';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { Subject } from 'rxjs';
import * as moment from 'moment';
@Component({
  selector: 'filemanager',
  templateUrl: './filemanager.component.html',
})
export class FilemanagerComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('openfilemgr', { static: true }) public bkmrmdlref: ElementRef;
  pwd_form: any;
  manageform = { oldpwd: '', newpwd: '', confirmpwd: '' };
  formvalidation: string;
  res: any;
  folder_path = "staticassets";
  popuptitle = "";
  showpopup = false;
  foldersorting = "asc";
  datesorting = 'asc';
  isDesc: boolean = true;
  column: string = 'name';
  popupdata = { oldname: '', newname: '', popuptitle: '', type: 0, formvalidation: '', filetype: '' }
  filesToUpload: Array<File> = [];

  delFileName = "";
  @ViewChild('delcnfm', { static: true }) public delcnfm: ElementRef;

  clipboardText = '';
  clipboardInstance: ClipboardJS = null;

  dtOptions: ADTSettings = {};
  dtTrigger = new Subject<any>();
  dtFilters = {};
  tbl_start = 0;
  tableInstance: DataTables.Api = null;

  constructor(
    public mdls: IetmModalService,
    private _location: Location,
    public cs: CommonService,
    private modalS: BsModalService,
  ) { }

  ngOnInit() {
    this.cs.emitChange('1');
    this.filesToUpload = [];
    this.cs.page_header = "File Manager";

    this.initDTOptions();
  }

  initDTOptions() {
    // Init stuff
    const self = this;
    this.dtOptions = {
      "language": { emptyTable: 'No files/folders were found' },
      pageLength: 10, serverSide: true, processing: false, searching: false,
      lengthChange: true, "order": [1, 'asc'], scrollY: "calc(100vh - 320px)",
      "scrollX": true, scrollCollapse: true, destroy: true,
      ajax: (dataTablesParameters: any, callback) => {
        // console.log("================"+dataTablesParameters['searchquery']+"==================");
        this.tbl_start = dataTablesParameters['start'];
        this.cs.postData({ sourceid: 'list', info: { path: this.folder_path, ...dataTablesParameters } })
          .subscribe(
            (resp: any) => {
              const foldersdata: any[] = resp['result']?.map(el => {
                el.fullPath = `${this.folder_path}/${el.name}`;
                return el;
              });
              callback({
                recordsTotal: resp.recordsTotal,
                recordsFiltered: resp.recordsFiltered,
                data: foldersdata
              });
            },
            err => {
              console.error(err);
              callback({
                recordsTotal: 0,
                recordsFiltered: 0,
                data: []
              });
            }
          );
      },
      // note: column order in this array affects table sort in server
      columns: [
        {
          data: 'index',
          title: '#',
          width: '4%',
          orderable: false,
          render: (_, __, ___, meta) => this.tbl_start + meta.row + 1,
        },
        {
          data: 'name',
          title: 'Name',
          createdCell: (cell, _, row) => {
            const { name, type } = row;

            // cursor pointer css
            $(cell).css('cursor', 'pointer');

            // text to render
            let text = '';
            if (type == 'dir') {
              text += `<i class="fa fa-folder" style="cursor:pointer"></i>`;
            } else if (type == 'file') {
              text += `<i class="fa fa-file-o" style="cursor:pointer"></i>`;
            }
            text += `&nbsp;${name}`;
            $(cell).html(text);
          }
        },
        { data: 'date', title: 'Date', render: (val) => moment(val).format('MMM  Do YYYY, hh:mm a'), width: '15%' },
        { data: 'type', visible: false },
        { data: 'size', visible: false },
        {
          data: '1',
          title: 'Actions',
          orderable: false,
          width: '8%',
          visible: self.cs.user_session.user_type == 0,
          createdCell: (cell, _, row) => {
            if (self.cs.user_session.user_type != 0) return;
            // clear old contents
            $(cell).html('');

            if (row['type'] == 'dir') {
              $(cell).html('--').css('text-align', 'center');
              return;
            };

            // column content
            const btn = $(`
          <button class="btn btn-link btn-sm dropdown-toggle d-block mx-auto" type="button">
            <i class="lni lni-cog">
          </button>
          `)
              .appendTo(cell as HTMLElement);

            // context menu init
            ($ as any)(cell)
              .contextmenu({
                delegate: "button",
                menu: [
                  { title: "Preview", cmd: "preview", uiIcon: "ui-icon-search" },
                  { title: "Copy Path", cmd: "copyPath", uiIcon: "ui-icon-clipboard" },
                  { title: "Rename", cmd: "rename", uiIcon: "ui-icon-pencil" },
                  { title: "Delete", cmd: "delete", uiIcon: "ui-icon-trash" },
                ],
                preventContextMenuForPopup: true,
                select: function (_event: never, ui: { target: JQuery<HTMLElement>, cmd: string }) {
                  try {
                    if (ui.cmd == 'preview') {
                      self.viewfile(row.name)
                    } else if (ui.cmd == 'copyPath') {
                      self.clipboardCopy(row.fullPath)
                    } else if (ui.cmd == 'rename') {
                      self.rename(row.name)
                    } else if (ui.cmd == 'delete') {
                      self.opendelcnfm(row.name)
                    }
                  } catch (err) { console.error(err); }
                }
              });

            // quick hack for left-click menu
            $(btn).on('click', function () {
              $(btn).trigger('contextmenu');
            });

            return btn.html();
          }
        },
      ],
      columnDefs: [
        { targets: '_all', defaultContent: '' }
      ],
      rowCallback: (row: Node, data: any[]) => {
        const self = this;
        // Unbind first in order to avoid any duplicate handler
        // (see https://github.com/l-lin/angular-datatables/issues/87)
        // Note: In newer jQuery v3 versions, `unbind` and `bind` are 
        // deprecated in favor of `off` and `on`
        const td = $(row).children('td').eq(1);
        td.off('click');
        td.on('click', () => self.openfiles(data));
      }
    };
  }

  ngAfterViewInit() {
    this.reloadTable();
  }

  // sets `tableInstance` value from Output event
  _tableInstanceTrigger(e: DataTables.Api) { this.tableInstance = e; }

  fileChangeEvent(fileInput: any) {
    // console.log( JSON.stringify(this.filesToUpload ));
    this.filesToUpload = fileInput.target.files as File[];
  }

  public reloadTable() {
    this.dtTrigger.next();
    /*this.foldersdata = [];
    this.cs.postData({ sourceid: 'list', info: { path: this.folder_path } })
      .subscribe(data => {
        this.foldersdata = data['result']?.map(el => {
          el.fullPath = `${this.folder_path}/${el.name}`;
          return el;
        });
        this.folderslistempty = 1;
      });*/
  }
  public removefilefolder(item) {
    this.cs.postData({ sourceid: 'remove', info: { path: this.folder_path + "/" + item } })
      .subscribe(data => {
        if (data['result'].success == true) {
          this.reloadTable();
          // hide modal
          this.cs.openGrowl('', 'Status', 'Item deleted successfully');
          this.mdls.modalRef?.hide();
          //  alert("success");
        } else {
          alert(data['result'].error);
        }
      });
  }
  opendelcnfm(fname: string) {
    this.delFileName = fname;
    this.openmdl(this.delcnfm)
  }
  public openmdl(id) {
    const prefix = this.cs.default_theme;
    this.mdls.modalRef = this.modalS.show(id, {
      class: this.popupdata.type == 6 ? prefix + ' modal-xl' : prefix
    });

  }
  public rename(item) {
    this.bkmrmdlref.nativeElement.click();
    this.popupdata.popuptitle = "Rename";
    this.popupdata.oldname = item;
    this.popupdata.newname = item;
    this.popupdata.type = 1;
  }
  public viewfile(item) {
    this.popupdata.popuptitle = "Item Preview";
    this.popupdata.oldname = this.cs.apiUrl + this.folder_path + "/" + item;
    if ((/\.(gif|jpg|jpeg|tiff|png)$/i).test(item)) {
      this.popupdata.filetype = "image";
      this.popupdata.type = 4;
      this.bkmrmdlref.nativeElement.click();
    } else if ((/\.(mp4)$/i).test(item)) {
      this.popupdata.filetype = "video";
      this.popupdata.type = 5;
      this.bkmrmdlref.nativeElement.click();
    } else if ((/\.(pdf)$/i).test(item)) {
      this.popupdata.filetype = "pdf";
      this.popupdata.type = 6;
      this.bkmrmdlref.nativeElement.click();
    } else {
      this.popupdata.filetype = ""
    }
  }
  clipboardCopy(input: string) {
    if (this.clipboardInstance) {
      this.clipboardInstance.destroy();
    }
    this.clipboardInstance = new ClipboardJS('body', {
      text: function (_) {
        return input;
      }
    });
    this.cs.openGrowl('', 'Status', 'Path copied to clipboard.');
  }
  public download(item) {
    this.cs.postData({ sourceid: 'download', info: { path: this.folder_path + item } })
      .subscribe(data => {
        //  console.log(JSON.stringify(data));
        if (data['result'].success == true) {
          //   alert("success");
        } else {

          alert(data['result'].error);
        }
      });
  }
  public create() {
    this.bkmrmdlref.nativeElement.click();
    this.popupdata.popuptitle = "Create folder";
    this.popupdata.oldname = this.folder_path;
    this.popupdata.type = 2;
  }
  public upload() {
    this.bkmrmdlref.nativeElement.click();
    this.popupdata.popuptitle = "Upload Files";
    this.popupdata.oldname = this.folder_path;
    this.popupdata.type = 3;
  }
  backward() {
    this._location.back();
  }
  public uploadfilefolder(isValid: boolean) {
    if (isValid) {
      this.popupdata.formvalidation = "";
      if (this.filesToUpload.length > 0) {
        this.cs.makeFileRequest("upload", [this.folder_path], this.filesToUpload).then((result) => {
          // console.log(JSON.stringify(result));
          if (result['result']['success'] == true) {
            this.closepopup();
            this.reloadTable();
          } else {
            this.popupdata.formvalidation = result['result'].error;
          }
        }, (error) => {
          //console.error(error);
          this.formvalidation = "Some error occurred Please try again";
        });
      } else {
        this.popupdata.formvalidation = "Upload aleast one File";
      }
    }
  }
  public createfilefolder(isValid: boolean) {
    if (isValid) {
      this.popupdata.formvalidation = "";
      this.cs.postData({ sourceid: 'createFolder', info: { path: this.popupdata.oldname, name: this.popupdata.newname } })
        .subscribe(data => {
          if (data['result'].success == true) {
            this.closepopup();
            this.reloadTable();
          } else {
            this.popupdata.formvalidation = data['result'].error;
          }
        });
    } else {
      this.popupdata.formvalidation = "Name Cannot be Null";
    }
  }
  public renamefilefolder(isValid: boolean) {
    if (isValid) {
      this.popupdata.formvalidation = "";
      this.cs.postData({ sourceid: 'rename', info: { path: this.folder_path + "/" + this.popupdata.oldname, newpath: this.folder_path + "/" + this.popupdata.newname } })
        .subscribe(data => {
          if (data['result'].success == true) {
            this.closepopup();
            this.reloadTable();
          } else {
            this.popupdata.formvalidation = data['result'].error;

          }
        });
    } else {
      this.popupdata.formvalidation = "Name Cannot be Null";
    }
  }
  sort(property) {
    this.isDesc = !this.isDesc; //change the direction
    this.column = property;
    let direction = this.isDesc ? 1 : -1;
    /*this.foldersdata.sort(function (a, b) {
      if (property == 'name') {
        if (a[property].toLowerCase() < b[property].toLowerCase()) {
          return -1 * direction;
        }
        else if (a[property].toLowerCase() > b[property].toLowerCase()) {
          return 1 * direction;
        }
        else {
          return 0;
        }
      } else {
        if (new Date(a[property]) < new Date(b[property])) {
          return -1 * direction;
        }
        else if (new Date(a[property]) > new Date(b[property])) {
          return 1 * direction;
        }
        else {
          return 0;
        }
      }
    });*/
    //  console.log(JSON.stringify(this.foldersdata));
  };
  public openfiles(item) {
    if (item.type == 'dir') {
      this.folder_path = this.folder_path + "/" + item.name;
      // this.folderslistempty = 0;
      this.reloadTable();
    } else if (item.type == 'file') {
      this.viewfile(item.name);
    }
  }
  public closepopup() {
    //this.showpopup = false;
    this.mdls.modalRef.hide();
    this.popupdata = { oldname: '', newname: '', popuptitle: '', type: 0, formvalidation: '', filetype: '' };
  }
  public backtofolder() {
    this.folder_path = this.folder_path.substr(0, this.folder_path.lastIndexOf("/"));
    this.reloadTable();
  }
  public backtohome() {
    this.folder_path = 'staticassets';
    this.reloadTable();
  }

  ngOnDestroy() {
    this.clipboardInstance?.destroy();
  }
}
