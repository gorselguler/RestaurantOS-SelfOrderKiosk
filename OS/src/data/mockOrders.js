export const INITIAL_ORDERS = [
  {
    id: 'ORD-142',
    orderNumber: '142',
    table: 'Masa 4',
    orderType: 'Dine-In', // 'Dine-In' | 'Takeaway' | 'Delivery'
    status: 'pending_payment', // 'pending_payment' | 'preparing' | 'ready' | 'completed' | 'cancelled'
    paymentMethod: 'Kredi Kartı',
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 mins ago
    customerNote: 'Burger köftesi orta-iyi pişmiş olsun. Acı sos ayrı kapta rica ediyoruz.',
    items: [
      {
        id: 'item-1',
        name: 'Trüflü Smash Burger Menü',
        quantity: 2,
        price: 36.00,
        options: [
          { label: 'Ekmek', value: 'Brioche' },
          { label: 'Peynir', value: 'Cheddar x2 (+4 PLN)' },
          { label: 'Patates', value: 'Baharatlı Elma Dilim' },
          { label: 'İçecek', value: 'Zero Kola (330ml)' }
        ],
        itemTotal: 40.00
      },
      {
        id: 'item-2',
        name: 'Çıtır Mozzarella Sticks (6 Adet)',
        quantity: 1,
        price: 18.00,
        options: [
          { label: 'Sos', value: 'Tatlı Ekşi Sos' }
        ],
        itemTotal: 18.00
      },
      {
        id: 'item-3',
        name: 'Ev Yapımı Çilekli Limonata',
        quantity: 1,
        price: 14.00,
        options: [
          { label: 'Buz', value: 'Bol Buzlu' },
          { label: 'Nane', value: 'Taze Nane Yapraklı' }
        ],
        itemTotal: 14.00
      }
    ],
    subtotal: 72.00,
    serviceFee: 0.00,
    tax: 0.00,
    total: 72.00,
    currency: 'PLN'
  },
  {
    id: 'ORD-141',
    orderNumber: '141',
    table: 'Gel-Al (Takeaway)',
    orderType: 'Takeaway',
    status: 'pending_payment',
    paymentMethod: 'Nakit',
    createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(), // 6 mins ago
    customerNote: 'Lütfen bol peçete ve plastik çatal-bıçak ekleyin.',
    items: [
      {
        id: 'item-4',
        name: 'Napolitan Margherita Pizza (32cm)',
        quantity: 1,
        price: 34.00,
        options: [
          { label: 'Hamur', value: 'Klasik Taş Fırın' },
          { label: 'Ekstra', value: 'Manda Mozzarella (+6 PLN)' }
        ],
        itemTotal: 40.00
      },
      {
        id: 'item-5',
        name: 'San Pellegrino Gazlı Su',
        quantity: 1,
        price: 10.00,
        options: [],
        itemTotal: 10.00
      }
    ],
    subtotal: 50.00,
    serviceFee: 0.00,
    tax: 0.00,
    total: 50.00,
    currency: 'PLN'
  },
  {
    id: 'ORD-140',
    orderNumber: '140',
    table: 'Masa 9',
    orderType: 'Dine-In',
    status: 'preparing',
    paymentMethod: 'Kredi Kartı (Ödendi)',
    createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(), // 14 mins ago
    customerNote: 'Salatanın sosu ayrı gelsin.',
    items: [
      {
        id: 'item-6',
        name: 'Izgara Somon Bowl',
        quantity: 2,
        price: 42.00,
        options: [
          { label: 'Taban', value: 'Kinoa & Akdeniz Yeşillikleri' },
          { label: 'Sos', value: 'Susamlı Teriyaki' }
        ],
        itemTotal: 84.00
      },
      {
        id: 'item-7',
        name: 'Taze Sıkma Portakal Suyu',
        quantity: 2,
        price: 15.00,
        options: [],
        itemTotal: 30.00
      }
    ],
    subtotal: 114.00,
    serviceFee: 0.00,
    tax: 0.00,
    total: 114.00,
    currency: 'PLN'
  },
  {
    id: 'ORD-139',
    orderNumber: '139',
    table: 'Masa 2',
    orderType: 'Dine-In',
    status: 'ready',
    paymentMethod: 'Temassız / Apple Pay',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    customerNote: '',
    items: [
      {
        id: 'item-8',
        name: 'Klasik Cheeseburger',
        quantity: 1,
        price: 32.00,
        options: [
          { label: 'Pişme', value: 'İyi Pişmiş' },
          { label: 'İçecek', value: 'Ayran' }
        ],
        itemTotal: 32.00
      }
    ],
    subtotal: 32.00,
    serviceFee: 0.00,
    tax: 0.00,
    total: 32.00,
    currency: 'PLN'
  },
  {
    id: 'ORD-138',
    orderNumber: '138',
    table: 'Kurye #04',
    orderType: 'Delivery',
    status: 'completed',
    paymentMethod: 'Online Ödeme',
    createdAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    customerNote: 'Zil bozuk, kapıyı çalınız.',
    items: [
      {
        id: 'item-9',
        name: 'Fettuccine Alfredo',
        quantity: 1,
        price: 38.00,
        options: [
          { label: 'Tavuk', value: 'Ekstra Izgara Tavuk (+8 PLN)' }
        ],
        itemTotal: 46.00
      }
    ],
    subtotal: 46.00,
    serviceFee: 5.00,
    tax: 0.00,
    total: 51.00,
    currency: 'PLN'
  }
]

export const STATUS_CONFIG = {
  pending_payment: {
    label: 'Ödeme Bekliyor',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/60 ring-1 ring-amber-500/20',
    dotClass: 'bg-amber-500',
    icon: 'Clock'
  },
  preparing: {
    label: 'Mutfakta Hazırlanıyor',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/60 ring-1 ring-blue-500/20',
    dotClass: 'bg-blue-500 animate-pulse',
    icon: 'ChefHat'
  },
  ready: {
    label: 'Servise / Teslime Hazır',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 ring-1 ring-emerald-500/20',
    dotClass: 'bg-emerald-500',
    icon: 'CheckCircle2'
  },
  completed: {
    label: 'Tamamlandı',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    dotClass: 'bg-slate-400',
    icon: 'Check'
  },
  cancelled: {
    label: 'İptal Edildi',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/60',
    dotClass: 'bg-rose-500',
    icon: 'XCircle'
  }
}
