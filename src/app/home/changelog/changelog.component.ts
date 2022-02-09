import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonService } from '../../core/services/common/common.service';
import { IetmModalService } from '../../core/services/ietm-modal/ietm-modal.service';
import { Router } from '@angular/router';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { HttpClient } from '@angular/common/http';
import { ListingService } from 'src/app/core/services/listing/listing.service';
import { Subscription } from 'rxjs';
import * as moment from 'moment';
import { PdfJsViewerComponent } from 'ng2-pdfjs-viewer';

declare var $: JQueryStatic;

@Component({
  selector: 'app-changelog',
  templateUrl: './changelog.html',
})
export class ChangeLogComponent implements OnInit, OnDestroy {

  @ViewChild('logadd', { static: true }) public addlog: ModalDirective;
  @ViewChild('logdelete', { static: true }) public viewlog: ModalDirective;
  @ViewChild('pdfViewer') public pdfViewer: PdfJsViewerComponent;

  public tbl_start = 0;
  public dtfilters = {};
  public log_form_title = '';
  public log_form_btntitle = '';
  public log_validation = "";
  public changelogform = { id: '', change_no: '', log_date: new Date(), frame_no: '', version_no: '', remarks: '', refrence_desc: '', refrence_doc: '' }

  // store file upload info
  fileUpload: File = null;

  dtOptions: DataTables.Settings = {};

  public pdfoptions = { zoom: 1, page: 1, rotation: 0, totalpages: 0, showall: true, originalsize: true };

  ajaxSub$: Subscription = null;
  manageLogSub$: Subscription = null;
  editLogSub$: Subscription = null;

  constructor(public router: Router,
    private http: HttpClient,
    public mdls: IetmModalService,
    public cs: CommonService,
    public ls: ListingService
  ) {
    this.cs.emitChange('1');
  }

