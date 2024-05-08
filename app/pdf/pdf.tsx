'use client'

import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import {Organization, PDFData} from '../form';
import {OrgData, RowData} from '../spreadsheet';
import { numberToText } from './numberToText';

const styles = StyleSheet.create({
  page: {
    backgroundColor: 'white',
    fontFamily: 'Roboto',
    fontSize: '8px'
  },
  section: {
    margin: '0 10px',
    padding: '0 10px',
  },
  address: {
    display: 'flex',
    justifyContent: 'flex-end',
    textAlign: 'right',
    fontSize: '11px',
    padding: '0 36px',
    marginBottom: '15px'
  },
  title: {
    textAlign: 'center',
    fontSize: '12px',
    marginBottom: '10px',
    fontWeight: 'bold'
  },
  table: {
    margin: '0 10px',
    padding: '0 10px'
  }
});

interface Props {
  orgData: OrgData
  checkNumber: string
  items: RowData[]
  useGuaranty: boolean
  data: PDFData
}

export const PDF = ({ orgData, checkNumber, items, useGuaranty, data }: Props) => {
  const {inn, address, phone} = orgData
  const { manager, clientName, clientPhone } = data
  const date = new Date()
  const ruDate = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

  Font.register({ family: 'Roboto',  fonts: [
    { src: '/Roboto/Roboto-Regular.ttf', fontStyle: 'normal', fontWeight: 'normal', },
    { src: '/Roboto/Roboto-Bold.ttf', fontStyle: 'normal', fontWeight: 'bold', },
  ] });

  return <>
    <Document>
      <Page size="A4" style={styles.page}>
        <Image src="/header.png" cache={true} />
        <Text style={styles.address}>ИНН {inn} / {address} / Тел: {phone}</Text>
        <Text style={styles.title}>Товарный чек № {checkNumber} от {ruDate}</Text>
        <View style={styles.table}>{table(items, "менеджер", manager)}</View>
        {useGuaranty && <View style={styles.section}>{guaranty()}</View>}
        <View style={styles.section}>{clientSign(clientName, clientPhone)}</View>
      </Page>
    </Document>
  </>
}

