'use client';

import { useEffect, useRef, useState } from "react";
import { GoogleSpreadsheet } from "google-spreadsheet"
import { JWT } from "google-auth-library"
import dateFormat from "dateformat";
import { useSearchParams } from 'next/navigation'
import { Form } from "./form"

export type RowData = {
  name: string
  price: string
  quantity: string
}

export type RowsData = {
  checkNumber: string
  manager: string
  seller: string
  sellType: string
  rows: RowData[]
  paymentType: string
  guarantee: string
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

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_DEPARTMENTS_SPREADSHEET) {
      setGlobalError('Не указан адрес таблицы с департаментами')
      return
    }

    const newJWT = new JWT({
      email: process.env.NEXT_PUBLIC_CLIENT_EMAIL,
      key: process.env.NEXT_PUBLIC_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const getOrgData = async () => {
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
      }
    }

    getOrgData()
  }, [departmentId])

  const publishNewRow = async ({ currentOrg, jobTitle, currentWorker, rows, checkNumber }: RowsData) => {
    try {
      setIsSaving(true)

      if (sheetObj && sheetObj.current) {
        const sheet = sheetObj.current.sheetsByTitle['default']
        const date = dateFormat(new Date(), 'mm-dd-yy')
        const time = dateFormat(new Date(), 'hh:mm')
        const sheetRows = rows.map(row => ({ "Номер чека": checkNumber, 'Продавец': currentWorker, "Должность": jobTitle, "Дата": date, "Время": time, "Наименование": row.name, "Цена": row.price, "Количество": row.quantity, "Сумма": Number(row.price) * Number(row.quantity), }))
        await sheet.addRows(sheetRows)
        setIsSaved(true)
      }
    } catch(e) {
      setError('Не удалось сохранить новый чек')
      console.log(e);
    } finally {
      setIsSaving(false)
    }
  }

  if (globalError) return <h1 className="flex justify-center p-20">{globalError}</h1>
  return checkNumber && orgData ? <Form initialCheckNumber={checkNumber} orgData={orgData} publishNewRow={publishNewRow} error={error} isSaving={isSaving} isSaved={isSaved} setSaved={setIsSaved} setError={setError} /> : null
}
