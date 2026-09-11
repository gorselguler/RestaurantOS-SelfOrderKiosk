/**
 * Utility function to export filtered orders to CSV (Excel compatible)
 * with UTF-8 BOM encoding for correct special character rendering.
 *
 * @param {Array} orders - Array of order objects from Supabase
 * @param {string} currency - Currency code (e.g. 'PLN', 'TRY')
 * @param {string} filenamePrefix - Base prefix for the filename
 */
export function exportOrdersToCsv(orders = [], currency = 'PLN', filenamePrefix = 'Order_History') {
  if (!orders || orders.length === 0) {
    alert('Dışa aktarılacak sipariş bulunamadı.');
    return;
  }

  // 1. Define CSV Headers
  const headers = [
    'Siparis_No',
    'Tarih_Saat',
    'Durum',
    'Kaynak',
    'Odeme_Yontemi',
    'Urun_Adedi',
    'Urunler_Ozeti',
    'Toplam_Tutar',
    'Para_Birimi',
    'Musteri_Notu'
  ];

  // 2. Format Each Row
  const rows = orders.map((order) => {
    // Parse order items safely
    let itemsList = [];
    try {
      if (typeof order.items === 'string') {
        itemsList = JSON.parse(order.items);
      } else if (Array.isArray(order.items)) {
        itemsList = order.items;
      }
    } catch {
      itemsList = [];
    }

    const itemsSummary = itemsList
      .map((item) => {
        const name =
          item.name ||
          item.product?.name?.tr ||
          item.product?.name?.en ||
          item.product?.name ||
          'Ürün';
        const qty = item.quantity || item.qty || 1;
        const price = item.unitPrice || item.price || 0;
        return `${qty}x ${name} (${Number(price).toFixed(2)})`;
      })
      .join('; ');

    const totalQty = itemsList.reduce((sum, item) => sum + (parseInt(item.quantity || item.qty || 1, 10)), 0);

    const formattedDate = order.created_at
      ? new Date(order.created_at).toLocaleString('tr-TR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      : '-';

    const statusLabel =
      order.status === 'COMPLETED'
        ? 'Tamamlandı'
        : order.status === 'CANCELLED'
        ? 'İptal Edildi'
        : order.status;

    const sourceLabel =
      order.source === 'kiosk'
        ? 'Tablet Kiosk'
        : order.source === 'cashier'
        ? 'Kasa POS'
        : order.source || '-';

    const paymentMethod = order.payment_method || 'KART';
    const totalAmount = parseFloat(order.total_amount || 0).toFixed(2);
    const notes = (order.customer_notes || '').replace(/[\r\n]+/g, ' ');

    // Escape CSV cell values to handle quotes, commas, and semicolons
    const escapeCsv = (val) => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };

    return [
      escapeCsv(order.order_number || order.daily_order_number || order.id?.slice(0, 8)),
      escapeCsv(formattedDate),
      escapeCsv(statusLabel),
      escapeCsv(sourceLabel),
      escapeCsv(paymentMethod),
      escapeCsv(totalQty),
      escapeCsv(itemsSummary),
      escapeCsv(totalAmount),
      escapeCsv(currency),
      escapeCsv(notes)
    ].join(';');
  });

  // 3. Assemble CSV with UTF-8 BOM (\uFEFF)
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');

  // 4. Create Blob & Trigger Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const todayStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${todayStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