const t = StyleSheet.create({
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  cell1: {
    flex: '0 0 30px',
    width: 'auto'
  },
  cell2: {
    flex: '1 1 auto'
  },
  cell3: {
    flex: '0 0 50px'
  },
  cell4: {
    flex: '0 0 50px'
  },
  cell5: {
    flex: '0 0 70px'
  },
  cell6: {
    flex: '0 0 70px'
  },
  headerCellContent: {
    border: '0.5px solid #666',
    textAlign: 'center',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    padding: '3px 5px'
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  cellContent: {
    border: '0.5px solid #666',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    padding: '3px 5px'
  },
  cellContent2: {
    border: '0.5px solid #666',
    textAlign: 'right',
    display: 'flex',
    alignItems: 'center',
    padding: '3px 5px'
  },
  sum: {
    display: 'flex',
    flexDirection: 'row'
  },
  sumTitle: {
    marginLeft: 'auto',
    flex: '1 1 100%'
  },
  sumTitleContent: {
    textAlign: 'right',
    display: 'flex',
    alignItems: 'center',
    padding: '3px 20px 3px 5px',
  },
  sumValue: {
    flex: '0 0 80px'
  },
  sumValueContent: {
    border: '0.5px solid #666',
    borderTop: 'none',
    textAlign: 'right',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    padding: '3px 5px',
  },
  summLetters: {
    fontWeight: 'bold',
  }
})

const table = (items: RowData[], jobTitle: string, workerName: string) => {
  const summ = items.reduce((acc, item) => acc + Number(item.quantity) * Number(item.price), 0)

  return <>
    <View style={t.header}>
      <View style={t.cell1}><Text style={t.headerCellContent}>№</Text></View>
      <View style={t.cell2}><Text style={t.headerCellContent}>Товар</Text></View>
      <View style={t.cell3}><Text style={t.headerCellContent}>Ед.</Text></View>
      <View style={t.cell4}><Text style={t.headerCellContent}>Кол-во</Text></View>
      <View style={t.cell5}><Text style={t.headerCellContent}>Цена</Text></View>
      <View style={t.cell6}><Text style={t.headerCellContent}>Сумма</Text></View>
    </View>
    {items.map((item, index) => {
      return <View style={t.row} key={item.name}>
        <View style={t.cell1}><Text style={t.cellContent}>{index + 1}</Text></View>
        <View style={t.cell2}><Text style={t.cellContent}>{item.name}</Text></View>
        <View style={t.cell3}><Text style={t.cellContent}>шт.</Text></View>
        <View style={t.cell4}><Text style={t.cellContent2}>{item.quantity}</Text></View>
        <View style={t.cell5}><Text style={t.cellContent2}>{item.price}</Text></View>
        <View style={t.cell6}><Text style={t.cellContent2}>{Number(item.price) * Number(item.quantity)}</Text></View>
      </View>
    })}

    <View style={t.sum}>
      <View style={t.sumTitle}>
        <Text style={t.sumTitleContent}>Итого:</Text>
      </View>
      <View style={t.sumValue}>
        <Text style={t.sumValueContent}>
          {summ}
        </Text>
      </View>
    </View>
    <View>
      <Text>Всего наименований {items.length}, на сумму {summ} рублей 00 копеек</Text>
      {!!summ && <Text style={t.summLetters}>{numberToText()(String(summ) + '.00')} ноль копеек</Text>}
    </View>
    {manager(jobTitle, workerName)}
  </>
}

const mStyles = StyleSheet.create({
  wrapper: {
    display: 'flex',
    flexDirection: 'row',
    paddingRight: '150px',
    paddingTop: '10px',
    marginBottom: '15px'
  },
  block0: {
    flex: '0 0 60px',
    marginRight: '5px',
  },
  block0Text: {
    padding: '3px 0 1px',
  },
  block1: {
    flex: '0 0 120px',
    marginRight: '12px',
  },
  block2: {
    flex: '0 0 150px',
    marginRight: '12px',
  },
  block3: {
    flex: '0 0 250px',
  },
  field: {
    borderBottom: '1px solid #666',
    padding: '3px 0 1px',
    textAlign: 'center',
  },
  underfield: {
    fontSize: '7px',
    textAlign: 'center',
  }
})

const manager = (jobTitle: string, workerName: string) => {
  return <>
    <View style={mStyles.wrapper}>
      <View style={mStyles.block0}>
        <Text style={mStyles.block0Text}>Отпустил </Text>
      </View>
      <View style={mStyles.block1}>
        <Text style={mStyles.field}>{' '}</Text>
        <Text style={mStyles.underfield}>(подпись)</Text>
      </View>
      <View style={mStyles.block2}>
        <Text style={mStyles.field}>Менеджер</Text>
        <Text style={mStyles.underfield}>(должность)</Text>
      </View>
      <View style={mStyles.block3}>
        <Text style={mStyles.field}>{workerName}</Text>
        <Text style={mStyles.underfield}>(Ф.И.О.)</Text>
      </View>
    </View>
  </>
}


const gstyles = StyleSheet.create({
  guaranty: {
    display: 'flex',
    flexDirection: 'column'
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '5px'
  },
  paragraph: {
    marginBottom: '5px'
  },
  paragraph1: {
    paddingTop: '10px',
    marginBottom: '10px',
  },
  points: {
    paddingLeft: '10px',
    marginBottom: '5px'
  },
  client: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginBottom: '20px'
  },
  recommendation: {
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: '12px'
  }
})

