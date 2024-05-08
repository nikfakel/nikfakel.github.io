import {useRef, useState} from "react";
import {OrgData, RowData, RowsData} from "./spreadsheet";
import { PDF } from "./pdf/pdf";
import { XMarkIcon } from '@heroicons/react/24/solid'
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import dateFormat from 'dateformat';

export type Organization = {
  name: string
  id: string
  address: string
  inn: string
  phone: string
  workers: { name: string, id: string, jobTitle: string }[]
}

interface Props {
  initialCheckNumber: string
  orgData: OrgData
  publishNewRow: (data: RowsData) => void
  error: string | null
  isSaving: boolean
  isSaved: boolean
  setSaved: (isSaved: boolean) => void
  setError: (error: string | null) => void
}

export const Form = ({ initialCheckNumber, orgData, publishNewRow, error, isSaving, isSaved, setSaved, setError }: Props) => {
  const [ checkNumber, setCheckNumber] = useState<string>(initialCheckNumber)
  const [ prevCheckNumber, setPrevCheckNumber] = useState<string>(initialCheckNumber)
  const [ currentManager, setCurrentManager] = useState(orgData.managers[0])
  const [ currentSeller, setCurrentSeller] = useState(orgData.sellers[0])
  const [ useGuaranty, setUseGuaranty] = useState(true)
  const [ showPreview, setShowPreview] = useState(false)
  const pdfRef = useRef<HTMLIFrameElement>(null)
  const [goods, setGoods] = useState([{name: ' ', price: '0', quantity: '0' }])

  const [isSell, setIsSell] = useState(true)
  const [isIssuance, setIsIssuance] = useState(false)
  const [isPrepayment, setIsPrepayment] = useState(false)

  const [isPairSell, setIsPairSell] = useState(false)

  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientSource, setClientSource] = useState<string>('')

  const isValidForm = goods.length > 0 && goods.every(item => item.name.length > 0 && Number(item.quantity) > 0)

  const print = async () => {
    await saveRows()
    if (pdfRef.current) {
      pdfRef.current.contentWindow?.print()
    }
  }

  const setPrepayment = () => {
    setIsPrepayment(true)
    setIsSell(false)
    setIsIssuance(false)
  }

  const setIssuance = () => {
    setIsIssuance(true)
    setIsSell(false)
    setIsPrepayment(false)
  }

  const setSell = () => {
    setIsSell(true)
    setIsPrepayment(false)
    setIsIssuance(false)
  }

  const saveRows = async () => {
    const sellType = isSell ? 'Продажа' : isPrepayment ? 'Предоплата' : isIssuance ? `Выдача ${prevCheckNumber}` : ''
    const paymentType = ''
    const guarantyTyme = ''

    try {
      await publishNewRow({
        checkNumber,
        manager: currentManager,
        seller: currentSeller,
        sellType: sellType,
        paymentType: paymentType,
        guarantee: guarantyTyme,
        clientName,
        clientPhone,
        clientSource,
        rows: goods.map(row => ({...row, price: row.price, quantity: row.quantity}))
      })
    } catch (e) {
      console.log(e)
    }
  }

  const resetState = () => {
    setGoods([{name: ' ', price: '0', quantity: '0' }])
    const checkNumberVal = checkNumber.match(/-\d*$/)
    if (checkNumberVal && checkNumberVal[0]) {
      setCheckNumber(dateFormat(new Date(), 'ddmmyy') + String(Number(checkNumberVal[0]) - 1))
    }
    setSaved(false)
    setError(null)
  }

  return <main className="p-12">
    <div className="flex justify-between">
      <h1 className='text-xl font-bold mb-10'>Создать новый чек</h1>
      <div className="ml-auto">
        <div className="text-gray-400 text-xs">{orgData.address}</div>
        <div className="text-gray-400 text-xs">INN: {orgData.inn}</div>
        <div className="text-gray-400 text-xs">{orgData.phone}</div>
      </div>
    </div>
    <div className="flex items-center mb-5">
      <div className="font-bold mr-5">Чек №</div>
      <div className="mr-5">
        <input disabled={true} className="mt-1.5 rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-3 pr-10" type='text' value={checkNumber} onChange={(e) => setCheckNumber(e.target.value)} />
      </div>
      {isSaved && <div>Чек был сохранен. <span onClick={resetState} className="border-b border-dotted border-b-[grey] cursor-pointer">Создать новый</span></div>}
    </div>
    <div className="flex mb-5 items-center">
      <div className="mr-10 flex items-center">
        <input id="prodazha" type="checkbox" checked={isSell} onChange={setSell} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"/>
        <label htmlFor="prodazha" className="ms-2 text-sm font-medium">Продажа</label>
      </div>
      <div className="mr-10 flex items-center">
        <input id="predoplata" type="checkbox" checked={isPrepayment} onChange={setPrepayment} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"/>
        <label htmlFor="vidacha" className="ms-2 text-sm font-medium">Предоплата</label>
      </div>
      <div className="flex items-center">
        <input id="vidacha" type="checkbox" checked={isIssuance} onChange={setIssuance} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"/>
        <label htmlFor="predoplata" className="ms-2 text-sm font-medium mr-5">Выдача</label>
        {isIssuance && <input
          type="text"
          className="mt-1.5 rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-3 pr-10"
          value={prevCheckNumber} onChange={(e) => setPrevCheckNumber(e.currentTarget.value)}
        />}
      </div>
    </div>
    <div className="flex items-start">
      <div className="flex items-center mb-5">
        <div className="mr-10">
          <label htmlFor="managerName" className="block text-sm font-medium text-gray-900 text-bold">Менеджер</label>
          <select
            id="managerName"
            name="managerName"
            className="mt-1.5 w-full rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-3 pr-10 mb-1"
            value={currentManager}
            onChange={(e) => setCurrentManager(e.target.value)} >
            {orgData.managers.map((manager) => <option key={manager} value={manager}>{manager}</option>)}
          </select>
        </div>
      </div>
      <div className="flex items-center mb-5">
        <div className="mr-10">
          <label htmlFor="managerName" className="block text-sm font-medium text-gray-900 text-bold">Продавец</label>
          <select
            id="managerName"
            name="managerName"
            className="mt-1.5 w-full rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-3 pr-10 mb-1"
            value={currentSeller}
            onChange={(e) => setCurrentSeller(e.target.value)} >
            {orgData.sellers.map((seller) => <option key={seller} value={seller}>{seller}</option>)}
          </select>
        </div>
        <div className="mr-10 self-start">
          <label htmlFor="managerName" className="text-sm font-medium text-gray-900 text-bold flex items-center">Парная продажа <input id="pair-sell" type="checkbox" checked={isPairSell} onChange={() => setIsPairSell(p => !p)} className="ml-5 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"/></label>
          {isPairSell && <select
            id="managerName"
            name="managerName"
            className="mt-1.5 w-full rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-3 pr-10 mb-1"
            value={currentSeller}
            onChange={(e) => setCurrentSeller(e.target.value)} >
            {orgData.sellers.map((seller) => <option key={seller} value={seller}>{seller}</option>)}
          </select>}
        </div>
      </div>
    </div>


    <div className="flex items-center mb-10">
      <input id="default-checkbox" type="checkbox" checked={useGuaranty} onChange={() => setUseGuaranty(p => !p)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"/>
      <label htmlFor="default-checkbox" className="ms-2 text-sm font-medium">Добавить гарантию</label>
    </div>

    <div className="flex items-center mb-10">
      <div className="mr-10">Покупатель</div>
      <div className="mr-10">
        <input
          type="text"
          value={clientName}
          onChange={ e => setClientName(e.currentTarget.value)}
          placeholder="ФИО"
          className="mt-1.5 w-full rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-3 pr-10"
        />
      </div>
      <div className="mr-10">
        <input
          type="text"
          value={clientPhone}
          onChange={ e => setClientPhone(e.currentTarget.value)}
          placeholder="Телефон"
          className="mt-1.5 w-full rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-3 pr-10"
        />
      </div>
      <div className="mr-10">
        <select
          value={clientSource}
          onChange={ e => setClientSource(e.currentTarget.value)}
          className="mt-1.5 w-full rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-3 pr-10"
        >
          {orgData.traffic.map(source => <option key={source} value={source}>{source}</option>)}
        </select>
      </div>
    </div>


    <div className="">
      <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm mb-5">
        <thead className="ltr:text-left rtl:text-right text-center">
          <tr>
            <th className="whitespace-nowrap py-2 font-medium text-gray-900 text-left">Наименование товара</th>
            <th className="whitespace-nowrap px-2 py-2 font-medium text-gray-900">Кол-во (единиц)</th>
            <th className="whitespace-nowrap px-2 py-2 font-medium text-gray-900">Цена за единицу</th>
            <th className="whitespace-nowrap px-2 py-2 font-medium text-gray-900">Сумма</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {goods.map((item, index) => {
            return <tr key={index}>
              <td className="whitespace-nowrap py-2 font-medium text-gray-900">
                <input
                  type="text" value={item.name}
                  onChange={ e => setGoods(prev => prev.map((item, i) => {
                    if (i !== index) return item
                    const newNumber = e.target.value.charAt(0) === '0' ? e.target.value.slice(1) : e.target.value
                    return { ...item, name: newNumber }
                  }))}
                  className="mt-1.5 w-full rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-3 pr-10"
                />
              </td>
              <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                <input
                  type="number"
                  min={0}
                  value={item.quantity}
                  onChange={ e => setGoods(prev => prev.map((item, i) => {
                    if (i !== index) return item
                    const newNumber = e.target.value.charAt(0) === '0' ? e.target.value.slice(1) : e.target.value
                    return { ...item, quantity: newNumber }
                  }))}
                  className="mt-1.5 w-full rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-3 pr-10"
                />
              </td>
              <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                <input
                  type="number"
                  value={item.price}
                  onChange={ e => setGoods(prev => {
                    return prev.map((item, i) => {
                      if (i !== index) return item
                      const newNumber = e.target.value.charAt(0) === '0' ? e.target.value.slice(1) : e.target.value
                      return { ...item, price: newNumber }
                    })

                  })}
                  className="mt-1.5 w-full rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-3 pr-10"
                />
              </td>
              <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                {Number(goods[index].price) * Number(goods[index].quantity)}
              </td>
              <td>
                <div className="whitespace-nowrap cursor-pointer" onClick={() => setGoods(prev => prev.filter((_, i) => index !== i))}>
                  {index > 0 && <><XMarkIcon className="w-4 h-4 text-red-700 inline" /> Удалить строку</>}
                </div>
              </td>
            </tr>
          })}
        </tbody>
      </table>
      <div className="flex justify-between mb-5 items-center">
        <div className="font-bold">Сумма: {goods.reduce((acc, item)=> acc + Number(item.quantity) * Number(item.price), 0)}</div>
        <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded" onClick={() => { setGoods(prev => [...prev, { name: ' ', price: '0', quantity: '0' }])}} >Добавить строку</button>
      </div>
      {isSaved || isSaving && <div className="text-green-700 mb-5">{isSaving && 'Сохранение документа...'}{isSaved && 'Документ сохранен'}</div>}
      <div className="flex mb-5">
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-5" onClick={print}>Распечатать</button>
        <PDFDownloadLink
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-5"
          document={ <PDF orgData={orgData} checkNumber={checkNumber} items={goods} useGuaranty={useGuaranty} workerName={currentManager} />} fileName="order.pdf">
          {({ blob, url, loading, error }) => loading ? 'Загрузка' : 'Сохранить в PDF'}
        </PDFDownloadLink>
      </div>
      {error && <div className="text-red-500">{error}</div>}
      <div className="flex items-center mb-10">
        <input id="default-checkbox" type="checkbox" checked={showPreview} onChange={() => setShowPreview(p => !p)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"/>
        <label htmlFor="default-checkbox" className="ms-2 text-sm font-medium">Предпросмотр</label>
      </div>
    </div>
    <div className={showPreview ? '' : 'hidden'}>
      <PDFViewer innerRef={pdfRef} style={{ width: '100%', height: '400px' }}>
        <PDF orgData={orgData} checkNumber={checkNumber} items={goods} useGuaranty={useGuaranty} workerName={currentManager} />
      </PDFViewer>
    </div>
  </main>
}
