import {useRef, useState} from "react";
import { RowsData } from "./spreadsheet";
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

const organizations: Organization[] = [{
    name: 'Рога и копыта',
    id: 'roga',
    address: 'Скотобойня №5',
    inn: '1231231',
    phone: '8 (922) 934-34-34',
    workers: [{
        name: 'Скотобоец',
        id: 'skoto',
        jobTitle: 'Манагер'
    }, {
        name: 'Куроеб',
        id: 'kuroev',
        jobTitle: 'Поц'
    }]
},{
    name: 'Еврейчики',
    id: 'euro',
    address: 'Хайфа',
    inn: '123123123',
    phone: '8 (922) 934-34-34',
    workers: [{
        name: 'Иванов Антон Ярославич',
        id: 'ivan',
        jobTitle: 'Поц',
    }, {
        name: 'Голдберг Мойша Абрамович',
        id: 'goldberg',
        jobTitle: 'Поц',
    }]
}, {
    name: 'Братство кольца',
    id: 'koltso',
    address: 'Мордор, Пермь, ул. Семена Горлумова, 666',
    inn: '12312312312',
    phone: '8 (922) 934-34-34',
    workers: [{
        name: 'Агроном, сын Агропрома',
        id: 'agro',
        jobTitle: 'Поц',
    }, {
        name: 'Курва, Бобер Фродович',
        id: 'kurva',
        jobTitle: 'Поц',
    }]
}]



interface Props {
    initialCheckNumber: number
    publishNewRow: (data: RowsData) => void
    error: string | null
    isSaving: boolean
    isSaved: boolean
    setSaved: (isSaved: boolean) => void
    setError: (error: string | null) => void
}

