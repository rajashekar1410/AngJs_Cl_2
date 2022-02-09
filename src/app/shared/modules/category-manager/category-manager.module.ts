import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryListingComponent } from './components/category-listing/category-listing.component';
import { IetmTableModule } from '../ietm-table/ietm-table.module';
import { CategoryUpdComponent } from './components/category-upd/category-upd.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    CategoryListingComponent,
    CategoryUpdComponent
  ],
  imports: [
    CommonModule,
    IetmTableModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class CategoryManagerModule { }
