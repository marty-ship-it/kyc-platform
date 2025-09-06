import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

interface AustracPackData {
  dealId: string
  dealAddress: string
  dealPrice: number
  reportType: 'TTR' | 'SMR' | 'ANNUAL'
  generatedAt: string
  parties: Array<{
    name: string
    role: string
    riskScore?: string
  }>
  transactions: Array<{
    amount: number
    date: string
    counterparty: string
  }>
  complianceOfficer: string
}

export class PdfClient {
  static async generateAustracPack(data: AustracPackData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    const page = pdfDoc.addPage([595, 842]) // A4 size
    const { width, height } = page.getSize()
    
    let yPosition = height - 50
    
    // Title
    page.drawText('AUSTRAC Compliance Package', {
      x: 50,
      y: yPosition,
      size: 20,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
    
    yPosition -= 40
    
    // Deal Information
    page.drawText('Property Transaction Details', {
      x: 50,
      y: yPosition,
      size: 16,
      font: boldFont,
    })
    
    yPosition -= 25
    
    const dealInfo = [
      `Address: ${data.dealAddress}`,
      `Purchase Price: $${data.dealPrice.toLocaleString('en-AU')}`,
      `Report Type: ${data.reportType}`,
      `Generated: ${new Date(data.generatedAt).toLocaleDateString('en-AU')}`,
    ]
    
    dealInfo.forEach(info => {
      page.drawText(info, {
        x: 50,
        y: yPosition,
        size: 12,
        font,
      })
      yPosition -= 20
    })
    
    yPosition -= 20
    
    // Parties Section
    page.drawText('Transaction Parties', {
      x: 50,
      y: yPosition,
      size: 16,
      font: boldFont,
    })
    
    yPosition -= 25
    
    data.parties.forEach(party => {
      page.drawText(`${party.role}: ${party.name}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font,
      })
      if (party.riskScore) {
        page.drawText(`Risk Score: ${party.riskScore}`, {
          x: 300,
          y: yPosition,
          size: 12,
          font,
          color: party.riskScore === 'HIGH' ? rgb(1, 0, 0) : 
                 party.riskScore === 'MEDIUM' ? rgb(1, 0.5, 0) : 
                 rgb(0, 0.8, 0)
        })
      }
      yPosition -= 20
    })
    
    yPosition -= 20
    
    // Transactions Section
    page.drawText('Relevant Transactions', {
      x: 50,
      y: yPosition,
      size: 16,
      font: boldFont,
    })
    
    yPosition -= 25
    
    data.transactions.forEach(transaction => {
      page.drawText(`$${transaction.amount.toLocaleString('en-AU')} - ${transaction.counterparty} (${new Date(transaction.date).toLocaleDateString('en-AU')})`, {
        x: 50,
        y: yPosition,
        size: 12,
        font,
      })
      yPosition -= 20
    })
    
    yPosition -= 40
    
    // Footer
    page.drawText(`Prepared by: ${data.complianceOfficer}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
    })
    
    page.drawText('This report contains confidential information for AUSTRAC compliance purposes only.', {
      x: 50,
      y: 50,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5),
    })
    
    return Buffer.from(await pdfDoc.save())
  }
}