import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Generates a printable PDF report for Order History with executive summary and styled table.
 *
 * @param {Array} orders - Array of filtered order objects
 * @param {Object} options - Options containing restaurantName, currency, startDate, endDate
 */
export function generateOrderPdf(orders = [], { restaurantName = 'Restaurant OS', currency = 'PLN', startDate = '', endDate = '' } = {}) {
  if (!orders || orders.length === 0) {
    alert('PDF raporu oluşturulacak sipariş kaydı bulunamadı.')
    return
  }

  // 1. Initialize Portrait A4 Document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // 2. Metrics Calculation
  let completedRevenue = 0
  let completedCount = 0
  let cancelledCount = 0

  orders.forEach((o) => {
    const amt = parseFloat(o.total_amount || 0)
    if (o.status === 'COMPLETED') {
      completedRevenue += amt
      completedCount += 1
    } else if (o.status === 'CANCELLED') {
      cancelledCount += 1
    }
  })

  const aov = completedCount > 0 ? completedRevenue / completedCount : 0

  // ── Document Header ──
  // Brand color band at the top
  doc.setFillColor(194, 65, 12) // Terracotta #C2410C
  doc.rect(0, 0, pageWidth, 6, 'F')

  // Restaurant Name & Report Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(41, 37, 36) // Charcoal #292524
  doc.text(restaurantName.toUpperCase(), 14, 18)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(194, 65, 12)
  doc.text('SIPARIS GECMISI & SATIS RAPORU', 14, 25)

  // Report Date Meta
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(120, 113, 108)

  const dateRangeText = startDate === endDate ? `Tarih: ${startDate}` : `Tarih Araligi: ${startDate} - ${endDate}`
  doc.text(dateRangeText, 14, 31)

  const nowText = `Rapor Olusturulma: ${new Date().toLocaleString('tr-TR')}`
  doc.text(nowText, pageWidth - 14, 31, { align: 'right' })

  // Divider line
  doc.setDrawColor(231, 229, 228)
  doc.setLineWidth(0.5)
  doc.line(14, 34, pageWidth - 14, 34)

  // ── Summary KPI Box ──
  doc.setFillColor(250, 250, 249) // #FAFAF9
  doc.roundedRect(14, 38, pageWidth - 28, 22, 3, 3, 'F')
  doc.setDrawColor(231, 229, 228)
  doc.roundedRect(14, 38, pageWidth - 28, 22, 3, 3, 'D')

  // KPI Items
  const boxY = 46
  const colWidth = (pageWidth - 28) / 4

  // Col 1: Net Ciro
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(120, 113, 108)
  doc.text('TOPLAM NET CIRO', 18, boxY)
  doc.setFontSize(11)
  doc.setTextColor(194, 65, 12)
  doc.text(`${completedRevenue.toFixed(2)} ${currency}`, 18, boxY + 7)

  // Col 2: Tamamlanan
  doc.setFontSize(8)
  doc.setTextColor(120, 113, 108)
  doc.text('TESLIM EDILEN', 18 + colWidth, boxY)
  doc.setFontSize(11)
  doc.setTextColor(22, 163, 74)
  doc.text(`${completedCount} Siparis`, 18 + colWidth, boxY + 7)

  // Col 3: Iptal Edilen
  doc.setFontSize(8)
  doc.setTextColor(120, 113, 108)
  doc.text('IPTAL EDILEN', 18 + colWidth * 2, boxY)
  doc.setFontSize(11)
  doc.setTextColor(225, 29, 72)
  doc.text(`${cancelledCount} Siparis`, 18 + colWidth * 2, boxY + 7)

  // Col 4: Ortalama Sepet
  doc.setFontSize(8)
  doc.setTextColor(120, 113, 108)
  doc.text('ORTALAMA SEPET (AOV)', 18 + colWidth * 3, boxY)
  doc.setFontSize(11)
  doc.setTextColor(41, 37, 36)
  doc.text(`${aov.toFixed(2)} ${currency}`, 18 + colWidth * 3, boxY + 7)

  // ── Prepare Table Rows ──
  const tableData = orders.map((order) => {
    let itemsList = []
    try {
      if (typeof order.items === 'string') {
        itemsList = JSON.parse(order.items)
      } else if (Array.isArray(order.items)) {
        itemsList = order.items
      }
    } catch {
      itemsList = []
    }

    const itemsSummary = itemsList
      .map((it) => {
        const name = it.name || it.product?.name?.tr || it.product?.name || 'Urun'
        const qty = it.quantity || it.qty || 1
        return `${qty}x ${name}`
      })
      .join(', ')

    const formattedDate = order.created_at
      ? new Date(order.created_at).toLocaleString('tr-TR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '-'

    const statusText = order.status === 'COMPLETED' ? 'Teslim Edildi' : order.status === 'CANCELLED' ? 'Iptal Edildi' : order.status

    const sourceText = order.source === 'kiosk' ? 'Kiosk' : 'Kasa POS'
    const paymentText = (order.payment_method || 'KART').toUpperCase()
    const amountText = `${parseFloat(order.total_amount || 0).toFixed(2)} ${currency}`
    const orderNo = `#${order.order_number || order.daily_order_number || order.id?.slice(0, 6)}`

    return [
      orderNo,
      formattedDate,
      sourceText,
      paymentText,
      itemsSummary || '-',
      statusText,
      amountText
    ]
  })

  // ── Generate AutoTable ──
  autoTable(doc, {
    startY: 66,
    head: [['Siparis No', 'Tarih & Saat', 'Kaynak', 'Odeme', 'Urunler', 'Durum', 'Tutar']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [194, 65, 12], // Terracotta
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [41, 37, 36],
      cellPadding: 2.5
    },
    alternateRowStyles: {
      fillColor: [250, 250, 249]
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 20 },
      1: { cellWidth: 28 },
      2: { cellWidth: 18 },
      3: { cellWidth: 18 },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 24, fontStyle: 'bold' },
      6: { cellWidth: 24, halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      // Colorize Status column (column index 5)
      if (data.section === 'body' && data.column.index === 5) {
        if (data.cell.raw === 'Teslim Edildi') {
          data.cell.styles.textColor = [22, 163, 74] // Green
        } else if (data.cell.raw === 'Iptal Edildi') {
          data.cell.styles.textColor = [225, 29, 72] // Red
        }
      }
    },
    didDrawPage: (data) => {
      // Footer page numbering
      doc.setFontSize(8)
      doc.setTextColor(168, 162, 158)
      const pageStr = `Sayfa ${doc.internal.getNumberOfPages()}`
      doc.text(pageStr, pageWidth - 14, pageHeight - 8, { align: 'right' })
      doc.text('Restaurant OS - Otomasyon & Raporlama', 14, pageHeight - 8)
    }
  })

  // ── Bottom Summary Block after Table ──
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : pageHeight - 30

  // Check if we need a new page for the summary
  if (finalY + 20 < pageHeight) {
    doc.setFillColor(250, 250, 249)
    doc.roundedRect(pageWidth - 90, finalY, 76, 16, 2, 2, 'F')
    doc.setDrawColor(194, 65, 12)
    doc.setLineWidth(0.5)
    doc.roundedRect(pageWidth - 90, finalY, 76, 16, 2, 2, 'D')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(120, 113, 108)
    doc.text('GENEL TOPLAM (NET CIRO):', pageWidth - 86, finalY + 6)

    doc.setFontSize(11)
    doc.setTextColor(194, 65, 12)
    doc.text(`${completedRevenue.toFixed(2)} ${currency}`, pageWidth - 18, finalY + 12, { align: 'right' })
  }

  // ── Save Document ──
  const filename = startDate === endDate ? `Order_Report_${startDate}.pdf` : `Order_Report_${startDate}_${endDate}.pdf`
  doc.save(filename)
}
