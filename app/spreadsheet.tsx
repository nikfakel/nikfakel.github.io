'use client';

import { useEffect, useRef, useState } from "react";
import {GoogleSpreadsheet, GoogleSpreadsheetWorksheet} from "google-spreadsheet"
import { JWT } from "google-auth-library"
import dateFormat from "dateformat";
import { useSearchParams } from 'next/navigation'
import { Form } from "./form"

export type RowData = {
  name: string
  price: string
  quantity: string
  guarantee: number
}

export type RowsData = {
  checkNumber: string
  manager: string
  seller: string
  sellType: string
  rows: RowData[]
  paymentType: string
  clientName: string
  clientPhone: string
  clientSource: string
}

export type OrgData = {
  managers: string[]
  sellers: string[]
  inn: string
  address: string
  phone: string
  traffic: string[]
}

export const SpreadSheet = () => {
  const [checkNumber, setCheckNumber] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const sheetObj = useRef<GoogleSpreadsheet | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [globalError, setGlobalError] = useState('')
  const searchParams = useSearchParams()
  const departmentId = searchParams.get('departmentId')
  const [orgData, setOrgData] = useState<OrgData | null>(null)
  const [loadingStatus, setLoadingStatus] = useState('')

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_DEPARTMENTS_SPREADSHEET) {
      setGlobalError('Не указан адрес таблицы с департаментами')
      return
    }

    setLoadingStatus("Подключение к серверу")

    const newJWT = new JWT({
      email: process.env.NEXT_PUBLIC_CLIENT_EMAIL,
      key: process.env.NEXT_PUBLIC_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const getOrgData = async () => {
      try {
        setLoadingStatus("Загрузка основной информации...")
        if (!departmentId) {
          setGlobalError('Не указан департамент в URL')
          return;
        }
        const departmentsDoc = new GoogleSpreadsheet(process.env.NEXT_PUBLIC_DEPARTMENTS_SPREADSHEET || '', newJWT);
        await departmentsDoc.loadInfo()
        const departmentsSheet = departmentsDoc.sheetsByTitle['departments']
        const departmentsRows = await departmentsSheet.getRows();
        const departmentRow = departmentsRows.find(row => row.get('department') === departmentId)

        if (!departmentRow) {
          setGlobalError('Не найден текущий департамент в документе')
          return;
        }

        const sheetId = departmentRow.get('sheetId')

        const departmentInfoPage = departmentsDoc.sheetsByTitle[departmentId]
        const departmentInfoRows = await departmentInfoPage.getRows()
        const orgData = {
          managers: departmentInfoRows.map(row => row.get('managers')).filter(Boolean),
          sellers: departmentInfoRows.map(row => row.get('sellers')).filter(Boolean),
          inn: departmentInfoRows[0].get('inn'),
          address: departmentInfoRows[0].get('address'),
          phone: departmentInfoRows[0].get('phone'),
          traffic: departmentInfoRows.map(row => row.get('traffic')).filter(Boolean),
        }

        setOrgData(orgData)

        setLoadingStatus("Получение номера чека...")

        const ordersDoc = new GoogleSpreadsheet(sheetId, newJWT);
        await ordersDoc.loadInfo()
        sheetObj.current = ordersDoc

        const ordersSheet = ordersDoc.sheetsByTitle['default']
        const departmentRows = await ordersSheet.getRows();
        const lastRow = departmentRows[departmentRows.length - 1]

        if (lastRow) {
          const date = dateFormat(new Date(), 'ddmmyy')
          const checkValue = lastRow.get(ordersSheet.headerValues[0])

          if (!checkValue.match(/\d{6}-\d*/)) {
            setCheckNumber(dateFormat(new Date(), 'ddmmyy') + '-1')
          } else {
            const prevDate = checkValue.match(/\d{6}/)
            if (prevDate && prevDate[0] && prevDate[0] === date) {
              const checkNumber = checkValue.match(/-\d*$/)
              if (checkNumber && checkNumber[0]) {
                setCheckNumber(dateFormat(new Date(), 'ddmmyy') + String(checkNumber[0] - 1))
              }
            } else {
              setCheckNumber(dateFormat(new Date(), 'ddmmyy') + '-1')
            }
          }
        } else {
          setCheckNumber(dateFormat(new Date(), 'ddmmyy') + '-1')
        }
      } catch (e) {
        setGlobalError('Что-то пошло не так')
      } finally {
        setLoadingStatus('')
      }
    }

    getOrgData()
  }, [departmentId])

  const mergeCells = async (sheet: GoogleSpreadsheetWorksheet, start: number, end: number, arr:{ column: number, value: string }[]) => {
    const requests = arr.reduce((acc: any[], item) => {
      const cell = sheet.getCell(start, item.column)
      cell.value = item.value
      acc.push(cell._getUpdateRequest())
      acc.push({
        "mergeCells": {
          range: { startColumnIndex: item.column, endColumnIndex: item.column + 1, startRowIndex: start, endRowIndex: end, sheetId: sheet.sheetId },
          mergeType: 'MERGE_ALL'
        }
      })

      return acc;
    }, [])

    await sheet._spreadsheet._makeBatchUpdateRequest(requests)
  }

  const publishNewRow = async ({ checkNumber, manager, seller, sellType, rows, paymentType, clientName, clientPhone, clientSource }: RowsData) => {
    try {
      if (!sheetObj?.current) return

      setIsSaving(true)

      const sheet = sheetObj.current.sheetsByTitle['default']
      const currentSheetRows = await sheet.getRows()

      const sheetRows = rows.map(row => ({
        "Наименование": row.name,
        "Цена": row.price,
        "Количество": row.quantity,
        "Сумма": Number(row.price) * Number(row.quantity),
        "Гарантия": String(row.guarantee) + ' мес',
      }))

      await sheet.addRows(sheetRows)
      await sheet.loadCells()

      const start = currentSheetRows.length + 1
      const end = start + rows.length

      const sum = rows.reduce((acc, item) => acc + Number(item.price) * Number(item.quantity), 0)
      const date = dateFormat(new Date(), 'mm-dd-yy')
      const time = dateFormat(new Date(), 'hh:mm')

      await mergeCells(sheet, start, end,[
        { column: 0, value: checkNumber },
        { column: 1, value: manager },
        { column: 2, value: sellType },
        { column: 7, value: String(sum)},
        { column: 8, value: date },
        { column: 9, value: time },
        { column: 10, value: paymentType },
        { column: 12, value: clientName },
        { column: 13, value: clientPhone },
        { column: 14, value: clientSource },
        { column: 15, value: seller },
      ])

      setIsSaved(true)
    } catch(e) {
      setError('Не удалось сохранить новый чек')
      console.log(e);
    } finally {
      setIsSaving(false)
    }
  }

  if (globalError) return <h1 className="flex justify-center p-20">{globalError}</h1>
  if (loadingStatus) return <h1 className="flex justify-center p-20">{loadingStatus}</h1>
  return checkNumber && orgData ? <Form initialCheckNumber={checkNumber} orgData={orgData} publishNewRow={publishNewRow} error={error} isSaving={isSaving} isSaved={isSaved} setSaved={setIsSaved} setError={setError} /> : null
}
