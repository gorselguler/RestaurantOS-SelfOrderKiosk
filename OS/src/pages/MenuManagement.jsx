import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { seedKebabTestMenu } from '../utils/seedKebabMenu'
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Utensils,
  Coffee,
  Sparkles,
  Layers,
  Image as ImageIcon,
  DollarSign,
  Clock,
  RefreshCw,
  FolderPlus,
  ChevronRight,
  Eye,
  EyeOff,
  ChefHat,
  AlertCircle,
  UploadCloud,
  X,
  Camera,
  Sliders,
  CheckSquare,
  CircleDot
} from 'lucide-react'

export function MenuManagement() {
  const { user } = useAuth()
  const restaurantId = user?.restaurant_id
  const currency = user?.currency || 'PLN'

  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCatId, setSelectedCatId] = useState('ALL')
  const [search, setSearch] = useState('')

  // Modals
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [editingCat, setEditingCat] = useState(null)
  const [saving, setSaving] = useState(false)

  // Local Image Upload States
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef(null)

  // Item Form State
  const [itemForm, setItemForm] = useState({
    name_tr: '',
    name_en: '',
    name_pl: '',
    description_tr: '',
    price: '',
    category_id: '',
    image_url: '',
    preparation_time_minutes: 5,
    is_available: true,
    is_featured: false,
    customizations: []
  })

  // Category Form State
  const [catForm, setCatForm] = useState({
    name_tr: '',
    name_en: '',
    name_pl: '',
    icon: 'Utensils',
    sort_order: 1
  })

  // 1. Fetch Categories & Menu Items
  const fetchMenuData = useCallback(async () => {
    if (!restaurantId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      const { data: catData, error: catErr } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order', { ascending: true })

      if (catErr) throw catErr

      const { data: itemData, error: itemErr } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })

      if (itemErr) throw itemErr

      setCategories(catData || [])
      setMenuItems(itemData || [])
    } catch (err) {
      console.error('Error fetching menu data:', err)
    } finally {
      setLoading(false)
    }
  }, [restaurantId])

  useEffect(() => {
    fetchMenuData()
  }, [fetchMenuData])

  // 2. Realtime listener on menu_items and categories
  useEffect(() => {
    if (!restaurantId) return

    const channel = supabase
      .channel('menu-management-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => fetchMenuData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        () => fetchMenuData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restaurantId, fetchMenuData])

  // Helper: Seed Kebab Test Menu (With JSONB Customizations)
  const handleSeedMenu = async () => {
    if (!restaurantId) {
      alert('Restaurant ID bulunamadı. Lütfen giriş yapınız.');
      return;
    }
    
    if (categories.length > 0 && !window.confirm('Mevcut menünüze ek olarak Kebap Test Menüsü (Sandviç, Dürüm, İskender, Patates, Ayran) eklenecektir. Devam edilsin mi?')) {
      return;
    }

    setSaving(true)
    try {
      const res = await seedKebabTestMenu(restaurantId);
      alert(`🎉 Kebap Test Menüsü başarıyla yüklendi!\n${res.categoriesCount} Kategori ve ${res.itemsCount} Ürün (JSONB Özelleştirmeleri ile) eklendi.`);
      await fetchMenuData();
    } catch (e) {
      console.error('Seed error:', e);
      alert('Test menüsü yüklenirken hata oluştu: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  // Stock Toggle
  const toggleStock = async (itemId, currentStatus) => {
    try {
      const nextStatus = !currentStatus
      setMenuItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, is_available: nextStatus } : it))
      )

      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', itemId)

      if (error) throw error
    } catch (err) {
      alert('Stok güncellenirken hata oluştu: ' + err.message)
      fetchMenuData()
    }
  }

  // Delete Item
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Bu ürünü menüden silmek istediğinize emin misiniz?')) return
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', itemId)
      if (error) throw error
      setMenuItems((prev) => prev.filter((it) => it.id !== itemId))
    } catch (err) {
      alert('Ürün silinemedi: ' + err.message)
    }
  }

  // Delete Category
  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return
    try {
      const { error } = await supabase.from('categories').delete().eq('id', catId)
      if (error) throw error
      setCategories((prev) => prev.filter((c) => c.id !== catId))
      if (selectedCatId === catId) setSelectedCatId('ALL')
    } catch (err) {
      alert('Kategori silinemedi: ' + err.message)
    }
  }

  // Handle Local File Selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Lütfen geçerli bir resim dosyası seçiniz (PNG, JPG, WEBP).')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Resim boyutu en fazla 10MB olabilir.')
      return
    }

    setImageFile(file)
    const localUrl = URL.createObjectURL(file)
    setImagePreview(localUrl)
  }

  // Upload Image File to Supabase Storage
  const uploadImageToStorage = async (file) => {
    if (!file || !restaurantId) return null
    setUploadingImage(true)

    try {
      const fileExt = file.name.split('.').pop() || 'jpg'
      const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)
      const filePath = `${restaurantId}/${Date.now()}_${cleanName}.${fileExt}`

      console.log('📤 Uploading image to Supabase Storage:', filePath)

      const { data, error: uploadErr } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadErr) {
        console.warn('Storage upload error, attempting base64 fallback:', uploadErr)
        // Base64 fallback if storage bucket has issue
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(file)
        })
      }

      const { data: publicUrlData } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath)

      return publicUrlData?.publicUrl || null
    } catch (err) {
      console.error('Image upload failed:', err)
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  // Open Item Modal
  const openItemModal = (item = null) => {
    setEditingItem(item)
    setImageFile(null)

    if (item) {
      const nameObj = typeof item.name === 'object' ? item.name : { tr: item.name }
      const descObj = typeof item.description === 'object' ? item.description : { tr: item.description }
      
      let parsedCustomizations = []
      if (Array.isArray(item.customizations)) {
        parsedCustomizations = item.customizations
      } else if (item.customizations && typeof item.customizations === 'object') {
        // Convert legacy object format if present
        const groups = []
        if (item.customizations.sauces?.length > 0) {
          groups.push({
            id: 'legacy_sauces',
            name: 'Sos Seçimi',
            type: 'multiple',
            required: false,
            maxSelections: 2,
            options: item.customizations.sauces.map((s, idx) => ({
              id: s.id || `s_${idx}`,
              name: typeof s === 'object' ? (s.name?.tr || s.name || s.id) : s,
              price: 0
            }))
          })
        }
        if (item.customizations.addons?.length > 0) {
          groups.push({
            id: 'legacy_addons',
            name: 'Ekstralar',
            type: 'multiple',
            required: false,
            maxSelections: 5,
            options: item.customizations.addons.map((a, idx) => ({
              id: a.id || `a_${idx}`,
              name: a.label || a.name || 'Ekstra',
              price: parseFloat(a.price || 0)
            }))
          })
        }
        if (item.customizations.removals?.length > 0) {
          groups.push({
            id: 'legacy_removals',
            name: 'Malzeme Çıkarma',
            type: 'multiple',
            required: false,
            maxSelections: 5,
            options: item.customizations.removals.map((r, idx) => ({
              id: `r_${idx}`,
              name: typeof r === 'string' ? r : (r.name || r.label),
              price: 0
            }))
          })
        }
        parsedCustomizations = groups
      }

      setImagePreview(item.image_url || null)
      setItemForm({
        name_tr: nameObj?.tr || '',
        name_en: nameObj?.en || '',
        name_pl: nameObj?.pl || '',
        description_tr: descObj?.tr || '',
        price: item.price || '',
        category_id: item.category_id || (categories[0]?.id || ''),
        image_url: item.image_url || '',
        preparation_time_minutes: item.preparation_time_minutes || 5,
        is_available: item.is_available ?? true,
        is_featured: item.is_featured ?? false,
        customizations: parsedCustomizations
      })
    } else {
      setImagePreview(null)
      setItemForm({
        name_tr: '',
        name_en: '',
        name_pl: '',
        description_tr: '',
        price: '',
        category_id: selectedCatId !== 'ALL' ? selectedCatId : (categories[0]?.id || ''),
        image_url: '',
        preparation_time_minutes: 5,
        is_available: true,
        is_featured: false,
        customizations: []
      })
    }
    setItemModalOpen(true)
  }

  // Save Item
  const handleSaveItem = async (e) => {
    e.preventDefault()
    if (!itemForm.name_tr || !itemForm.price || !itemForm.category_id) {
      alert('Lütfen ürün adı, fiyat ve kategori seçiniz.')
      return
    }

    if (!restaurantId) {
      alert('Hata: Oturum açmış bir restoran bulunamadı (restaurant_id eksik). Lütfen tekrar giriş yapınız.')
      return
    }

    // Safely parse price
    const rawPrice = String(itemForm.price).replace(',', '.')
    const parsedPrice = parseFloat(rawPrice)
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      alert('Lütfen geçerli bir fiyat giriniz (Örn: 25.50).')
      return
    }

    setSaving(true)
    try {
      let finalImageUrl = itemForm.image_url

      // If a new local file was selected, upload it now
      if (imageFile) {
        const uploadedUrl = await uploadImageToStorage(imageFile)
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl
        }
      }

      // Default placeholder if none provided
      if (!finalImageUrl) {
        finalImageUrl = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'
      }

      // Clean & normalize customizations array
      const safeCustomizations = (Array.isArray(itemForm.customizations) ? itemForm.customizations : [])
        .filter(g => g && typeof g === 'object' && (g.name || '').trim())
        .map((g, gIdx) => ({
          id: String(g.id || `g_${Date.now()}_${gIdx}`),
          name: String(g.name || '').trim(),
          type: g.type === 'single' ? 'single' : 'multiple',
          required: Boolean(g.required),
          maxSelections: parseInt(g.maxSelections, 10) || (g.type === 'single' ? 1 : 10),
          options: (Array.isArray(g.options) ? g.options : [])
            .filter(opt => opt && typeof opt === 'object' && (opt.name || '').trim())
            .map((opt, oIdx) => ({
              id: String(opt.id || `opt_${g.id || gIdx}_${oIdx}`),
              name: String(opt.name || '').trim(),
              price: parseFloat(String(opt.price || 0).replace(',', '.')) || 0
            }))
        }))

      const payload = {
        restaurant_id: restaurantId,
        category_id: itemForm.category_id,
        name: {
          tr: itemForm.name_tr.trim(),
          en: (itemForm.name_en || itemForm.name_tr).trim(),
          pl: (itemForm.name_pl || itemForm.name_tr).trim()
        },
        description: {
          tr: (itemForm.description_tr || '').trim()
        },
        price: parsedPrice,
        image_url: finalImageUrl,
        preparation_time_minutes: parseInt(itemForm.preparation_time_minutes, 10) || 5,
        is_available: itemForm.is_available ?? true,
        is_featured: itemForm.is_featured ?? false,
        customizations: safeCustomizations,
        updated_at: new Date().toISOString()
      }

      console.log('DEBUG - Submitting menu item payload to Supabase:', payload)

      if (editingItem) {
        const { data, error } = await supabase
          .from('menu_items')
          .update(payload)
          .eq('id', editingItem.id)
          .select()

        if (error) {
          console.error("SUPABASE UPDATE ERROR:", error)
          throw error
        }
      } else {
        const { data, error } = await supabase
          .from('menu_items')
          .insert(payload)
          .select()

        if (error) {
          console.error("SUPABASE INSERT ERROR:", error)
          throw error
        }
      }

      setItemModalOpen(false)
      fetchMenuData()
    } catch (err) {
      console.error("SUPABASE INSERT ERROR:", err)
      alert(`❌ Ürün kaydedilirken hata oluştu!\n\nHata: ${err.message || err.details || err.hint || JSON.stringify(err)}`)
    } finally {
      setSaving(false)
    }
  }

  // Open Category Modal
  const openCatModal = (cat = null) => {
    setEditingCat(cat)
    if (cat) {
      const nameObj = typeof cat.name === 'object' ? cat.name : { tr: cat.name }
      setCatForm({
        name_tr: nameObj?.tr || '',
        name_en: nameObj?.en || '',
        name_pl: nameObj?.pl || '',
        icon: cat.icon || 'Utensils',
        sort_order: cat.sort_order || 1
      })
    } else {
      setCatForm({
        name_tr: '',
        name_en: '',
        name_pl: '',
        icon: 'Utensils',
        sort_order: categories.length + 1
      })
    }
    setCatModalOpen(true)
  }

  // Save Category
  const handleSaveCat = async (e) => {
    e.preventDefault()
    if (!catForm.name_tr) {
      alert('Lütfen kategori adı giriniz.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        restaurant_id: restaurantId,
        name: {
          tr: catForm.name_tr,
          en: catForm.name_en || catForm.name_tr,
          pl: catForm.name_pl || catForm.name_tr
        },
        icon: catForm.icon,
        sort_order: parseInt(catForm.sort_order, 10) || 1
      }

      if (editingCat) {
        const { error } = await supabase.from('categories').update(payload).eq('id', editingCat.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('categories').insert(payload)
        if (error) throw error
      }

      setCatModalOpen(false)
      fetchMenuData()
    } catch (err) {
      alert('Kategori kaydedilirken hata: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Filter Items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (selectedCatId !== 'ALL' && item.category_id !== selectedCatId) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const trName = item.name?.tr?.toLowerCase() || ''
        const enName = item.name?.en?.toLowerCase() || ''
        const plName = item.name?.pl?.toLowerCase() || ''
        if (!trName.includes(q) && !enName.includes(q) && !plName.includes(q)) return false
      }
      return true
    })
  }, [menuItems, selectedCatId, search])

  const getCategoryName = (cat) => {
    if (!cat) return ''
    if (typeof cat.name === 'string') return cat.name
    return cat.name?.tr || cat.name?.en || Object.values(cat.name || {})[0] || 'Kategori'
  }

  const getItemName = (item) => {
    if (!item) return ''
    if (typeof item.name === 'string') return item.name
    return item.name?.tr || item.name?.en || Object.values(item.name || {})[0] || 'Ürün'
  }

  return (
    <div className="flex-1 h-full overflow-y-auto p-8 bg-[#FAFAF9] select-none">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black text-[#292524] tracking-tight">
              Menü & Ürün Yönetimi
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-[#C2410C]">
              Canlı Kiosk Senkronizasyonu
            </span>
          </div>
          <p className="text-sm text-stone-500 font-medium mt-1">
            Burada eklediğiniz veya güncellediğiniz tüm yemekler ve fotoğraflar anında Tablet Kiosk ekranına yansır.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSeedMenu}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="Kiosk için hazır özelleştirmeli test menüsünü yükle"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{saving ? 'Yükleniyor...' : 'Kebap Test Menüsünü Yükle'}</span>
          </button>

          <button
            onClick={() => openCatModal()}
            className="flex items-center gap-2 px-4 py-3 bg-white hover:bg-stone-50 border border-stone-200 text-[#292524] rounded-xl text-xs font-black shadow-xs cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-[#C2410C]" />
            <span>Kategori Ekle</span>
          </button>

          <button
            onClick={() => openItemModal()}
            className="flex items-center gap-2 px-5 py-3 bg-[#C2410C] hover:bg-orange-700 text-white rounded-xl text-xs font-black shadow-lg shadow-orange-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Yeni Ürün Ekle</span>
          </button>
        </div>
      </div>

      {/* Categories Horizontal Bar & Search */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Categories Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 custom-scrollbar">
          <button
            onClick={() => setSelectedCatId('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
              selectedCatId === 'ALL'
                ? 'bg-[#292524] text-white shadow-xs'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-600'
            }`}
          >
            Tüm Menü ({menuItems.length})
          </button>

          {categories.map((cat) => {
            const count = menuItems.filter((m) => m.category_id === cat.id).length
            return (
              <div key={cat.id} className="relative group flex items-center">
                <button
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                    selectedCatId === cat.id
                      ? 'bg-[#C2410C] text-white shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  <span>{getCategoryName(cat)}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>

                <button
                  onClick={() => openCatModal(cat)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-stone-700 transition-opacity ml-1"
                  title="Kategoriyi Düzenle"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            )
          })}
        </div>

        {/* Search */}
        <div className="w-full md:w-72 relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ürün adı ara..."
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-[#292524] placeholder-stone-400 outline-none focus:ring-2 focus:ring-[#C2410C]"
          />
        </div>
      </div>

      {/* Menu Items Grid */}
      {loading ? (
        <div className="py-20 text-center text-stone-400 flex flex-col items-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#C2410C] mb-2" />
          <span className="text-xs font-bold">Menü yükleniyor...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-stone-200 flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#C2410C] flex items-center justify-center mb-4">
            <Utensils className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-[#292524]">Bu Kategoride Henüz Ürün Yok</h3>
          <p className="text-xs text-stone-400 max-w-sm mt-1 mb-5">
            Kiosk tabletinizde görüntülenmek üzere ilk lezzetli ürününüzü hemen ekleyin.
          </p>
          <button
            onClick={() => openItemModal()}
            className="px-6 py-3 bg-[#C2410C] text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
          >
            + İlk Ürünü Ekle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const catObj = categories.find((c) => c.id === item.category_id)
            const catName = getCategoryName(catObj)
            const itemName = getItemName(item)

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Image banner */}
                  <div className="relative h-44 w-full bg-stone-100 overflow-hidden">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'}
                      alt={itemName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-white">
                        {catName}
                      </span>
                    </div>

                    {/* Stock Status Button on Image */}
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => toggleStock(item.id, item.is_available)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black backdrop-blur-md shadow-md transition-transform active:scale-95 cursor-pointer ${
                          item.is_available
                            ? 'bg-emerald-500 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        {item.is_available ? 'Stokta Var' : 'Tükendi'}
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5">
                    <h3 className="font-black text-lg text-[#292524] leading-tight mb-1">
                      {itemName}
                    </h3>
                    <p className="text-xs text-stone-400 font-medium line-clamp-2 leading-relaxed">
                      {item.description?.tr || item.description?.en || 'Açıklama belirtilmemiş.'}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-stone-400 font-semibold mt-3">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{item.preparation_time_minutes || 5} dk hazırlama</span>
                    </div>
                  </div>
                </div>

                {/* Footer Price & CRUD Actions */}
                <div className="p-5 pt-3 border-t border-stone-100 flex items-center justify-between bg-stone-50/50">
                  <span className="font-black text-[#292524] text-xl font-mono">
                    {parseFloat(item.price || 0).toFixed(2)} {currency}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openItemModal(item)}
                      className="p-2 rounded-xl text-stone-600 hover:text-[#C2410C] hover:bg-orange-50 border border-stone-200 transition-colors cursor-pointer"
                      title="Düzenle"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 border border-stone-200 transition-colors cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ITEM CREATE / EDIT MODAL WITH LOCAL PHOTO UPLOAD */}
      {/* ========================================================================= */}
      {itemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-[#292524]">
                {editingItem ? 'Ürünü Düzenle' : 'Yeni Menü Ürünü Ekle'}
              </h3>
              <button onClick={() => setItemModalOpen(false)} className="p-2 text-stone-400 hover:text-stone-700">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
              
              {/* LOCAL PHOTO UPLOADER (DRAG & DROP / FILE SELECTOR) */}
              <div>
                <label className="text-xs font-black text-[#292524] uppercase tracking-wider block mb-1.5">
                  Ürün Fotoğrafı (Cihazınızdan Yükleyin) *
                </label>

                {imagePreview ? (
                  <div className="relative w-full h-48 rounded-2xl overflow-hidden border-2 border-dashed border-[#C2410C] bg-stone-50 group">
                    <img
                      src={imagePreview}
                      alt="Önizleme"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-white text-[#292524] rounded-xl text-xs font-black shadow-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-[#C2410C]" />
                        <span>Fotoğrafı Değiştir</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null)
                          setImagePreview(null)
                          setItemForm({ ...itemForm, image_url: '' })
                        }}
                        className="p-2 bg-rose-600 text-white rounded-xl shadow-lg hover:bg-rose-700 cursor-pointer"
                        title="Fotoğrafı Kaldır"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 rounded-2xl border-2 border-dashed border-stone-300 hover:border-[#C2410C] bg-stone-50/70 hover:bg-orange-50/30 transition-all flex flex-col items-center justify-center p-6 text-center cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-stone-200 text-stone-400 group-hover:text-[#C2410C] group-hover:scale-110 transition-all flex items-center justify-center mb-2">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black text-[#292524]">
                      Fotoğraf seçmek için tıklayın veya sürükleyip bırakın
                    </span>
                    <span className="text-[11px] text-stone-400 font-medium mt-0.5">
                      PNG, JPG, WEBP (Maksimum 10MB)
                    </span>
                  </div>
                )}

                {/* Hidden Native File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Product Name (TR / EN / PL) */}
              <div className="space-y-2">
                <label className="text-xs font-black text-[#292524] uppercase tracking-wider block">
                  Ürün Adı (Türkçe / Zorunlu) *
                </label>
                <input
                  type="text"
                  required
                  value={itemForm.name_tr}
                  onChange={(e) => setItemForm({ ...itemForm, name_tr: e.target.value })}
                  placeholder="Örn: Trüflü Smash Burger"
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-sm font-bold text-[#292524] outline-none focus:ring-2 focus:ring-[#C2410C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-stone-500 block mb-1">İngilizce Ad (Opsiyonel)</label>
                  <input
                    type="text"
                    value={itemForm.name_en}
                    onChange={(e) => setItemForm({ ...itemForm, name_en: e.target.value })}
                    placeholder="Truffle Smash Burger"
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-500 block mb-1">Lehçe Ad (Opsiyonel)</label>
                  <input
                    type="text"
                    value={itemForm.name_pl}
                    onChange={(e) => setItemForm({ ...itemForm, name_pl: e.target.value })}
                    placeholder="Burger Truflowy"
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold outline-none"
                  />
                </div>
              </div>

              {/* Category & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-[#292524] uppercase tracking-wider block mb-1.5">
                    Kategori *
                  </label>
                  <select
                    required
                    value={itemForm.category_id}
                    onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-[#292524] outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {getCategoryName(c)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-[#292524] uppercase tracking-wider block mb-1.5">
                    Fiyat ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    placeholder="34.00"
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-sm font-black font-mono text-[#292524] outline-none focus:ring-2 focus:ring-[#C2410C]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-black text-[#292524] uppercase tracking-wider block mb-1.5">
                  Ürün Açıklaması / İçerik
                </label>
                <textarea
                  rows={2}
                  value={itemForm.description_tr}
                  onChange={(e) => setItemForm({ ...itemForm, description_tr: e.target.value })}
                  placeholder="150g marine edilmiş yaprak et, taze marul, domates..."
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-[#292524] outline-none"
                />
              </div>

              {/* Stock Toggle Checkbox */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="availCheck"
                  checked={itemForm.is_available}
                  onChange={(e) => setItemForm({ ...itemForm, is_available: e.target.checked })}
                  className="w-5 h-5 accent-[#C2410C] rounded"
                />
                <label htmlFor="availCheck" className="text-xs font-bold text-[#292524] cursor-pointer">
                  Bu ürün şu anda stokta var (Kiosk tabletinde siparişe açık)
                </label>
              </div>

              {/* ================================================================= */}
              {/* DYNAMIC CUSTOMIZATIONS / MODIFIERS BUILDER */}
              {/* ================================================================= */}
              <div className="pt-4 border-t border-stone-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#C2410C] flex items-center justify-center">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#292524] uppercase tracking-wider">
                        Ürün Özelleştirme & Ekstralar (Customizations)
                      </h4>
                      <p className="text-[11px] text-stone-500 font-medium">
                        Kiosk müşterilerinin seçebileceği soslar, ekstralar veya çıkarılacak malzemeler.
                      </p>
                    </div>
                  </div>

                  {/* Add Group Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const newGroup = {
                        id: `g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                        name: '',
                        type: 'multiple', // 'single' | 'multiple'
                        required: false,
                        maxSelections: 3,
                        options: [
                          { id: `opt_${Date.now()}_1`, name: '', price: 0 }
                        ]
                      }
                      setItemForm({
                        ...itemForm,
                        customizations: [...(itemForm.customizations || []), newGroup]
                      })
                    }}
                    className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Grup Ekle</span>
                  </button>
                </div>

                {/* Quick Presets Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                  <span className="text-[10px] font-bold text-stone-400 mr-1">Hızlı Şablon:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const sauceGroup = {
                        id: `g_sauce_${Date.now()}`,
                        name: 'Sos Seçimi',
                        type: 'multiple',
                        required: false,
                        maxSelections: 2,
                        options: [
                          { id: `opt_${Date.now()}_1`, name: 'Sarımsaklı Mayonez', price: 0 },
                          { id: `opt_${Date.now()}_2`, name: 'Acı Sos', price: 0 },
                          { id: `opt_${Date.now()}_3`, name: 'Ketçap', price: 0 },
                          { id: `opt_${Date.now()}_4`, name: 'Barbekü Sos', price: 1.5 }
                        ]
                      }
                      setItemForm({
                        ...itemForm,
                        customizations: [...(itemForm.customizations || []), sauceGroup]
                      })
                    }}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-orange-100 hover:text-[#C2410C] text-stone-600 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    + Soslar Şablonu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const extrasGroup = {
                        id: `g_extras_${Date.now()}`,
                        name: 'Ekstra Malzemeler',
                        type: 'multiple',
                        required: false,
                        maxSelections: 5,
                        options: [
                          { id: `opt_${Date.now()}_1`, name: 'Ekstra Kaşar / Peynir', price: 4.0 },
                          { id: `opt_${Date.now()}_2`, name: 'Ekstra Et (+50g)', price: 10.0 },
                          { id: `opt_${Date.now()}_3`, name: 'Jalapeno Biberi', price: 2.5 }
                        ]
                      }
                      setItemForm({
                        ...itemForm,
                        customizations: [...(itemForm.customizations || []), extrasGroup]
                      })
                    }}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-orange-100 hover:text-[#C2410C] text-stone-600 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    + Ekstralar Şablonu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const removalsGroup = {
                        id: `g_removals_${Date.now()}`,
                        name: 'Malzeme Çıkarma (İstemiyorum)',
                        type: 'multiple',
                        required: false,
                        maxSelections: 5,
                        options: [
                          { id: `opt_${Date.now()}_1`, name: 'Soğansız', price: 0 },
                          { id: `opt_${Date.now()}_2`, name: 'Domatessiz', price: 0 },
                          { id: `opt_${Date.now()}_3`, name: 'Turşusuz', price: 0 }
                        ]
                      }
                      setItemForm({
                        ...itemForm,
                        customizations: [...(itemForm.customizations || []), removalsGroup]
                      })
                    }}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-orange-100 hover:text-[#C2410C] text-stone-600 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    + Malzeme Çıkarma Şablonu
                  </button>
                </div>

                {/* Groups List */}
                {(!itemForm.customizations || itemForm.customizations.length === 0) ? (
                  <div className="p-4 rounded-2xl border-2 border-dashed border-stone-200 text-center bg-stone-50/50">
                    <p className="text-xs text-stone-400 font-medium">
                      Bu ürüne henüz özelleştirme grubu eklenmedi. Kiosk kullanıcılarına seçenek sunmak için yukarıdaki <b>"Grup Ekle"</b> veya şablon butonlarına tıklayabilirsiniz.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {itemForm.customizations.map((group, gIdx) => (
                      <div
                        key={group.id || gIdx}
                        className="p-4 rounded-2xl bg-stone-50 border border-stone-200/90 shadow-2xs space-y-3"
                      >
                        {/* Group Header Controls */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="text-[10px] font-bold text-stone-500 block mb-1">Grup Başlığı *</label>
                              <input
                                type="text"
                                required
                                value={group.name}
                                onChange={(e) => {
                                  const updated = [...itemForm.customizations]
                                  updated[gIdx] = { ...updated[gIdx], name: e.target.value }
                                  setItemForm({ ...itemForm, customizations: updated })
                                }}
                                placeholder="Örn: Sos Seçimi, Ekstra Malzemeler..."
                                className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs font-bold text-[#292524] outline-none focus:border-[#C2410C]"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <label className="text-[10px] font-bold text-stone-500 block mb-1">Seçim Türü</label>
                                <select
                                  value={group.type || 'multiple'}
                                  onChange={(e) => {
                                    const updated = [...itemForm.customizations]
                                    updated[gIdx] = { ...updated[gIdx], type: e.target.value }
                                    setItemForm({ ...itemForm, customizations: updated })
                                  }}
                                  className="w-full px-2.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-bold text-[#292524] outline-none"
                                >
                                  <option value="multiple">Çoklu Seçim (Checkbox)</option>
                                  <option value="single">Tekli Seçim (Radio)</option>
                                </select>
                              </div>

                              {group.type === 'multiple' ? (
                                <div className="w-20">
                                  <label className="text-[10px] font-bold text-stone-500 block mb-1">Maks. Adet</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={group.maxSelections || 3}
                                    onChange={(e) => {
                                      const updated = [...itemForm.customizations]
                                      updated[gIdx] = { ...updated[gIdx], maxSelections: parseInt(e.target.value, 10) || 1 }
                                      setItemForm({ ...itemForm, customizations: updated })
                                    }}
                                    className="w-full px-2.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-bold text-[#292524] outline-none text-center"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 pt-4">
                                  <input
                                    type="checkbox"
                                    id={`req_${group.id || gIdx}`}
                                    checked={group.required || false}
                                    onChange={(e) => {
                                      const updated = [...itemForm.customizations]
                                      updated[gIdx] = { ...updated[gIdx], required: e.target.checked }
                                      setItemForm({ ...itemForm, customizations: updated })
                                    }}
                                    className="w-4 h-4 accent-[#C2410C] rounded"
                                  />
                                  <label htmlFor={`req_${group.id || gIdx}`} className="text-[11px] font-bold text-stone-700 cursor-pointer">
                                    Zorunlu
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Delete Group Button */}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = itemForm.customizations.filter((_, idx) => idx !== gIdx)
                              setItemForm({ ...itemForm, customizations: updated })
                            }}
                            className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Grubu Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Options List */}
                        <div className="space-y-2 pt-1 border-t border-stone-200/60">
                          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                            Seçenekler ({group.options?.length || 0})
                          </label>

                          {(group.options || []).map((opt, oIdx) => (
                            <div key={opt.id || oIdx} className="flex items-center gap-2">
                              <input
                                type="text"
                                required
                                value={opt.name}
                                onChange={(e) => {
                                  const updated = [...itemForm.customizations]
                                  const opts = [...(updated[gIdx].options || [])]
                                  opts[oIdx] = { ...opts[oIdx], name: e.target.value }
                                  updated[gIdx] = { ...updated[gIdx], options: opts }
                                  setItemForm({ ...itemForm, customizations: updated })
                                }}
                                placeholder="Örn: Sarımsaklı Sos, Ekstra Kaşar, Soğansız..."
                                className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-xs font-semibold text-[#292524] outline-none focus:border-[#C2410C]"
                              />

                              <div className="flex items-center gap-1 w-28">
                                <span className="text-xs text-stone-400 font-bold">+</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={opt.price === 0 ? '0' : (opt.price || '')}
                                  onChange={(e) => {
                                    const updated = [...itemForm.customizations]
                                    const opts = [...(updated[gIdx].options || [])]
                                    opts[oIdx] = { ...opts[oIdx], price: parseFloat(e.target.value) || 0 }
                                    updated[gIdx] = { ...updated[gIdx], options: opts }
                                    setItemForm({ ...itemForm, customizations: updated })
                                  }}
                                  placeholder="0.00"
                                  className="w-full px-2 py-1.5 rounded-lg bg-white border border-stone-300 text-xs font-mono font-bold text-[#292524] outline-none text-right"
                                />
                                <span className="text-[10px] font-bold text-stone-500">{currency}</span>
                              </div>

                              <button
                                type="button"
                                disabled={group.options.length <= 1}
                                onClick={() => {
                                  const updated = [...itemForm.customizations]
                                  const opts = updated[gIdx].options.filter((_, idx) => idx !== oIdx)
                                  updated[gIdx] = { ...updated[gIdx], options: opts }
                                  setItemForm({ ...itemForm, customizations: updated })
                                }}
                                className="p-1.5 text-stone-300 hover:text-rose-600 disabled:opacity-30 rounded-lg cursor-pointer"
                                title="Seçeneği Sil"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}

                          {/* Add Option inside Group */}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...itemForm.customizations]
                              const opts = [...(updated[gIdx].options || [])]
                              opts.push({
                                id: `opt_${Date.now()}_${opts.length + 1}`,
                                name: '',
                                price: 0
                              })
                              updated[gIdx] = { ...updated[gIdx], options: opts }
                              setItemForm({ ...itemForm, customizations: updated })
                            }}
                            className="mt-1 px-3 py-1 rounded-lg bg-stone-200/80 hover:bg-stone-300 text-[#292524] text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Seçenek Ekle</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setItemModalOpen(false)}
                  className="px-5 py-3 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="px-6 py-3 rounded-xl bg-[#C2410C] hover:bg-orange-700 text-white text-xs font-black shadow-md cursor-pointer flex items-center gap-2"
                >
                  {saving || uploadingImage ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{uploadingImage ? 'Fotoğraf Yükleniyor...' : 'Kaydediliyor...'}</span>
                    </>
                  ) : (
                    <span>{editingItem ? 'Güncelle' : 'Ürünü Kaydet'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CATEGORY CREATE / EDIT MODAL */}
      {/* ========================================================================= */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-[#292524]">
                {editingCat ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}
              </h3>
              <button onClick={() => setCatModalOpen(false)} className="p-2 text-stone-400 hover:text-stone-700">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveCat} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-black text-[#292524] uppercase tracking-wider block mb-1.5">
                  Kategori Adı (Türkçe) *
                </label>
                <input
                  type="text"
                  required
                  value={catForm.name_tr}
                  onChange={(e) => setCatForm({ ...catForm, name_tr: e.target.value })}
                  placeholder="Örn: Döner & Kebaplar"
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-sm font-bold outline-none focus:ring-2 focus:ring-[#C2410C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-stone-500 block mb-1">İngilizce Ad</label>
                  <input
                    type="text"
                    value={catForm.name_en}
                    onChange={(e) => setCatForm({ ...catForm, name_en: e.target.value })}
                    placeholder="Kebabs & Wraps"
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-500 block mb-1">Lehçe Ad</label>
                  <input
                    type="text"
                    value={catForm.name_pl}
                    onChange={(e) => setCatForm({ ...catForm, name_pl: e.target.value })}
                    placeholder="Kebab i Dania"
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                {editingCat && (
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(editingCat.id)}
                    className="px-4 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold"
                  >
                    Kategoriyi Sil
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setCatModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-600"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-[#C2410C] hover:bg-orange-700 text-white text-xs font-black shadow-md cursor-pointer"
                  >
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default MenuManagement
