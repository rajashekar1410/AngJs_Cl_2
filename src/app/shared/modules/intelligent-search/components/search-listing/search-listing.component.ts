import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import { Subject, Subscription } from 'rxjs';
import { CommonService } from 'src/app/core/services/common/common.service';
import { IetmModalService } from 'src/app/core/services/ietm-modal/ietm-modal.service';
import { ISContentArray, ISContentTypes } from '../../models/intelligent-search';
import { SearchAddUpdComponent } from '../search-add-upd/search-add-upd.component';
import { SearchDelComponent } from '../search-del/search-del.component';
import * as moment from 'moment';

@Component({
  selector: 'app-search-listing',
  templateUrl: './search-listing.component.html',
  styleUrls: ['./search-listing.component.scss']
})
export class SearchListingComponent implements OnInit, AfterViewInit, OnDestroy {

  constructor(
    public cs: CommonService,
    private http: HttpClient,
    private mdls: IetmModalService
  ) { }


  dtOptions: DataTables.Settings = {}
  dtFilters = {};
  dtTrigger = new Subject();

  tbl_start = 0;

  dataSub$: Subscription = null;

  contentTypeArray = ISContentArray;

  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;

  ngOnInit(): void {
    // Enable page nav buttons
    this.cs.emitChange('1');
    // Init stuff
    const self = this;
    this.dtOptions = {
      language: { search: "Find:", searchPlaceholder: 'By: keyword, Search Suggestions', emptyTable: 'No data found' },
      pageLength: 10, serverSide: true, processing: false, searching: true, searchDelay: 450,
      lengthChange: true, order: [5, 'desc'], scrollY: "calc(100vh - 280px)", "scrollX": true, scrollCollapse: true, destroy: true,
      ajax: (dataTablesParameters: any, callback) => {
        dataTablesParameters['query_tbl'] = "gs_keywords";
        dataTablesParameters['dtfilters'] = this.dtFilters;
        dataTablesParameters['searchquery'] = " where keyword like '%" + dataTablesParameters['search']['value'] + "%' OR suggestions like '%" + dataTablesParameters['search']['value'] + "%'";
        // console.log("================"+dataTablesParameters['searchquery']+"==================");
        //alert("/////");
        this.tbl_start = dataTablesParameters['start'];
        self.dataSub$ = self.http.post<{ data: any[]; draw: number; recordsFiltered: number; recordsTotal: number; }>(
          this.cs.apiUrl + "dtl_listings", dataTablesParameters, {}).subscribe(resp => {
            // console.log(JSON.stringify(resp));
            //    console.log(".........................................");
            if (resp['status'] == 1) {
              const data = resp.data.map(el => {
                try {
                  // remove UTF-8special chars
                  el.child_items = el.child_items.replace(/[\x00-\x1f]*/g, '');
                  el.child_items = JSON.parse(el.child_items);
                } catch (_) {
                  console.error(_);
                  el.child_items = [];
                }
                try {
                  el.suggestions = el.suggestions.split(',');
                } catch (_) {
                  console.error(_);
                  el.suggestions = '';
                }
                return el
              });

              // this.userscount=resp.recordsTotal+1;
              callback({
                recordsTotal: resp.recordsTotal,
                recordsFiltered: resp.recordsFiltered,
                data: data
              });
            }
          }, error => {
            console.log("Rrror", error);
          });
      },

      // note: column order in this array affects table sort in server
      columns: [
        {
          data: 'index',
          title: 'Sr. No',
          orderable: false,
          width: '8%',
          render: (_, __, ___, meta) => this.tbl_start + meta.row + 1
        },
        { data: 'keyword', title: 'Search Keyword' },
        {
          data: 'type',
          title: 'Content Type',
          render: (val) => self.renderContentType(val)
        },
        {
          data: 'child_items',
          title: 'Linked Content',
          width: '18%',
          createdCell: (cell, cellData: any[]) => {
            // clear old content
            $(cell).html('');
            // ngFor in TS ;)
            let finalStr = `<select style="width: 100%">`;
            // generate <option> from array data
            const out = cellData.map(el => {
              let option = "<option>";
              if (el.title) {
                option += `<span>${el.title}</span>`;
              } else {
                option += `<span><b class="text-error">ERROR</b></span>`;
              }
              option += '</option>';
              return option;
            });
            finalStr += out.toString();

            finalStr += '</select>';

            // render output
            $(cell).html(finalStr);
          }
        },
        {
          data: 'suggestions',
          title: 'Search Suggestions',
          width: '18%',
          createdCell: (cell, cellData: string[]) => {
            // clear old content
            $(cell).html('');
            // ngFor in TS ;)
            let finalStr = `<select style="width: 100%">`;
            // generate <option> from array data
            const out = cellData.map(el => {
              let option = "<option>";
              if (el) {
                option += `<span>${el}</span>`;
              } else {
                option += `<span><b class="text-error">ERROR</b></span>`;
              }
              option += '</option>';
              return option;
            });
            finalStr += out.toString();

            finalStr += '</select>';

            // render output
            $(cell).html(finalStr);
          }
        },
        {
          data: 'date',
          title: 'Creation Date',
          width: '18%',
          render: (val) => moment(val).format('MMM  Do YYYY, hh:mm a')
        },
        {
          data: '1',
          title: 'Actions',
          orderable: false,
          width: '8%',
          visible: self.cs.user_session.user_type == 1,
          createdCell: (cell) => {
            if (self.cs.user_session.user_type != 1) return;
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
                    const row = $("#tbllistid").DataTable().row(cellItem).data();
                    // console.log(itemIndex);
                    if (ui.cmd == 'edit') {
                      self.triggerAddUpdSearchItem(true, row['id']);
                    } else if (ui.cmd == 'delete') {
                      self.deleteSearchItem(row);
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
        { data: 'id', visible: false },
      ],
      columnDefs: [
        { targets: '_all', defaultContent: '' }
      ]
    };
  }

  ngAfterViewInit() {
    this.reloadTable();
  }

  // increase performance for contentList items in ngFor loop
  _trackSearchNgFor(index: number, item: any) {
    return item.id;
  }

  renderContentType(contentTypeValue: ISContentTypes) {
    const contentType = this.contentTypeArray.find(e => e.id == contentTypeValue)
    return contentType.text;
  }

  deleteSearchItem(data) {
    const ref = this.mdls.openmdl(SearchDelComponent);
    // Listen to delete finished event
    const content = ref.content as SearchDelComponent;
    content.searchInfo = data;
    content.modalRef = ref;
    const sub = content.triggerDel$.subscribe(status => {
      if (status == 1) {
        this.reloadTable();
        // Clean up
        sub.unsubscribe();
        this.mdls.modalRef.hide();
        this.cs.openGrowl('', 'Status', 'Search item Deleted successfully');
      } else {
        this.cs.openGrowl('', 'Status', 'Search item deletion failed.');
      }
    });
  }

  triggerAddUpdSearchItem(isEditMode, search_id?: string) {
    const ref = this.mdls.openmdl(SearchAddUpdComponent);
    const content = ref.content as SearchAddUpdComponent;
    content.updateUI(isEditMode, search_id);
    // fix backdrop not visible when closed with `mdls.closepop`
    content.modalRef = ref;
    const sub = content.trigger$.subscribe(status => {
      if (status == 1) {
        const msg = isEditMode ? 'Edited' : 'Added';
        this.reloadTable()
        // Clean up
        sub.unsubscribe();
        ref.hide();
        this.cs.openGrowl('', 'Status', `Search Item ${msg} successfully`);
      } else {
        this.cs.openGrowl('', 'Status', `Search Item ${isEditMode ? 'Edit' : 'Add'} failed.`);
      }
    })
  }

  reloadTable() {
    // this.dtElement.dtInstance.then(instance => instance.ajax.reload());
    this.dtTrigger.next();
  }

  ngOnDestroy() {
    this.dtTrigger.unsubscribe();
  }

}
