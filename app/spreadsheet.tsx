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
    jobTitle: string,
    currentWorker: string 
    currentOrg: string
    rows: RowData[]
}

export const SpreadSheet = () => {
    const [checkNumber, setCheckNumber] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isSaved, setIsSaved] = useState(false)
    const sheetObj = useRef<GoogleSpreadsheet | null>(null)
    const [error, setError] = useState<string | null>(null)
    const searchParams = useSearchParams()
    const spreadsheet = searchParams.get('spreadsheet')
    // '1B6dFoP6p6RjGED3LICf3CSSzPhs06KxC7EuD59dpLTY'

    useEffect(() => {
        const setSheetObj = async () => {
            try {
                if (!spreadsheet) {
                    throw new Error('Нужно указать адрес таблицы')
                }

                const newJWT = new JWT({
                    email: process.env.NEXT_PUBLIC_CLIENT_EMAIL,
                    key: process.env.NEXT_PUBLIC_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
                    
                });

                const doc = new GoogleSpreadsheet(spreadsheet, newJWT);
                await doc.loadInfo()
                sheetObj.current = doc

                const sheet = doc.sheetsByTitle['default']
                const rows = await sheet.getRows();
                const lastRow = rows[rows.length - 1]
                if (lastRow) {
                    const date = dateFormat(new Date(), 'ddmmyy')
                    const checkValue = lastRow.get(sheet.headerValues[0])

                    if (!checkValue.match(/\d{6}-\d*/)) {
                        setCheckNumber(dateFormat(new Date(), 'ddmmyy') + '-1')
                    } else {
                        const prevDate = checkValue.match(/\d{6}/)
                        console.log(prevDate[0], date)
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
            } catch (e) {
                console.log(e)
            }
        }
    
        setSheetObj()
    }, [])

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

    console.log(checkNumber)

    return checkNumber ? <Form initialCheckNumber={checkNumber} publishNewRow={publishNewRow} error={error} isSaving={isSaving} isSaved={isSaved} setSaved={setIsSaved} setError={setError} /> : null
}