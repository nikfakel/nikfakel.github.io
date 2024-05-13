import {useRef, useState} from "react";
import {OrgData, RowsData} from "./spreadsheet";
import { PDF } from "./pdf/pdf";
import { XMarkIcon } from '@heroicons/react/24/solid'
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import dateFormat from 'dateformat';

export type PDFData = {
  manager: string,
  clientName: string
  clientPhone: string
  disableImage: boolean
  useGuarantee: boolean
  guaranteeTime: number
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

const guaranteeTime = [0, 1, 3, 6, 12, 24, 36]
const paymentTypes = ["Наличные", "Перевод на карту", "Терминал", "Кредит", "QR-код СБП", "QR-код терминал"]

export const Form = ({ initialCheckNumber, orgData, publishNewRow, error, isSaving, isSaved, setSaved, setError }: Props) => {
  const [ checkNumber, setCheckNumber] = useState<string>(initialCheckNumber)
  const [ prevCheckNumber, setPrevCheckNumber] = useState<string>('')
  const [ currentManager, setCurrentManager] = useState(orgData.managers[0])
  const [ currentSeller, setCurrentSeller] = useState(orgData.sellers[0])
  const [ secondSeller, setSecondSeller] = useState(orgData.sellers[0])
  const [ useGuarantee, setUseGuarantee] = useState(true)
  const [ showPreview, setShowPreview] = useState(false)
  const pdfRef = useRef<HTMLIFrameElement>(null)
  const [goods, setGoods] = useState([
    {name: ' ', price: '0', quantity: '0', guarantee: 6, isGuarantee: false },
  ])

  const [isSell, setIsSell] = useState(true)
  const [isIssuance, setIsIssuance] = useState(false)
  const [isPrepayment, setIsPrepayment] = useState(false)

  const [isPairSell, setIsPairSell] = useState(false)

  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientSource, setClientSource] = useState<string>('')

  const [disableImage, setDisableImage] = useState(false)

  const [payments, setPayments] = useState<{ type: string, sum: number }[]>([])
  const [isPaidBefore, setIsPaidBefore] = useState(false)

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

  const handlePaymentType = (value: string) => {
    if (!value) return

    setPayments(p => [...p, { type: value, sum: 0 }])
  }

  const handleRemovePayment = (index: number) => {
    setPayments(p => p.filter((item, i) => index !== i));
  }

  const resetState = () => {
    setGoods([{name: ' ', price: '0', quantity: '0', guarantee: 0, isGuarantee: false }])
    setPayments([])

    setSell()
    setClientName('')
    setClientPhone('')
    setClientSource('')
    setIsPaidBefore(false)
    setIsPairSell(false)
    setUseGuarantee(true)

    const checkNumberVal = checkNumber.match(/-\d*$/)
    if (checkNumberVal && checkNumberVal[0]) {
      setCheckNumber(dateFormat(new Date(), 'ddmmyy') + String(Number(checkNumberVal[0]) - 1))
    }

    setSaved(false)
    setError(null)
  }

  const guaranteeResult = goods.reduce((acc, item) => item.isGuarantee ? item.guarantee : acc, 0)
  const paymentSum = payments.reduce((acc, item) => acc + item.sum, 0)
  const checkSum = goods.reduce((acc, item)=> acc + Number(item.quantity) * Number(item.price), 0)

  const saveRows = async () => {
    if (isSaving || isSaved) {
      return
    }

    const sellType = isSell ? 'Продажа' : isPrepayment ? 'Предоплата' : isIssuance ? `Выдача ${prevCheckNumber}` : ''
    const paymentType = payments.reduce((acc, item) => acc + item.sum + ' - ' + item.type + '\r\n', '')

    try {
      publishNewRow({
        checkNumber,
        manager: currentManager,
        seller: currentSeller,
        sellType,
        paymentType,
        clientName,
        clientPhone,
        clientSource,
        prevCheckNumber,
        isPairSell,
        secondSeller,
        rows: goods.map(row => ({...row, price: row.price, quantity: row.quantity}))
      })
    } catch (e) {
      console.log(e)
    }
  }

  const data: PDFData = {
    manager: currentManager,
    clientName,
    clientPhone,
    useGuarantee,
    disableImage,
    guaranteeTime: guaranteeResult
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
        <input
          disabled={true}
          className="mt-1.5 rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-3 pr-10"
          type='text'
          value={checkNumber}
        />
      </div>
      {isSaved && <div>Чек был сохранен. <span onClick={resetState} className="border-b border-dotted border-b-[grey] cursor-pointer">Создать новый</span></div>}
    </div>
    <div className="flex mb-5 items-center">
      <div className="mr-10 flex items-center">
        <input
          id="prodazha"
          type="checkbox"
          checked={isSell}
          disabled={isSaved || isSaving}
          onChange={setSell}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
        />
        <label htmlFor="prodazha" className="ms-2 text-sm font-medium">Продажа</label>
      </div>
      <div className="mr-10 flex items-center">
        <input
          id="predoplata"
          type="checkbox"
          checked={isPrepayment}
          disabled={isSaved || isSaving}
          onChange={setPrepayment}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
        />
        <label htmlFor="predoplata" className="ms-2 text-sm font-medium">Предоплата</label>
      </div>
      <div className="flex items-center">
        <input
          id="vidacha"
          type="checkbox"
          checked={isIssuance}
          disabled={isSaved || isSaving}
          onChange={setIssuance}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
        />
        <label htmlFor="vidacha" className="ms-2 text-sm font-medium mr-5">Выдача</label>
        {isIssuance && <input
          type="text"
          value={prevCheckNumber}
          disabled={isSaved || isSaving}
          className="mt-1.5 rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-3 pr-10"
          onChange={(e) => setPrevCheckNumber(e.currentTarget.value)}
        />}
      </div>
    </div>
    <div className="flex items-start">
      <div className="flex items-center mb-5">
        <div className="mr-10">
          <label htmlFor="managerName" className="block text-sm font-medium text-gray-900 text-bold">Менеджер</label>
          <select
            id="managerName"
            value={currentManager}
            disabled={isSaved || isSaving}
            name="managerName"
            className="mt-1.5 w-full rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-3 pr-10 mb-1"
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
            value={currentSeller}
            disabled={isSaved || isSaving}
            className="mt-1.5 w-full rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-3 pr-10 mb-1"
            onChange={(e) => setCurrentSeller(e.target.value)} >
            {orgData.sellers.map((seller) => <option key={seller} value={seller}>{seller}</option>)}
          </select>
        </div>
        <div className="mr-10 self-start">
          <label htmlFor="managerName" className="text-sm font-medium text-gray-900 text-bold flex items-center">
            Парная продажа
            <input
              id="pair-sell"
              type="checkbox"
              checked={isPairSell}
              disabled={isSaved || isSaving}
              onChange={() => setIsPairSell(p => !p)}
              className="ml-5 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
            />
          </label>
          {isPairSell && <select
            id="managerName"
            name="managerName"
            value={secondSeller}
            disabled={isSaved || isSaving}
            className="mt-1.5 w-full rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-3 pr-10 mb-1"
            onChange={(e) => setSecondSeller(e.target.value)} >
            {orgData.sellers.map((seller) => <option key={seller} value={seller}>{seller}</option>)}
          </select>}
        </div>
      </div>
    </div>

    <div className="flex items-center mb-10">
      <div className="flex items-center mr-10">
        <input id="guarantee" type="checkbox" checked={useGuarantee} disabled={isSaved || isSaving} onChange={() => setUseGuarantee(p => !p)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"/>
        <label htmlFor="guarantee" className="ms-2 text-sm font-medium">Добавить гарантию</label>
      </div>
      <div className="flex items-center">
        <input id="disable-image" type="checkbox" checked={disableImage} disabled={isSaved || isSaving} onChange={() => setDisableImage(p => !p)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"/>
        <label htmlFor="disable-image" className="ms-2 text-sm font-medium">Отключить фон</label>
      </div>
    </div>

    <div className="flex items-center mb-10">
      <div className="mr-10">Покупатель</div>
      <div className="mr-10">
        <input
          type="text"
          value={clientName}
          disabled={isSaved || isSaving}
          onChange={ e => setClientName(e.currentTarget.value)}
          placeholder="ФИО"
          className="mt-1.5 w-full rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-3 pr-10"
        />
      </div>
      <div className="mr-10">
        <input
          type="text"
          value={clientPhone}
          disabled={isSaved || isSaving}
          onChange={ e => setClientPhone(e.currentTarget.value)}
          placeholder="Телефон"
          className="mt-1.5 w-full rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-3 pr-10"
        />
      </div>
      <div className="mr-10">
        <select
          value={clientSource}
          disabled={isSaved || isSaving}
          onChange={ e => setClientSource(e.currentTarget.value)}
          className="mt-1.5 w-full rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-3 pr-10"
        >
          {orgData.traffic.map(source => <option key={source} value={source}>{source}</option>)}
        </select>
      </div>
    </div>

    <div className="flex items-start mb-10">
      <div className="mr-10 mt-2">Оплата</div>
      <div className="mr-10">
        <select
          disabled={isPaidBefore || isSaved || isSaving}
          className="w-48 mr-5 rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-1 pr-0 mb-5"
          onChange={ e => handlePaymentType(e.currentTarget.value)}
        >
          <option key="choose" value="">Выбрать</option>
          {paymentTypes
            .filter(item => !payments.find(payment => payment.type === item))
            .map(paymentType => <option key={paymentType} value={paymentType}>{paymentType}</option>)}
        </select>
        <div className="flex items-center mb-5">
          <input
            id="default-checkbox"
            type="checkbox"
            checked={isPaidBefore}
            disabled={isSaved || isSaving}
            onChange={() => setIsPaidBefore(p => !p)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="default-checkbox" className="ms-2 text-sm font-medium">Оплачен ранее</label>
        </div>
      </div>
      {!isPaidBefore && <div className="mr-10">
        <div className="">
          {payments.map((payment, index) =>
            <div key={payment.type} className="flex justify-between items-center mb-2">
              <div className="mr-5">{payment.type}</div>
              <div className="ml-auto mr-5">
                <input
                  className="w-full rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-3 pr-2"
                  type="number"
                  min={0}
                  value={String(payment.sum).charAt(0) === '0' ? String(payment.sum).slice(1) : payment.sum}
                  onChange={e => setPayments(p => p.map((item, i) => {
                    if (i !== index) return item
                    return { ...item, sum: Number(e.target.value) }
                  }))}
                />
              </div>
              <div className="flex items-center cursor-pointer" onClick={() => handleRemovePayment(index)}><XMarkIcon className={`w-4 h-4 text-red-700 inline`} /> Удалить</div>
            </div>
          )}
        </div>
      </div>}
      {!isPaidBefore && <div className="ml-10 mt-2 flex items-center">
        <div className="font-bold">
          Сумма: {paymentSum}
        </div>
        <div className={`ml-10 text-sm ${paymentSum === checkSum ? 'text-green-300' : 'text-red-300'}`}>
          (сумма в чеке: {checkSum})
        </div>
      </div>}
    </div>

    <div className="">
      <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm mb-5">
        <thead className="ltr:text-left rtl:text-right text-center">
          <tr>
            <th className="whitespace-nowrap py-2 font-medium text-gray-900 text-left">Наименование товара</th>
            <th className="whitespace-nowrap px-2 py-2 font-medium text-gray-900">Кол-во (единиц)</th>
            <th className="whitespace-nowrap px-2 py-2 font-medium text-gray-900">Цена за единицу</th>
            <th className="whitespace-nowrap px-2 py-2 font-medium text-gray-900">Сумма</th>
            <th className="whitespace-nowrap px-2 py-2 font-medium text-gray-900">Гарантия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {goods.map((item, index) => {
            return <tr key={index}>
              <td className="whitespace-nowrap py-2 font-medium text-gray-900">
                <input
                  type="text"
                  value={item.name}
                  disabled={isSaved || isSaving}
                  onChange={ e => setGoods(prev => prev.map((item, i) => {
                    if (i !== index) return item
                    const newNumber = e.target.value.charAt(0) === '0' ? e.target.value.slice(1) : e.target.value
                    return { ...item, name: newNumber }
                  }))}
                  className="mt-1.5 w-full rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-3 pr-10"
                />
              </td>
              <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-center">
                <input
                  type="number"
                  min={0}
                  value={item.quantity}
                  disabled={isSaved || isSaving}
                  onChange={ e => setGoods(prev => prev.map((item, i) => {
                    if (i !== index) return item
                    const newNumber = e.target.value.charAt(0) === '0' ? e.target.value.slice(1) : e.target.value
                    return { ...item, quantity: newNumber }
                  }))}
                  className="mt-1.5 rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-3 pr-2"
                />
              </td>
              <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-center">
                <input
                  type="number"
                  value={item.price}
                  disabled={isSaved || isSaving}
                  onChange={ e => setGoods(prev => {
                    return prev.map((item, i) => {
                      if (i !== index) return item
                      const newNumber = e.target.value.charAt(0) === '0' ? e.target.value.slice(1) : e.target.value
                      return { ...item, price: newNumber }
                    })
                  })}
                  className="mt-1.5 rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-3 pr-2"
                />
              </td>
              <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-center">
                {Number(goods[index].price) * Number(goods[index].quantity)}
              </td>
              <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-center">
                <div className="flex items-center">
                  <select
                    className="w-20 mr-5 rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-1 pr-0"
                    value={item.guarantee}
                    disabled={isSaved || isSaving}
                    onChange={ e => setGoods(prev => {
                      return prev.map((item, i) => {
                        if (i !== index) return item
                        return { ...item, guarantee: Number(e.target.value) }
                      })
                    })}
                  >
                    {guaranteeTime.map(time => <option key={time} value={time}>{time} мес.</option>)}
                  </select>
                  <input
                    type="checkbox"
                    checked={item.isGuarantee}
                    disabled={isSaved || isSaving}
                    onChange={() => {setGoods(prev => prev.map((item, i) => ({ ...item, isGuarantee: index === i } )))}}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </td>
              <td>
                <div className="whitespace-nowrap cursor-pointer" onClick={() => {
                  if (isSaving || isSaving) return
                  setGoods(prev => prev.filter((_, i) => index !== i)) }
                }>
                  <span className={`${goods.length > 1 ? '' : 'invisible'}`}><XMarkIcon className={`w-4 h-4 text-red-700 inline`} /> Удалить строку</span>
                </div>
              </td>
            </tr>
          })}
        </tbody>
      </table>
      <div className="flex justify-between mb-5 items-center">
        <div className="font-bold">Сумма: {checkSum}</div>
        <button
          disabled={isSaved || isSaving}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => { setGoods(prev => [...prev, { name: ' ', price: '0', quantity: '0', guarantee: 6, isGuarantee: false }])}} >
          Добавить строку
        </button>
      </div>
      {error && <div className="text-red-500">{error}</div>}
      <div className="flex mb-5 items-center">
        <button
          disabled={isSaving}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-5"
          onClick={print}>Распечатать</button>
        <PDFDownloadLink
          onClick={(e) => {
            if (isSaving) {
              e.preventDefault()
            }

            if (!isSaved && !isSaving) {
              saveRows()
            }
          }}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-5"
          document={ <PDF orgData={orgData} checkNumber={checkNumber} items={goods} data={data} />}
          fileName="order.pdf">
          {({ blob, url, loading, error }) => 'Сохранить в PDF'}
        </PDFDownloadLink>
        {isSaving && <div className="text-green-700 mr-5">{isSaving && 'Сохранение документа...'}</div>}
        {isSaved && <div className="text-green-700">{isSaved && 'Документ сохранен'}</div>}
      </div>
      <div className="flex items-center mb-10">
        <input
          id="default-checkbox"
          type="checkbox"
          checked={showPreview}
          onChange={() => setShowPreview(p => !p)}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
        />
        <label htmlFor="default-checkbox" className="ms-2 text-sm font-medium">Предпросмотр</label>
      </div>
    </div>
    <div className={showPreview ? '' : 'hidden'}>
      <PDFViewer innerRef={pdfRef} style={{ width: '100%', height: '400px' }}>
        <PDF orgData={orgData} checkNumber={checkNumber} items={goods} data={data} />
      </PDFViewer>
    </div>
  </main>
}
