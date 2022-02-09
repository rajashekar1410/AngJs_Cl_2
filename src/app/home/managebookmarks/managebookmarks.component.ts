import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonService } from '../../core/services/common/common.service';
import { IetmModalService } from '../../core/services/ietm-modal/ietm-modal.service';
import { HttpClient } from '@angular/common/http';
import { PrintDataTypes } from 'src/app/shared/modules/print-data/models/print-data-type';
import { PrintDataService } from 'src/app/shared/modules/print-data/services/print-data.service';
import { ITrackBookmarkEvent, TrackBookmarkEvent } from 'src/app/shared/modules/user-tracking/models/track-bookmark';
import { concatMap, map } from 'rxjs/operators';
import { UserTrackingService } from 'src/app/shared/modules/user-tracking/services/user-tracking/user-tracking.service';
import { TrackingTypes } from 'src/app/shared/modules/user-tracking/models/tracking-data';
import * as moment from 'moment';
import { DataTableDirective } from 'angular-datatables';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { NgForm } from '@angular/forms';

declare var $: JQueryStatic;

@Component({
  selector: 'app-managebookmarks',
  templateUrl: './managebookmarks.component.html',
  styleUrls: ['./managebookmarks.component.css']
})
export class ManagebookmarksComponent implements OnInit {

  dtOptions: DataTables.Settings = {};
  formvalidation: string;
  tdata = { id: '', page_id: '', bookmark_name: '' };
  selecbkmpos = 0;

  dtfilters = {};
  tbl_start = 0;

  tddelete = 0;
  delModalRef: BsModalRef = null;

  @ViewChild('editmember', { read: TemplateRef }) editmember: TemplateRef<any>;
  @ViewChild('deletbkms', { read: TemplateRef }) deletbkms: TemplateRef<any>;

  @ViewChild(DataTableDirective) dtElement: DataTableDirective;

  constructor(
    private http: HttpClient,
    public cs: CommonService,
    public mdls: IetmModalService,
    private printDataService: PrintDataService,
    private trackingService: UserTrackingService
  ) { }

  opendelconf(id: number, deletannots: TemplateRef<any>) {
    this.tddelete = id;
    this.delModalRef = this.mdls.openmdl(deletannots);
  }
  deletebkm(id: number) {
    this.dtElement?.dtInstance?.then(i => {
      const bookmark = i.data().filter(x => x.id == id).toArray()[0];
      const bookmarkEvent: ITrackBookmarkEvent = {
        bookmarkName: bookmark['bookmark_name'],
        event: TrackBookmarkEvent.TYPE_BKM_DELETED
      }

      return this.cs.postData({ sourceid: 'delete_listing', info: { query: 'bookmarks', pdata: { id: 'id', value: id } } })
        .pipe(
          concatMap(res => {
            return this.trackingService.trackBookmarkEvent({
              uid: this.cs.user_session.id,
              type: TrackingTypes.TYPE_BOOKMARKS,
              data: JSON.stringify(bookmarkEvent),
            }).pipe(map(_ => res))
          })
        )
        .toPromise()
        .then((data: any) => {
          if (data.status == 1) {
            //this.ls.listing_data.splice(j,1);
            i.ajax.reload();
            if (this.delModalRef) this.delModalRef.hide();
            this.cs.openGrowl('', 'Status', 'Deleted successfully');
          } else {
            this.cs.openGrowl('', 'Status', 'Some error Occured');
          }
        })
        .catch(err => {
          console.error(err);
        });
    });
  }
  managebookmarks(annotForm: NgForm) {
    if (annotForm.invalid) {
      this.formvalidation = "Fill out all Mandatory Fields";
      return;
    };

    this.dtElement.dtInstance.then(i => {
      const bookmark = i.data().filter(x => x.id == this.tdata.id).toArray()[0];
      const bookmarkEvent: ITrackBookmarkEvent = {
        bookmarkName: `From '${bookmark.bookmark_name}' to '${this.tdata.bookmark_name}'`,
        event: TrackBookmarkEvent.TYPE_BKM_EDITED
      };
      return this.cs.postData({ sourceid: 'listmgr', info: { tdata: this.tdata, query: 'bookmarks', pdata: { id: 'id', value: this.tdata['id'] } } })
        .pipe(
          concatMap(res => {
            return this.trackingService.trackBookmarkEvent({
              uid: this.cs.user_session.id,
              type: TrackingTypes.TYPE_BOOKMARKS,
              data: JSON.stringify(bookmarkEvent),
            }).pipe(map(_ => res))
          })
        )
        .toPromise()
        .then((data: any) => {
          if (data.status == 1) {
            this.mdls.modalRef.hide();
            this.cs.openGrowl('', 'Status', 'Updated successfully');
            // refresh data
            i.ajax.reload();
          } else {
            this.cs.openGrowl('', 'Status', 'Some error Occured');
          }
        })
        .catch(err => {
          console.error(err);
        });
    });
  }

