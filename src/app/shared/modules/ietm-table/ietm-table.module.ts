import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IetmTableComponent } from './components/ietm-table/ietm-table.component';
import { DataTablesModule } from 'angular-datatables';
import { MomentModule } from 'ngx-moment';
import { FormsModule } from '@angular/forms';
import { PipeModule } from 'src/app/pipes/pipe.module';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ModalModule } from 'ngx-bootstrap/modal';



@NgModule({
  declarations: [
    IetmTableComponent
  ],
  imports: [
    CommonModule,
    DataTablesModule,
    FormsModule,
    MomentModule,
    PipeModule,
    BsDropdownModule,
    ModalModule
  ],
  exports: [
    IetmTableComponent
  ]
})
export class IetmTableModule { }