  getdata() {
    const self = this;
    this.dtOptions = {
      "language": { search: "Find:", searchPlaceholder: 'By: All Except Date', emptyTable: 'No records found' },
      pageLength: 10, serverSide: true, processing: false, searching: true,
      lengthChange: true, "order": [[1, "desc"]], scrollY: "55vh", "scrollX": true, scrollCollapse: true,
      ajax: (dataTablesParameters: any, callback) => {
        dataTablesParameters['query_tbl'] = "changelogs";
        dataTablesParameters['dtfilters'] = this.dtfilters;
        dataTablesParameters['searchquery'] = " where (change_no like '%" + dataTablesParameters['search']['value'] + "%' or frame_no like '%" + dataTablesParameters['search']['value'] + "%' or  version_no like '%" + dataTablesParameters['search']['value'] + "%' or  remarks like '%" + dataTablesParameters['search']['value'] + "%' or  refrence_desc like '%" + dataTablesParameters['search']['value'] + "%')"
        // console.log("================"+dataTablesParameters['searchquery']+"==================");
        //alert("/////");
        this.tbl_start = dataTablesParameters['start'];
        self.ajaxSub$ = self.http.post<{ data: any[]; draw: number; recordsFiltered: number; recordsTotal: number; }>(
          this.cs.apiUrl + "dtl_listings", dataTablesParameters, {}).subscribe(resp => {
            //   console.log(JSON.stringify(resp));
            //    console.log(".........................................");
            if (resp['status'] == 1) {
              self.ls.listing_data = resp.data;
              // this.userscount=resp.recordsTotal+1;
              callback({
                recordsTotal: resp.recordsTotal,
                recordsFiltered: resp.recordsFiltered,
                data: resp.data
              });
            } else {
              alert("Error occured");
            }

          }, error => {
            console.log("Rrror", error);
          });
      },
      columns: [
        {
          data: 'id',
          title: 'Sr. No',
          orderable: false,
          render: (_, __, ___, meta) => this.tbl_start + meta.row + 1
        },
        { data: 'log_date', title: 'Change Date' },
        { data: 'change_no', title: 'Change No.' },
        { data: 'frame_no', title: 'Frame No.' },
        { data: 'version_no', title: 'New Version No' },
        { data: 'remarks', title: 'Remarks' },
        { data: 'refrence_desc', title: 'Reference Desc' },


        {
          data: '1',
          title: 'Actions',
          orderable: false,
          visible: self.cs.user_session.user_type <= 1,
          createdCell: (cell) => {
            if (self.cs.user_session.user_type > 1) return;
            // clear old contents
            $(cell).html('');

            // column content
            const btn = $(`
            <button class="btn btn-link btn-sm dropdown-toggle d-block mx-auto" type="button">
              <i class="lni lni-cog">
            </button>
            `)
              .appendTo(cell as HTMLElement);
            const row = $("#tbllistid").DataTable().row(cell).data();
            // context menu init
            ($ as any)(cell)
              .contextmenu({
                delegate: "button",
                menu: [
                  { title: "Edit Log", cmd: "edit", uiIcon: "ui-icon-pencil" },
                  { title: "View Document", cmd: "view", uiIcon: "ui-icon-document-b", disabled: row['refrence_doc'].length == 0 },
                ],

                preventContextMenuForPopup: true,
                select: function (_event: never, ui: { target: JQuery<HTMLElement>, cmd: string }) {
                  try {
                    const cellItem = $(ui.target).closest('td');
                    // const rowId = $("#tbllistid").DataTable().row(cellItem).data()['id'];

                    const itemIndex = $("#tbllistid").DataTable().cell(cellItem).index().row;
                    // console.log(itemIndex);
                    if (ui.cmd == 'edit') {
                      self.editlog(row['id']);
                    } else if (ui.cmd == 'view') {
                      self.opendocument(row['refrence_doc']);
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
        { data: 'refrence_doc' },
        { data: 'id' }
      ],
      columnDefs: [
        { orderable: false, targets: [0, 7] },
        { targets: [0, 1, 2, 3, 4, 5, 6, 7], visible: true },
        { targets: '_all', visible: false }
      ]
    };
  }
  ngOnInit(): void {
    this.getdata();
    this.cs.page_header = "Version and Revision History";
  }
  logaddform() {
    this.log_form_title = 'Add Change Log';
    this.log_form_btntitle = 'SAVE';
    this.changelogform = { id: '', change_no: '', log_date: new Date(), frame_no: '', version_no: '', remarks: '', refrence_desc: '', refrence_doc: '' }
    this.addlog.show();
    this.mdls.popdragabale();
  }
  editlog(id: number) {
    this.log_form_title = 'Edit Change Log';
    this.log_form_btntitle = 'UPDATE';
    this.editLogSub$ = this.cs.postData({
      sourceid: 'listingdetails', info: { query: 'changelogs', pdata: { id: 'id', value: id }, selcolumns: Object.keys(this.changelogform) }
    }).subscribe((data: any) => {
      if (data.status == 1) {
        this.changelogform = data.response;
        this.changelogform.log_date = new Date(this.changelogform.log_date);
        this.addlog.show();
        this.mdls.popdragabale();
      } else {
        this.cs.openGrowl('', 'Status', 'Some error Occured');
      }
    })
  }
  uppdatepdfoptions(option) {
    if (option == 'zoomplus' && this.pdfoptions.zoom > 0.5) { this.pdfoptions.zoom = Number(this.pdfoptions.zoom) - 0.5; }
    if (option == 'zoomminus') { this.pdfoptions.zoom = Number(this.pdfoptions.zoom) + 0.5; }
    if (option == 'rotationclock' && this.pdfoptions.rotation < 360) { this.pdfoptions.rotation = Number(this.pdfoptions.rotation) + 90 }
    if (option == 'rotationanticlock' && this.pdfoptions.rotation > 0) { this.pdfoptions.rotation = Number(this.pdfoptions.rotation) - 90 }
    if (option == 'pageminus' && Number(this.pdfoptions.page) > 1) { this.pdfoptions.showall = false; this.pdfoptions.page = Number(this.pdfoptions.page) - Number(1) }
    if (option == 'pageplus' && Number(this.pdfoptions.page) < Number(this.pdfoptions.totalpages)) { this.pdfoptions.showall = false; this.pdfoptions.page = Number(this.pdfoptions.page) + Number(1) }
    if (option == 'showall') { this.pdfoptions.showall = true; }
    if (option == 'zoomminus' && this.pdfoptions.zoom >= 0) { }
  }
  opendocument(doc) {
    this.viewlog.show();
    this.mdls.popdragabale();
    this.pdfViewer.pdfSrc = this.cs.apiUrl + "staticassets/changelogs/" + doc;
    this.pdfViewer.refresh();

  } uppdatepdfpage(value) {
    this.pdfoptions.showall = false; this.pdfoptions.page = Number(value);
  }

  onFileSelected(event) {
    this.fileUpload = event.target.files[0] || null;
  }

  onFileReset() {
    this.fileUpload = null;
    this.changelogform.refrence_doc = '';
  }

  managelogform(changeLog) {
    this.log_validation = "";
    if (changeLog.valid) {
      if (this.fileUpload && this.fileUpload?.name != this.changelogform.refrence_doc) {
        // console.log(this.fileUpload);
        this.cs.makeFileRequest("uploadbasic", ['changelogs'], [this.fileUpload], 'staticassets')
          .then((result) => {
            this.changelogform.refrence_doc = result['filename'];
            // reset fileUpload so we can add/edit changelog row
            this.fileUpload = null;
            // call function again
            this.managelogform(changeLog);
          })
          .catch(err => {
            console.error(err);
          });
      } else {
        this.manageLogSub$ = this.cs.postData({
          sourceid: 'listmgr', info: {
            tdata: {
              ...this.changelogform,
              // fix: date field if untouched isn't valid to DB
              log_date: moment(this.changelogform.log_date).format('YYYY-MM-DD')
            }, query: 'changelogs', pdata: { id: 'id', value: this.changelogform.id }
          }
        })
          .subscribe(
            (data: any) => {
              if (data.status == 1) {
                $('#tbllistid').DataTable().ajax.reload();
                this.cs.openGrowl('', "Status", "Submitted Successfully");
                changeLog.reset();
                this.addlog.hide();
              } else {
                this.cs.openGrowl('', "Status", "Some error ocured");
              }
            },
            err => {
              console.error(err);
            }
          );
      }
    } else {
      this.log_validation = "Fill out mandatory Fields";
    }
  }
  ngOnDestroy() {
    this.ls.listing_data = [];
    this.ajaxSub$?.unsubscribe();
    this.editLogSub$?.unsubscribe();
    this.manageLogSub$?.unsubscribe();
  }
}