export const Form = ({ initialCheckNumber, publishNewRow, error, isSaving, isSaved, setSaved, setError }: Props) => {
    const [ checkNumber, setCheckNumber] = useState<string>(dateFormat(new Date(), 'ddmmyy') + String(initialCheckNumber))
    const [ currentOrg, setCurrentOrg] = useState('roga')
    const [ currentWorker, setCurrentWorker] = useState('skoto')
    const [ useGuaranty, setUseGuaranty] = useState(true)
    const [ showPreview, setShowPreview] = useState(false)
    const pdfRef = useRef<HTMLIFrameElement>(null)

    const [goods, setGoods] = useState([{name: ' ', price: '0', quantity: '0' }])

    const workerName = organizations.find(o => o.id === currentOrg)?.workers.find(w => w.id === currentWorker)?.name || ' '
    const jobTitle = organizations.find(o => o.id === currentOrg)?.workers.find(w => w.id === currentWorker)?.jobTitle || ' '
    const isValidForm = goods.length > 0 && goods.every(item => item.name.length > 0 && Number(item.quantity) > 0)

    const print = () => {
        if (pdfRef.current) {
            pdfRef.current.contentWindow?.print()
        }
    }

    const saveRows = async () => {
        await publishNewRow({
            checkNumber,
            currentWorker,
            jobTitle,
            currentOrg,
            rows: goods.map(row => ({ ...row, price: row.price, quantity: row.quantity}))
        })
    }

    const resetState = () => {
        setGoods([{name: ' ', price: '0', quantity: '0' }])
        const checkNumberVal = checkNumber.match(/-\d*$/)
        if (checkNumberVal && checkNumberVal[0]) {
            console.log('checkNumber, checkNumber', checkNumberVal, String(Number(checkNumberVal[0]) - 1))
            setCheckNumber(dateFormat(new Date(), 'ddmmyy') + String(Number(checkNumberVal[0]) - 1))
        }
        setSaved(false)
        setError(null)
    }

    return <main className="p-12">
    <h1 className='text-xl font-bold mb-10'>Создать новый чек</h1>
      <div className="flex items-center mb-5">
        <div className="font-bold mr-5">Чек №</div>
        <div className="mr-5">
          <input disabled={isSaved} className="mt-1.5 w-full rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-3 pr-10" type='text' value={checkNumber} onChange={(e) => setCheckNumber(e.target.value)} />
        </div>
        {isSaved && <div>Чек был сохранен. <span onClick={resetState} className="border-b border-dotted border-b-[grey] cursor-pointer">Создать новый</span></div>}
      </div>
      <div className="flex items-start">
        <div className="mb-5">
            <div className="mr-10">
                <label htmlFor="title" className="block text-sm font-medium text-gray-900 text-bold">Название</label>
                <select id="title" name="title" className="mt-1.5 w-full rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-3 pr-10 mb-1" value={currentOrg} onChange={(e) => setCurrentOrg(e.target.value)} >
                {organizations.map(org => {
                    return <option key={org.id} value={org.id}>{org.name}</option>
                })}
            </select>
            </div>
            <div className="text-gray-400 text-xs">{organizations.find(org => org.id === currentOrg)?.address}</div>
            <div className="text-gray-400 text-xs">INN: {organizations.find(org => org.id === currentOrg)?.inn}</div>
        </div>

        <div className="flex items-center mb-5">
            <div className="mr-10">
                <label htmlFor="managerName" className="block text-sm font-medium text-gray-900 text-bold">ФИО</label>
                <select id="managerName" name="managerName" className="mt-1.5 w-full rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-3 pr-10 mb-1" value={currentWorker} onChange={(e) => setCurrentWorker(e.target.value)} >
                {organizations.map(org => {
                    if (org.id !== currentOrg) return null
                    return organizations.find(org => org.id === currentOrg)?.workers.map(worker => {
                        return <option key={worker.id} value={worker.id}>
                            {worker.name}
                    </option>
                    })
                })}
            </select>
            <div className="text-gray-400 text-xs">
                {jobTitle}
            </div>
            </div>
        </div>
      </div>


      <div className="flex items-center mb-10">
            <input id="default-checkbox" type="checkbox" checked={useGuaranty} onChange={() => setUseGuaranty(p => !p)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"/>
            <label htmlFor="default-checkbox" className="ms-2 text-sm font-medium">Добавить гарантию</label>
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
                        <input type="text" value={item.name} onChange={ e => setGoods(prev => prev.map((item, i) => {
                            if (i !== index) return item
                                const newNumber = e.target.value.charAt(0) === '0' ? e.target.value.slice(1) : e.target.value
                                return { ...item, name: newNumber }
                            }))}
                        className="mt-1.5 w-full rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-3 pr-10"
                        />
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                        <input type="number" min={0} value={item.quantity} onChange={ e => setGoods(prev => prev.map((item, i) => {
                            if (i !== index) return item
                                const newNumber = e.target.value.charAt(0) === '0' ? e.target.value.slice(1) : e.target.value
                                return { ...item, quantity: newNumber }
                            }))}
                        className="mt-1.5 w-full rounded-lg border border-gray-300 text-gray-700 sm:text-sm py-2 pl-3 pr-10"
                        />
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                    <input type="number" value={item.price} onChange={ e => setGoods(prev => {
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
        <div className="flex mb-5">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-5 disabled:bg-gray-600" onClick={saveRows} disabled={!isValidForm || isSaving}>{isSaving ? 'Сохранение...' : isSaved ? 'Сохранено' : 'Сохранить'}</button>
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-5" onClick={print}>Распечатать</button>
            <PDFDownloadLink 
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-5"
                document={<PDF organization={organizations.find(org => org.id === currentOrg) || organizations[0]} checkNumber={checkNumber} items={goods} useGuaranty={useGuaranty} jobTitle={jobTitle} workerName={workerName} />} fileName="order.pdf">
                {({ blob, url, loading, error }) => loading ? 'Загрузка' : 'Сохранить в PDF'}   
            </PDFDownloadLink>
        </div>
        <div className="flex items-center mb-10">
            <input id="default-checkbox" type="checkbox" checked={showPreview} onChange={() => setShowPreview(p => !p)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"/>
            <label htmlFor="default-checkbox" className="ms-2 text-sm font-medium">Предпросмотр</label>
        </div>
      </div>
      <div className={showPreview ? '' : 'hidden'}>
        <PDFViewer innerRef={pdfRef} style={{ width: '100%', height: '400px' }}>
            <PDF organization={organizations.find(org => org.id === currentOrg) || organizations[0]} checkNumber={checkNumber} items={goods} useGuaranty={useGuaranty} jobTitle={jobTitle} workerName={workerName}/>
        </PDFViewer>
      </div>
    </main>
}