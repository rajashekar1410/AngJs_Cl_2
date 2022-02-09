import { ISContentTypes } from "../../intelligent-search/models/intelligent-search";
import { InventoryReportTypes } from "../../inventory/models/inventory-tracking";

export interface IPrintData {
  type: PrintDataTypes,
  data: IPrintDataTableItem | string,
  title?: string
}

export interface IPrintDataSSR {
  contentType: ISContentTypes,
  fromDate: Date | string,
  toDate: Date | string,
  user_name: string,
  employee_id: string | number,
  title?: string,
  reportType: InventoryReportTypes
}

export interface IPrintDataTableItem {
  thead: string,
  tbody: string
}

export enum PrintDataTypes {
  TYPE_TABLE = 1,
  TYPE_PAGE = 2
}