const guaranty = () => {
  return <View style={gstyles.guaranty}>
    <Text style={gstyles.title}>Условия гарантийного обслуживания</Text>
    <View>
      <Text style={gstyles.paragraph}>1. Срок гарантийного обслуживания системного блока составляет _______ месяцев.</Text>
      <Text style={gstyles.paragraph}>2. В соответствии с законом «О защите прав потребителей» покупателю предоставляется право на бесплатное гарантийное обслуживание в течение гарантийного срока.</Text>
      <Text style={gstyles.paragraph}>3. Покупателем товара является физическое лицо, приобретающее или использующее товары (работы, услуги) исключительно для личных (бытовых) нужд, не связанных с коммерческой деятельностью. Во всех остальных случаях приобретения товара не физическим лицом, гарантийные обязательства рассматриваются в соответствии с договоренностью между сторонами.</Text>
      <Text style={gstyles.paragraph}>4. Системные блоки, компьютеры стационарные и портативные, включая ноутбуки, и персональные электронные вычислительные машины относятся к категории технически сложных товаров. Технически сложные товары надлежащего качества (без недостатков) не подлежат обмену или возврату в течение 14 дней со дня покупки, т.к. относятся к группе технически сложных товаров бытового назначения, на которые установлены гарантийные сроки (согласно Постановлению Правительства РФ №55 от 19.01.1998 г.).</Text>
      <Text style={gstyles.paragraph}>5. Если в технически сложном товаре в течение гарантийного срока обнаружены недостатки:</Text>
      <Text style={gstyles.points}>• Если это произошло в течение пятнадцати дней с момента передачи товара покупателю, он имеет право предъявить требование о замене на товар этой же или другой марки (модели, артикула)</Text>
      <Text style={gstyles.points}>• Требование о замене подлежит удовлетворению в течение семи дней со дня его предъявления, а при необходимости дополнительной проверки качества - в течение двадцати дней.</Text>
      <Text style={gstyles.points}>• Если недостатки в товаре обнаружены по истечении пятнадцатидневного срока, то потребитель имеет право претендовать на гарантийный ремонт товара.</Text>
      <Text style={gstyles.points}>• Срок ремонта по гарантии не должен превышать 45 дней согласно статье 20 закона «О защите прав потребителей».  Если процесс затянулся, закон о защите прав потребителей о ремонте позволяет покупателю требовать выплату неустойки: 1% от стоимости товара за каждый просроченный день.</Text>
      <Text style={gstyles.paragraph}>6. Покупатель теряет право на бесплатное гарантийное обслуживание в следующих случаях: 1) Отсутствие или порча гарантийного талона, либо несоответствие сведений содержащихся в гарантийном талоне параметрам изделия (наименование, серийный̆ номер, дата или место продажи и т.п.) 2) Отсутствие на гарантийном талоне фирменной̆ печати или подписи. 3) Дефекты, возникшие в результате механического повреждения, из-за несоблюдения правил перевозки или ненадлежащей эксплуатации. 4) Обнаружение во время ремонтных работ нарушений правил и технических условий по использованию изделия. 5) Нарушение целостности пломб или защитных стикеров. 6) Обнаружение посторонних предметов внутри оборудования. 7) Повреждения в случае стихийных бедствий, других условий, попадающих под понятие форс-мажорных обстоятельств.</Text>
      <Text style={gstyles.paragraph}>7. Исправные товары обмену и возврату не подлежат.</Text>
      <Text style={gstyles.paragraph}>С примером гарантийного стикера или пломбы ознакомлен. Понимаю, что повреждение гарантийных пломб или стикеров может являться основанием для отказа в гарантийном обслуживании.</Text>
    </View>
  </View>
}

const clientSign = (clientName: string, clientPhone: string) => {
  return (<View>
    <Text style={gstyles.paragraph1}>Товар технически исправен, дефектов не имеет. Товар мной осмотрен, проверен и получен</Text>
    <View style={gstyles.client}>
      <Text>{clientName} /_______________________/</Text>
      <Text style={gstyles.paragraph}>&nbsp; &nbsp; &nbsp;ФИО &nbsp; &nbsp;	&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Подпись &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;</Text>
      <Text>Мобильный номер телефона: {clientPhone}</Text>
    </View>
    <Text style={gstyles.recommendation}>Рекомендуется проводить сервисное обслуживание 1 раз в 6 месяцев!</Text>
  </View>)
}
