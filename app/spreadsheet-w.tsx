import { SpreadSheet } from "./spreadsheet";
import {Suspense} from 'react'

export type RowData = {
    name: string
    price: string
    quantity: string
}

export type RowsData = {
    checkNumber: string
    jobTitle: string,
    currentWorker: string
    currentOrg: string
    rows: RowData[]
}

export const SpreadSheetW = () => {
  return <Suspense fallback={<h1 className="flex justify-center p-20">Загрузка приложения...</h1>}>
    <SpreadSheet />
  </Suspense>
}
