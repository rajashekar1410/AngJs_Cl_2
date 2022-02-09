import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModuleListingComponent } from './components/module-listing/module-listing.component';
import { ModuleAddUpdComponent } from './components/module-add-upd/module-add-upd.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ModuleDelComponent } from './components/module-del/module-del.component';
import { DataTablesModule } from 'angular-datatables';
import { ModuleAccessRightsComponent } from './components/module-access-rights/module-access-rights.component';
import { IetmTableModule } from '../ietm-table/ietm-table.module';



@NgModule({
  declarations: [
    ModuleListingComponent,
    ModuleAddUpdComponent,
    ModuleDelComponent,
    ModuleAccessRightsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DataTablesModule,
    IetmTableModule
  ],
  exports: [
    ModuleListingComponent
  ],
  entryComponents: [
    ModuleDelComponent,
    ModuleAddUpdComponent,
    ModuleAccessRightsComponent
  ]
})
export class ModuleManagerModule { }
