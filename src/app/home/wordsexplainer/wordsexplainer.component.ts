import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import { CommonService } from '../../core/services/common/common.service';
import { IetmModalService } from '../../core/services/ietm-modal/ietm-modal.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, Subscription } from 'rxjs';
import { PrintDataTypes } from 'src/app/shared/modules/print-data/models/print-data-type';
import { PrintDataService } from 'src/app/shared/modules/print-data/services/print-data.service';

@Component({
  selector: 'app-wordsexplainer',
  templateUrl: './wordsexplainer.component.html',
})
export class WordsexplainerComponent implements OnInit, AfterViewInit, OnDestroy {

  // @ViewChild('explainerdel', { static: true }) public explainerdel: ModalDirective;

  public tbl_start = 0;
  public dtfilters = {};
  dtOptions: DataTables.Settings = {};

  constructor(
    public router: Router,
    private http: HttpClient,
    public mdls: IetmModalService,
    public cs: CommonService,
    private printDataService: PrintDataService
  ) {
    this.cs.emitChange('1');
  }
  dtTrigger = new Subject();

  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;

  // used for spawning word-explainer modal.
  wmEmitter = new Subject<any>()
  wmdEmitter = new Subject<any>()

  getdata() {
    const that = this;
    this.dtOptions = {};
    this.dtOptions = {
      language: { search: "Find:", searchPlaceholder: 'By: Content, Content Title', emptyTable: 'No records found' },
      pageLength: 10, serverSide: true, processing: false, searching: true,
      lengthChange: true, "order": [[1, "desc"]], scrollY: "calc(100vh - 280px)", "scrollX": true, scrollCollapse: true, destroy: true,
      ajax: (dataTablesParameters: any, callback) => {
        dataTablesParameters['query_tbl'] = "wordsexplainer";
        dataTablesParameters['dtfilters'] = this.dtfilters;
        dataTablesParameters['searchquery'] = " where ( content like '%" + dataTablesParameters['search']['value'] + "%' || content_title like '%" + dataTablesParameters['search']['value'] + "%'  )"
        // console.log("================"+dataTablesParameters['searchquery']+"==================");
        //alert("/////");
        this.tbl_start = dataTablesParameters['start'];
        that.http.post<{ data: any[]; draw: number; recordsFiltered: number; recordsTotal: number; }>(
          this.cs.apiUrl + "dtl_listings", dataTablesParameters, {}).subscribe(resp => {
            //   console.log(JSON.stringify(resp));
            //    console.log(".........................................");
            if (resp['status'] == 1) {
              // that.ls.listing_data = resp.data;
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
          data: 'index',
          title: 'Sr. No',
          orderable: false,
          render: (_, __, ___, meta) => this.tbl_start + meta.row + 1
        },
        { data: 'id', title: 'Content ID' },
        {
          data: 'content_type',
          title: 'Content Type',
          render: (data) => {
            return that.cs.explainers[data]
          }
        },
        {
          data: 'content_title',
          title: 'Content Title',
          render: (val) => `<span class="txtlink" style="text-decoration: none">${val}</span>`,
          createdCell: (cell, _, row) => {
            $(cell).on('click', () => {
              const page_id = row['page_id'];
              if (page_id > 0) {
                that.cs.navigateToPage(page_id);
              } else {
                that.cs.openGrowl('', 'Status', `Page no '${page_id}' is invalid`);
              }
            });
          }
        },
        {
          data: '1',
          title: 'Actions',
          orderable: false,
          visible: that.cs.user_session.user_type == 1,
          createdCell: (cell) => {
            if (that.cs.user_session.user_type != 1) return;
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

                ],
                preventContextMenuForPopup: true,
                select: function (_event: never, ui: { target: JQuery<HTMLElement>, cmd: string }) {
                  try {
                    const cellItem = $(ui.target).closest('td');
                    const rowId = $("#tbllistid").DataTable().row(cellItem).data()['id'];
                    // console.log(itemIndex);
                    if (ui.cmd == 'edit') {
                      that.editlog(rowId);
                      // that.editform(that.editmember, rowId, itemIndex);
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
        { data: 'page_id', visible: false }
      ],
      columnDefs: [
        { targets: '_all', defaultContent: '' }
      ]
    };
  }
  ngAfterViewInit() {
    this.reloadTable();
  }
  printData() {
    // console.log('printData called');
    // hide 1st and last column + rows of table
    const thSelector = '.table thead th:last-child';
    const tbSelector = '.table tbody td:last-child';
    // TODO: improve selection accuracy
    const checkboxSelector = 'input:checkbox';
    $(thSelector).hide();
    $(tbSelector).hide();
    $(checkboxSelector).hide();
    // print request
    const headers = $('.table thead').html();
    const tbody = $('.table tbody').html();
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
          $(checkboxSelector).show();
        },
        err => {
          console.error(err);
          // reset table UI
          $(thSelector).show();
          $(tbSelector).show();
          $(checkboxSelector).show();
        }
      )
  }

  ngOnInit() {
    this.getdata();
    this.cs.page_header = "My Hotspots";
    // dynamic hotspot
    this.wmEmitter.subscribe(resp => {
      const type = resp.type
      if (type == 'action_done') {
        $('#tbllistid').DataTable().ajax.reload();
        this.cs.openGrowl('', "Status", "Submitted Successfully");
      }
    })
  }

  logaddform() {
    this.wmEmitter.next({
      type: 'add_mode'
    })
  }

  editlog(id) {
    this.wmEmitter.next({
      type: 'edit_mode',
      data: id
    })
  }

  showDelCnfm() {
    this.wmdEmitter.next({
      type: 'del_cnfm'
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
