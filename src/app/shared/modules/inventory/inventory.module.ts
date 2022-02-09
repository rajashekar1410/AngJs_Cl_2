import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryAddUpdComponent } from './components/inventory-add-upd/inventory-add-upd.component';
import { InventoryDelComponent } from './components/inventory-del/inventory-del.component';
import { InventoryListingComponent } from './components/inventory-listing/inventory-listing.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DataTablesModule } from 'angular-datatables';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { InventoryTypesAddUpdComponent } from './components/inventory-types-add-upd/inventory-types-add-upd.component';
import { InventoryTypesListingsComponent } from './components/inventory-types-listings/inventory-types-listings.component';
import { InventoryReportsComponent } from './components/inventory-reports/inventory-reports.component';
import { MomentModule } from 'ngx-moment';
import { InventoryMarkConsumedComponent } from './components/inventory-mark-consumed/inventory-mark-consumed.component';
import { InventoryReqMoreItemsComponent } from './components/inventory-req-more-items/inventory-req-more-items.component';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { IetmTableModule } from '../ietm-table/ietm-table.module';



@NgModule({
  declarations: [
    InventoryAddUpdComponent,
    InventoryDelComponent,
    InventoryListingComponent,
    InventoryTypesAddUpdComponent,
    InventoryTypesListingsComponent,
    InventoryReportsComponent,
    InventoryMarkConsumedComponent,
    InventoryReqMoreItemsComponent
  ],
  imports: [
    CommonModule,
    DataTablesModule,
    FormsModule,
    ReactiveFormsModule,
    BsDropdownModule,
    MomentModule,
    BsDatepickerModule,
    IetmTableModule
  ],
  exports: [
    InventoryAddUpdComponent,
    InventoryDelComponent,
    InventoryListingComponent,
    InventoryTypesAddUpdComponent,
    InventoryTypesListingsComponent,
    InventoryReportsComponent,
    InventoryMarkConsumedComponent,
    InventoryReqMoreItemsComponent
  ]
})
export class InventoryModule { }
