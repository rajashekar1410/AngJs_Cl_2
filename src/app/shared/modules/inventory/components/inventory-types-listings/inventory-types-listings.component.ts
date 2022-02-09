import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import { Subject, Subscription } from 'rxjs';
import { CommonService } from 'src/app/core/services/common/common.service';
import { IetmModalService } from 'src/app/core/services/ietm-modal/ietm-modal.service';
import { InventoryDelComponent } from '../inventory-del/inventory-del.component';
import { InventoryTypesAddUpdComponent } from '../inventory-types-add-upd/inventory-types-add-upd.component';

@Component({
  selector: 'app-inventory-types-listings',
  templateUrl: './inventory-types-listings.component.html',
  styleUrls: ['./inventory-types-listings.component.scss']
})
export class InventoryTypesListingsComponent implements OnInit, AfterViewInit, OnDestroy {

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

  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;

  ngOnInit(): void {
    // update UI
    this.cs.emitChange('1');
    this.cs.page_header = 'Manage Inventory Types';
    // DT
    this.initDTOptions();

  }

  initDTOptions() {
    const self = this;
    this.dtOptions = {
      language: { search: "Find:", searchPlaceholder: 'By: Name', emptyTable: 'No data found!' },
      pageLength: 10, serverSide: true, processing: true, searching: true, searchDelay: 650, destroy: true,
      lengthChange: true, order: [1, 'desc'], scrollY: "calc(100vh - 320px)", "scrollX": true, scrollCollapse: true,
      ajax: (dataTablesParameters: any, callback) => {
        dataTablesParameters['query_tbl'] = "inventory_types";
        dataTablesParameters['dtfilters'] = this.dtFilters;
        dataTablesParameters['searchquery'] = " where name like '%" + dataTablesParameters['search']['value'] + "%'";
        // console.log("================"+dataTablesParameters['searchquery']+"==================");
        //alert("/////");
        this.tbl_start = dataTablesParameters['start'];
        self.dataSub$ = self.http.post<{ data: any[]; draw: number; recordsFiltered: number; recordsTotal: number; }>(
          this.cs.apiUrl + "dtl_listings", dataTablesParameters, {}).subscribe(resp => {
            // console.log(JSON.stringify(resp));
            //    console.log(".........................................");
            if (resp['status'] == 1) {
              // self.contentList = resp.data;
              // this.userscount=resp.recordsTotal+1;
              callback({
                recordsTotal: resp.recordsTotal,
                recordsFiltered: resp.recordsFiltered,
                data: resp.data
              });
            }
          }, error => {
            console.log("Rrror", error);
            callback({
              recordsTotal: 0,
              recordsFiltered: 0,
              data: []
            });
          });
      },

      // note: column order in this array affects table sort in server
      columns: [
        {
          data: 'id',
          title: 'Sr. No',
          orderable: false,
          width: '8%',
          render: (_, __, ___, meta) => this.tbl_start + meta.row + 1
        },
        { data: 'name', title: 'Name' },
        {
          data: '1',
          title: 'Actions',
          orderable: false,
          width: '12%',
          visible: this.cs.user_session.user_type == 1,
          createdCell: (cell) => {
            if (this.cs.user_session.user_type != 1) return;
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
                      //that.editlog(rowId);
                      // that.editform(that.editmember, rowId, itemIndex);
                      self.triggerAddUpdInvType(true, row['id']);
                    } else if (ui.cmd == 'delete') {
                      // that.opendelconf(rowId, that.deletbkms);
                      self.triggerDelInvType(row);
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
        { orderable: false, targets: [0, 2] },
        { targets: [0, 1, 2], visible: true },
        { targets: '_all', visible: false }
      ],
    };
  }
  
  ngAfterViewInit() {
    this.reloadTable();
  }

  triggerAddUpdInvType(isEditMode = true, module_id?: string) {
    const ref = this.mdls.openmdl(InventoryTypesAddUpdComponent);
    const content = ref.content as InventoryTypesAddUpdComponent;
    content.updateUI(isEditMode, module_id);
    const sub = content.triggerInvTypeAddUpd$.subscribe(status => {
      if (status == 1) {
        const msg = isEditMode ? 'Edited' : 'Added';
        this.reloadTable();
        // Clean up
        sub.unsubscribe();
        ref.hide();
        this.cs.openGrowl('', 'Status', `Inventory Type ${msg} successfully`);
      } else {
        this.cs.openGrowl('', 'Status', `Inventory Type ${isEditMode ? 'Edit' : 'Add'} failed.`);
      }
    });
  }

  triggerDelInvType(inv) {
    const ref = this.mdls.openmdl(InventoryDelComponent);
    this.cs.popdragabale();
    // Set inv info
    const content = ref.content as InventoryDelComponent;
    content.invInfo = {
      ...inv,
      description: inv.name // needed for type listing items
    };
    content.targetTableName = 'inventory_types';
    // Listen to delete finished event
    const sub = content.triggerDel$.subscribe(status => {
      if (status == 1) {
        this.reloadTable();
        // Clean up
        sub.unsubscribe();
        ref.hide();
        this.cs.openGrowl('', 'Status', 'Inventory Type Deleted successfully');
      } else {
        this.cs.openGrowl('', 'Status', 'Inventory Type Deletion failed.');
      }
    });
  }

  reloadTable() {
    this.dtTrigger.next();
  }

  ngOnDestroy() {
    this.dataSub$?.unsubscribe();
    this.dtTrigger.unsubscribe();
  }

}
