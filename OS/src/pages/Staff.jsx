import React, { useState } from 'react'
import { Users, Shield, UserCheck, Plus, Key, Clock, Globe, Lock, Edit3, CheckCircle2 } from 'lucide-react'

export function Staff() {
  const [staffList, setStaffList] = useState([
    {
      id: 'st_1',
      name: 'Ahmet Yılmaz',
      role: 'admin',
      roleLabel: 'Admin (İşletme Sahibi)',
      email: 'ahmet@gustobistro.com',
      pin: '1234',
      language: 'tr',
      languageLabel: 'Türkçe 🇹🇷',
      status: 'Aktif',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
    },
    {
      id: 'st_2',
      name: 'Elif Demir',
      role: 'cashier',
      roleLabel: 'Kasiyer (Kasa Sorumlusu)',
      email: 'kasa1@gustobistro.com',
      pin: '2580',
      language: 'tr',
      languageLabel: 'Türkçe 🇹🇷',
      status: 'Nöbette',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'
    },
    {
      id: 'st_3',
      name: 'Marek Nowak',
      role: 'kitchen',
      roleLabel: 'Mutfak Şefi (KDS)',
      email: 'marek@gustobistro.com',
      pin: '7788',
      language: 'pl',
      languageLabel: 'Polski 🇵🇱',
      status: 'Mutfakta',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'
    },
    {
      id: 'st_4',
      name: 'Oksana Petrenko',
      role: 'organizer',
      roleLabel: 'Sipariş Hazırlayıcı (Organizer)',
      email: 'oksana@gustobistro.com',
      pin: '4455',
      language: 'uk',
      languageLabel: 'Українська 🇺🇦',
      status: 'Nöbette',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100'
    }
  ])

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)

  return (
    <div className="p-8 space-y-8 bg-[#FAFAF9] min-h-full overflow-y-auto">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#C2410C] flex items-center justify-center border border-orange-200">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#292524]">Personel & Rol Yetkilendirme</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              4 Haneli Hızlı PIN girişleri, dil tercihleri ve esnek rol şablonları.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 bg-[#C2410C] hover:bg-[#EA580C] text-white rounded-xl font-bold text-sm shadow-md shadow-[#C2410C]/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Personel Ekle</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs font-bold text-stone-400 uppercase bg-stone-50 border-b border-stone-100">
            <tr>
              <th className="px-6 py-4">Personel</th>
              <th className="px-6 py-4">Yetki Rolü</th>
              <th className="px-6 py-4">Hızlı POS PIN</th>
              <th className="px-6 py-4">Arayüz Dili</th>
              <th className="px-6 py-4">Durum</th>
              <th className="px-6 py-4 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {staffList.map((person) => (
              <tr key={person.id} className="hover:bg-stone-50/60 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={person.avatar} alt={person.name} className="w-10 h-10 rounded-xl object-cover border border-stone-200" />
                    <div>
                      <h4 className="font-bold text-[#292524]">{person.name}</h4>
                      <p className="text-xs text-stone-400 font-medium">{person.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    person.role === 'admin' ? 'bg-orange-50 text-[#C2410C] border border-orange-200' :
                    person.role === 'kitchen' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                    person.role === 'organizer' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    'bg-stone-100 text-stone-700'
                  }`}>
                    {person.roleLabel}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-mono font-black text-sm text-[#292524] bg-stone-100 px-2.5 py-1 rounded-md tracking-wider">
                    {person.pin}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700">
                    <Globe className="w-3.5 h-3.5 text-stone-400" />
                    {person.languageLabel}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                    {person.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => setEditingStaff(person)}
                    className="p-2 text-stone-400 hover:text-[#C2410C] hover:bg-orange-50 rounded-lg transition-colors"
                    title="Düzenle"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