  openpage(pageId: number) {
    // alert(cat+">>>???"+id);
    this.cs.navigateToPage(pageId);
  }
  editform(mdlid: any, pvalue: number, j: number) {
    this.selecbkmpos = j;
    this.tdata = { id: '', page_id: '', bookmark_name: '' };
    this.cs.postData({
      sourceid: 'listingdetails', info: { query: 'bookmarks', pdata: { id: 'id', value: pvalue }, selcolumns: ['id', 'page_id', 'bookmark_name'] }
    }).subscribe((data: any) => {
      if (data.status == 1) {
        this.tdata = data.response;

        // alert(JSON.stringify(this.tdata));
        //alertalert(this.tdata);
        this.mdls.openmdl(mdlid);

      } else {
        this.cs.openGrowl('', 'Status', 'Some error Occured');
      }
    })
  }
  getdtllistings() {
    if (this.cs.user_session['user_type'] > 1) {
      this.dtfilters['created_by'] = this.cs.user_session['id'];
    }
    const that = this;
    this.dtOptions = {
      "language": { search: "Find:", searchPlaceholder: 'By: Name', emptyTable: 'No records found' },
      pageLength: 10, serverSide: true, processing: false, searching: true,
      lengthChange: true, "order": [[6, "desc"]], scrollY: "calc(100vh - 300px)", "scrollX": true, scrollCollapse: true,
      ajax: (dataTablesParameters: any, callback) => {
        dataTablesParameters['query_tbl'] = "bookmarksview";
        dataTablesParameters['dtfilters'] = this.dtfilters;
        if (Object.keys(this.dtfilters).length != 0) {
          dataTablesParameters['searchquery'] = " and bookmark_name like '%" + dataTablesParameters['search']['value'] + "%' "
        } else {
          dataTablesParameters['searchquery'] = " where bookmark_name like '%" + dataTablesParameters['search']['value'] + "%'"
        }
        this.tbl_start = dataTablesParameters['start'];
        that.http.post<{ data: any[]; draw: number; recordsFiltered: number; recordsTotal: number; }>(
          this.cs.apiUrl + "dtl_listings", dataTablesParameters, {}).subscribe(resp => {
            callback({
              recordsTotal: resp.recordsTotal,
              recordsFiltered: resp.recordsFiltered,
              data: resp.data
            });
          }, error => {
            console.log("Rrror", error);
          });
      },
      columns: [
        // do not remove this column, it affects column sort in server 
        { data: 'index', visible: false },
        {
          data: 'id',
          title: 'Sr. No',
          orderable: false,
          render: (_, __, ___, meta) => this.tbl_start + meta.row + 1
        },
        {
          data: 'bookmark_name',
          title: 'Name and Link',
          render: (val) => `<span class="txtlink" style="text-decoration: none">${val}</span>`,
          createdCell: (cell) => {
            // cell click listener
            $(cell).on('click', function () {
              const pageId = $("#tbllistid").DataTable().row(cell).data()['page_id'];
              that.openpage(pageId);
            });
          }
        },
        { data: 'title', title: 'Page Name' },
        { data: 'page_module_name', title: 'Module Name' },
        { data: 'user_name', title: 'User' },
        {
          data: 'creation_date',
          title: 'Date and Time',
          render: (val) => moment(val).format('MMM  Do YYYY, hh:mm a')
        },
        {
          data: '1',
          title: 'Actions',
          orderable: false,
          createdCell: (cell) => {
            // clear old contents
            $(cell).html('');

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
                  { title: "Edit", cmd: "edit", uiIcon: "ui-icon-pencil" },
                  { title: "Delete", cmd: "delete", uiIcon: "ui-icon-trash" },
                ],
                preventContextMenuForPopup: true,
                select: function (_event: never, ui: { target: JQuery<HTMLElement>, cmd: string }) {
                  try {
                    const cellItem = $(ui.target).closest('td');
                    const rowId = $("#tbllistid").DataTable().row(cellItem).data()['id'];
                    const itemIndex = $("#tbllistid").DataTable().cell(cellItem).index().row;
                    // console.log(itemIndex);
                    if (ui.cmd == 'edit') {
                      that.editform(that.editmember, rowId, itemIndex);
                    } else if (ui.cmd == 'delete') {
                      that.opendelconf(rowId, that.deletbkms);
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
        { data: 'created_by', visible: false },
        { data: 'page_id', visible: false },
        { data: 'employee_id', visible: false },
        { data: 'page_category', visible: false },
        { data: 'page_module', visible: false },
      ],
      columnDefs: [
        { targets: '_all', defaultContent: '' }
      ]
    };
  }
  printData() {
    // console.log('printData called');
    // hide last column + rows of table
    const thSelector = `.table thead th:last-child`;
    const tbSelector = `.table tbody td:last-child`;
    $(thSelector).hide();
    $(tbSelector).hide();
    // print request
    const headers = $(`.table thead`).html();
    const tbody = $(`.table tbody`).html();
    this.printDataService.printContent({
      data: {
        thead: headers,
        tbody
      },
      type: PrintDataTypes.TYPE_TABLE
    })
      .subscribe(
        _ => {
          // reset table UI
          $(thSelector).show();
          $(tbSelector).show();
        },
        err => {
          console.error(err);
          // reset table UI
          $(thSelector).show();
          $(tbSelector).show();
        }
      )
  }
  ngOnInit(): void {
    // Update UI
    this.cs.emitChange('1');
    this.cs.page_header = "Manage Bookmarks";

    this.getdtllistings();
  }

}
