import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { BsModalService } from 'ngx-bootstrap/modal';
import { IPageModule } from 'src/app/core/models/page-module';
import { CommonService } from 'src/app/core/services/common/common.service';
import { PrintDataTypes } from '../../../print-data/models/print-data-type';
import { PrintDataService } from '../../../print-data/services/print-data.service';
import { ModuleAccessRightsComponent } from '../module-access-rights/module-access-rights.component';
import { ModuleAddUpdComponent } from '../module-add-upd/module-add-upd.component';
import { ModuleDelComponent } from '../module-del/module-del.component';

@Component({
  selector: 'app-module-listing',
  templateUrl: './module-listing.component.html',
  styleUrls: ['./module-listing.component.scss']
})
export class ModuleListingComponent implements OnInit, AfterViewInit, OnDestroy {

  constructor(
    public cs: CommonService,
    private http: HttpClient,
    private bsModal: BsModalService,
    private printDataService: PrintDataService
  ) { }

  modulesList: IPageModule[] = []
  dtOptions: DataTables.Settings = {}
  dtFilters = {};
  dtTrigger = new Subject();


  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;

  tbl_start = 0

  ngOnInit() {
    // Enable page nav buttons
    this.cs.emitChange('1');
    // Page title
    this.cs.page_header = 'Manage IETM Modules';
    // Init stuff
    const self = this;
    this.dtOptions = {
      "language": { search: "Find:", searchPlaceholder: 'By: Module Name', emptyTable: 'No records found' },
      pageLength: 10, serverSide: true, processing: false, searching: true,
      lengthChange: true, "order": [2, 'asc'], scrollY: "calc(100vh - 320px)", "scrollX": true, scrollCollapse: true, destroy: true,
      ajax: (dataTablesParameters: any, callback) => {
        dataTablesParameters['query_tbl'] = "page_modules";
        dataTablesParameters['dtfilters'] = self.dtFilters;
        dataTablesParameters['searchquery'] = " where name like '%" + dataTablesParameters['search']['value'] + "%' "
        // console.log("================"+dataTablesParameters['searchquery']+"==================");
        this.tbl_start = dataTablesParameters['start'];
        self.http.post<{ data: any[]; draw: number; recordsFiltered: number; recordsTotal: number; }>(
          this.cs.apiUrl + "dtl_listings", dataTablesParameters, {}).subscribe(resp => {
            //  alert(JSON.strinfigy(resp));
            //  self.modulesList = resp.data;
            // this.userscount=resp.recordsTotal+1;
            callback({
              recordsTotal: resp.recordsTotal,
              recordsFiltered: resp.recordsFiltered,
              data: resp.data
            });
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
        { data: 'id', title: 'ID No.', width: '8%' },
        { data: 'item_order', title: 'Module Position', width: '5%' },
        { data: 'name', title: 'Module Name' },

        {
          data: '1',
          title: 'Actions',
          orderable: false,
          width: '8%',
          visible: self.cs.user_session.user_type == 0,
          createdCell: (cell) => {
            if (self.cs.user_session.user_type != 0) return;
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

                  { title: "Edit Module", cmd: "edit", uiIcon: "ui-icon-pencil" },
                  { title: "Delete Module", cmd: "delete", uiIcon: "ui-icon-trash" },
                  { title: "Access Rights", cmd: "acsrights", uiIcon: "ui-icon-locked" },
                ],
                preventContextMenuForPopup: true,
                select: function (_event: never, ui: { target: JQuery<HTMLElement>, cmd: string }) {
                  try {

                    // console.log(itemIndex);
                    if (ui.cmd == 'edit') {
                      self.triggerAddUpdModule(true, row.id)
                    } else if (ui.cmd == 'delete') {
                      self.triggerDelModule(row)
                    }
                    else if (ui.cmd == 'acsrights') {
                      self.triggerModuleAccessRights(row.id)
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
        { data: 'descr', visible: false },
        { data: 'image', visible: false },

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
    $(thSelector).hide();
    $(tbSelector).hide();
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
        },
        err => {
          console.error(err);
          // reset table UI
          $(thSelector).show();
          $(tbSelector).show();
        }
      )
  }

  triggerAddUpdModule(isEditMode = true, module_id?: string) {
    const ref = this.bsModal.show(ModuleAddUpdComponent, { class: this.cs.default_theme, keyboard: false, ignoreBackdropClick: true });
    this.cs.popdragabale();
    const content = ref.content as ModuleAddUpdComponent;
    content.updateUI(isEditMode, module_id);
    const sub = content.triggerModuleAddUpd$.subscribe(status => {
      if (status == 1) {
        const msg = isEditMode ? 'Edited' : 'Added';
        this.reloadTable()
        // Clean up
        sub.unsubscribe();
        ref.hide();
        this.cs.openGrowl('', 'Status', `Module ${msg} successfully`);
        // fetch new data
        this.cs.refreshModuleData();
      } else {
        this.cs.openGrowl('', 'Status', `Module ${isEditMode ? 'Edit' : 'Add'} failed.`);
      }
    })
  }

  triggerDelModule(module) {
    const ref = this.bsModal.show(ModuleDelComponent, { class: this.cs.default_theme });
    this.cs.popdragabale();
    // Set module info
    const content = ref.content as ModuleDelComponent;
    content.moduleInfo = module;
    // Listen to delete finished event
    const sub = content.triggerDel$.subscribe(status => {
      if (status == 1) {
        this.reloadTable();
        // Clean up
        sub.unsubscribe();
        ref.hide();
        this.cs.openGrowl('', 'Status', 'Module Deleted successfully');
        // fetch new data
        this.cs.refreshModuleData();
      } else {
        this.cs.openGrowl('', 'Status', 'Module deletion failed.');
      }
    })
  }

  triggerModuleAccessRights(id) {
    const ref = this.bsModal.show(ModuleAccessRightsComponent, { class: this.cs.default_theme });
    this.cs.popdragabale();
    // Set module info
    const content = ref.content as ModuleAccessRightsComponent;
    content.moduleInfo.id = id;
  }

  reloadTable() {
    // $('#tbllistid').DataTable().ajax.reload();
    this.dtTrigger.next();
  }


  ngOnDestroy() {
    this.dtTrigger.unsubscribe();
  }

}
