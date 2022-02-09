import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { DataTableDirective } from 'angular-datatables';
import { Subject, Subscription } from 'rxjs';
import { CommonService } from 'src/app/core/services/common/common.service';
import { PrintDataTypes } from '../../../print-data/models/print-data-type';
import { PrintDataService } from '../../../print-data/services/print-data.service';
import { LogActionTypes } from '../../../user-tracking/models/track-logs';
import { LogTypes } from '../../models/log-types';
import { LogsDelComponent } from '../logs-del/logs-del.component';
import { LogsSensorActComponent } from '../logs-sensor-act/logs-sensor-act.component';
import * as moment from 'moment';


@Component({
  selector: 'app-logs-sensor-act-listing',
  templateUrl: './logs-sensor-act-listing.component.html',
  styleUrls: ['./logs-sensor-act-listing.component.scss']
})
export class LogsSensorActListingComponent implements OnInit, AfterViewInit, OnDestroy {


  constructor(
    public cs: CommonService,
    private http: HttpClient,
    private bsModal: BsModalService,
    private printDataService: PrintDataService
  ) { }

  contentList = []
  dtOptions: DataTables.Settings = {}
  dtFilters = {};
  dtTrigger = new Subject();
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;

  tbl_start = 0;

  fetchDataSub$: Subscription = null;

  logActionTypes = LogActionTypes;

  ngOnInit() {
    // Enable page nav buttons
    this.cs.emitChange('1');
    // Page title
    this.cs.page_header = 'Logs';
    // Update filter
    this.dtFilters['log_type'] = LogTypes.TYPE_LOG_SENSOR_ACT;

    // Init stuff
    this.initDTOptions();
  }

  initDTOptions() {
    const self = this;
    this.dtOptions = {
      "language": { search: "Find:", searchPlaceholder: 'By: Description of Activity, Remarks', emptyTable: 'No records found' },
      pageLength: 10, serverSide: true, processing: false, searching: true,
      lengthChange: true, "order": [1, 'desc'], scrollY: "calc(100vh - 335px)", "scrollX": true, scrollCollapse: true, destroy: true,
      ajax: (dataTablesParameters: any, callback) => {
        dataTablesParameters['query_tbl'] = "logs";
        dataTablesParameters['dtfilters'] = self.dtFilters;
        dataTablesParameters['searchquery'] = " and data like '%" + dataTablesParameters['search']['value'] + "%' "
        // console.log("================"+dataTablesParameters['searchquery']+"==================");
        this.tbl_start = dataTablesParameters['start'];
        self.fetchDataSub$ = self.http.post<{ data: any[]; draw: number; recordsFiltered: number; recordsTotal: number; }>(
          this.cs.apiUrl + "dtl_listings", dataTablesParameters, {})
          .subscribe(resp => {
            //  alert(JSON.strinfigy(resp));
            /*self.contentList = resp.data?.map(el => {
              el.data = JSON.parse(el.data);
              return el;
            });*/
            // this.userscount=resp.recordsTotal+1;
            callback({
              recordsTotal: resp.recordsTotal,
              recordsFiltered: resp.recordsFiltered,
              data: resp.data?.map(el => {
                el.data = JSON.parse(el.data);
                return el;
              })
            });
            // setTimeout(() => {
            //   $('#tbllistid').DataTable().columns.adjust();
            // }, 300);
          },
            error => {
              console.log("Rrror", error);
              callback({
                recordsTotal: 0,
                recordsFiltered: 0,
                data: []
              });
            }
          );
      },
      drawCallback: () => {
        setTimeout(() => {
          self.dtElement?.dtInstance?.then(i => i.columns.adjust());
        }, 300);
      },
      // note: column order in this array affects table sort in server
      columns: [
        {
          data: 'id',
          title: 'Sr. No',
          orderable: false,
          render: (_, __, ___, meta) => this.tbl_start + meta.row + 1
        },
        { data: 'date', title: 'Date', render: (val) => moment(val).format('MMM  Do YYYY, hh:mm a') },
        {
          data: 'data', title: 'Description Of Activity',
          render: (_, __, row) => {
            const data = row?.data?.descAct || null;
            if (!data) return '--';
            return data
          }
        },

        {
          data: '1', width: '15%', title: 'remarks',
          render: (_, __, row) => {
            const data = row?.data?.remarks || null;
            if (!data) return '--';
            return data
          }
        },
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

            const row: any = $("#tbllistid").DataTable().row(cell).data();
            // context menu init
            ($ as any)(cell)
              .contextmenu({
                delegate: "button",
                menu: [

                  { title: "Edit Log", cmd: "edit", uiIcon: "ui-icon-pencil" },
                  { title: "Delete Log", cmd: "delete", uiIcon: "ui-icon-trash" },
                ],
                preventContextMenuForPopup: true,
                select: function (_event: never, ui: { target: JQuery<HTMLElement>, cmd: string }) {
                  try {

                    // console.log(itemIndex);
                    if (ui.cmd == 'edit') {
                      self.triggerAddUpdSensorAct(self.logActionTypes.TYPE_LOG_EDITED, row.id)
                    } else if (ui.cmd == 'delete') {
                      self.triggerDelLog(row.id)
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
        { data: 'log_type', visible: false },
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

  triggerAddUpdSensorAct(isEditMode: LogActionTypes, module_id?: string) {
    const ref = this.bsModal.show(LogsSensorActComponent);
    ref.setClass(`modal-md ${this.cs.default_theme}`);
    this.cs.popdragabale();
    const content = ref.content as LogsSensorActComponent;
    content.updateUI(isEditMode, module_id);
    const sub = content.triggerLogsAddUpd$.subscribe(status => {
      if (status == 1) {
        const msg = isEditMode == LogActionTypes.TYPE_LOG_EDITED ? 'Edited' : 'Added';
        this.reloadTable()
        // Clean up
        sub.unsubscribe();
        ref.hide();
        this.cs.openGrowl('', 'Status', `Log ${msg} successfully`);
      } else {
        this.cs.openGrowl('', 'Status', `Log ${isEditMode ? 'Edit' : 'Add'} failed.`);
      }
    })
  }

  triggerDelLog(logId: number) {
    const ref = this.bsModal.show(LogsDelComponent, {
      initialState: {
        logInfo: {
          id: logId
        },
        logType: LogTypes.TYPE_LOG_SENSOR_ACT
      }
    });
    this.cs.popdragabale();
    const content = ref.content as LogsDelComponent;
    // Listen to delete finished event
    const sub = content.triggerDel$.subscribe(status => {
      if (status == 1) {
        this.reloadTable();
        // Clean up
        sub.unsubscribe();
        ref.hide();
        this.cs.openGrowl('', 'Status', 'Log Deleted successfully');
      } else {
        this.cs.openGrowl('', 'Status', 'Log deletion failed.');
      }
    })
  }

  triggerModuleAccessRights(id) {
    /*const ref = this.bsModal.show(ModuleAccessRightsComponent);
    this.cs.popdragabale();
    // Set module info
    const content = ref.content as ModuleAccessRightsComponent;
    content.moduleInfo.id = id;*/
  }

  reloadTable() {
    // $('#tbllistid').DataTable().ajax.reload();
    this.dtTrigger.next();
  }

  ngOnDestroy() {
    this.fetchDataSub$?.unsubscribe();
    this.dtTrigger.unsubscribe();
  }


}
