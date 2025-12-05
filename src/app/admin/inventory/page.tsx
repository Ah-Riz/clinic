'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';

const ADMIN_DEVICE_ID = process.env.NEXT_PUBLIC_ADMIN_DEVICE_ID ?? 'ADMIN-001';

type Medicine = {
  id: string;
  name: string;
  unit: string | null;
  price: number | null;
  low_stock_threshold: number | null;
  active: boolean;
  total_stock?: number;
};

type MedicineBatch = {
  id: string;
  medicine_id: string;
  batch_no: string;
  expiry_date: string;
  quantity: number;
  cost: number | null;
  arrived_at: string;
  medicine?: { name: string };
};

export default function AdminInventoryPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createSupabaseBrowserClient({ 'x-device-id': ADMIN_DEVICE_ID }), []);

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batches, setBatches] = useState<MedicineBatch[]>([]);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState<'medicines' | 'batches' | 'low-stock'>('medicines');
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [lowStockAlert, setLowStockAlert] = useState<string | null>(null);

  // Medicine form
  const [medName, setMedName] = useState('');
  const [medUnit, setMedUnit] = useState('');
  const [medPrice, setMedPrice] = useState('');
  const [medThreshold, setMedThreshold] = useState('10');

  // Batch form
  const [batchMedicineId, setBatchMedicineId] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [batchExpiry, setBatchExpiry] = useState('');
  const [batchQty, setBatchQty] = useState('');
  const [batchCost, setBatchCost] = useState('');

  useEffect(() => {
    if (user) {
      loadData();

      // Subscribe to realtime changes on medicine_batches for low stock alerts
      const channel = supabase
        .channel('inventory-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'medicine_batches' },
          async (payload) => {
            console.log('Medicine batch changed:', payload);
            
            // Check if this is a stock reduction
            if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
              const oldQty = (payload.old as any).quantity;
              const newQty = (payload.new as any).quantity;
              
              if (newQty < oldQty) {
                // Stock was reduced, check if low
                const medicineId = (payload.new as any).medicine_id;
                const { data: med } = await supabase
                  .from('medicines')
                  .select('name, low_stock_threshold')
                  .eq('id', medicineId)
                  .single();
                
                if (med) {
                  // Calculate total stock for this medicine
                  const { data: batches } = await supabase
                    .from('medicine_batches')
                    .select('quantity')
                    .eq('medicine_id', medicineId);
                  
                  const totalStock = (batches ?? []).reduce((sum, b) => sum + b.quantity, 0);
                  const threshold = med.low_stock_threshold || 10;
                  
                  if (totalStock <= threshold) {
                    setLowStockAlert(`⚠️ Stok ${med.name} rendah! Tersisa ${totalStock} unit (minimum: ${threshold})`);
                    setActiveTab('low-stock');
                  }
                }
              }
            }
            
            loadData(); // Refresh data on any change
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  async function loadData() {
    setFetching(true);
    try {
      // Load medicines with stock calculation
      const { data: medsData } = await supabase
        .from('medicines')
        .select('*')
        .order('name');

      // Load batches with medicine name
      const { data: batchesData } = await supabase
        .from('medicine_batches')
        .select('*, medicine:medicines(name)')
        .order('expiry_date');

      // Calculate total stock per medicine
      const stockMap: Record<string, number> = {};
      (batchesData ?? []).forEach((b: MedicineBatch) => {
        stockMap[b.medicine_id] = (stockMap[b.medicine_id] || 0) + b.quantity;
      });

      const medsWithStock = (medsData ?? []).map((m: Medicine) => ({
        ...m,
        total_stock: stockMap[m.id] || 0,
      }));

      setMedicines(medsWithStock);
      setBatches(batchesData ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  }

  function openAddMedicine() {
    setEditingMedicine(null);
    setMedName('');
    setMedUnit('tablet');
    setMedPrice('');
    setMedThreshold('10');
    setShowMedicineModal(true);
  }

  function openEditMedicine(med: Medicine) {
    setEditingMedicine(med);
    setMedName(med.name);
    setMedUnit(med.unit || '');
    setMedPrice(med.price?.toString() || '');
    setMedThreshold(med.low_stock_threshold?.toString() || '10');
    setShowMedicineModal(true);
  }

  async function saveMedicine() {
    if (!medName.trim()) return;

    const payload = {
      name: medName.trim(),
      unit: medUnit.trim() || null,
      price: medPrice ? parseFloat(medPrice) : null,
      low_stock_threshold: parseInt(medThreshold) || 10,
    };

    if (editingMedicine) {
      const { error } = await supabase
        .from('medicines')
        .update(payload)
        .eq('id', editingMedicine.id);
      if (error) {
        setActionMessage(`Error: ${error.message}`);
      } else {
        setActionMessage('Obat berhasil diperbarui');
        setShowMedicineModal(false);
        loadData();
      }
    } else {
      const { error } = await supabase
        .from('medicines')
        .insert(payload);
      if (error) {
        setActionMessage(`Error: ${error.message}`);
      } else {
        setActionMessage('Obat berhasil ditambahkan');
        setShowMedicineModal(false);
        loadData();
      }
    }
  }

  async function toggleMedicineActive(med: Medicine) {
    const { error } = await supabase
      .from('medicines')
      .update({ active: !med.active })
      .eq('id', med.id);
    if (!error) {
      loadData();
    }
  }

  function openAddBatch() {
    setBatchMedicineId(medicines[0]?.id || '');
    setBatchNo('');
    setBatchExpiry('');
    setBatchQty('');
    setBatchCost('');
    setShowBatchModal(true);
  }

  async function saveBatch() {
    if (!batchMedicineId || !batchNo.trim() || !batchExpiry || !batchQty) return;

    const { error } = await supabase.from('medicine_batches').insert({
      medicine_id: batchMedicineId,
      batch_no: batchNo.trim(),
      expiry_date: batchExpiry,
      quantity: parseInt(batchQty),
      cost: batchCost ? parseFloat(batchCost) : null,
    });

    if (error) {
      setActionMessage(`Error: ${error.message}`);
    } else {
      setActionMessage('Batch berhasil ditambahkan');
      setShowBatchModal(false);
      loadData();
    }
  }

  async function deleteBatch(id: string) {
    if (!confirm('Hapus batch ini?')) return;
    const { error } = await supabase.from('medicine_batches').delete().eq('id', id);
    if (!error) {
      loadData();
    }
  }

  const lowStockMedicines = medicines.filter(
    (m) => m.active && m.total_stock !== undefined && m.total_stock <= (m.low_stock_threshold || 10)
  );

  const expiringBatches = batches.filter((b) => {
    const expiry = new Date(b.expiry_date);
    const threeMonths = new Date();
    threeMonths.setMonth(threeMonths.getMonth() + 3);
    return expiry <= threeMonths && b.quantity > 0;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Link href="/admin/login" className="text-blue-600 hover:underline">
          Login untuk mengakses halaman ini
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700">
              ← Kembali ke Admin
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Inventori Obat</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={openAddMedicine}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              + Tambah Obat
            </button>
            <button
              onClick={openAddBatch}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Stock In
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className={`rounded-lg p-3 text-sm ${actionMessage.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {actionMessage}
          </div>
        )}

        {lowStockAlert && (
          <div className="rounded-lg border-l-4 border-orange-500 bg-orange-50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔔</span>
              <span className="text-sm font-medium text-orange-800">{lowStockAlert}</span>
            </div>
            <button
              onClick={() => setLowStockAlert(null)}
              className="text-orange-600 hover:text-orange-800 text-sm"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Alerts */}
        {(lowStockMedicines.length > 0 || expiringBatches.length > 0) && (
          <div className="grid gap-4 md:grid-cols-2">
            {lowStockMedicines.length > 0 && (
              <div className="rounded-lg border-l-4 border-orange-500 bg-orange-50 p-4">
                <h3 className="font-semibold text-orange-800">⚠️ Stok Rendah ({lowStockMedicines.length})</h3>
                <ul className="mt-2 text-sm text-orange-700">
                  {lowStockMedicines.slice(0, 5).map((m) => (
                    <li key={m.id}>
                      {m.name}: {m.total_stock} {m.unit}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {expiringBatches.length > 0 && (
              <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4">
                <h3 className="font-semibold text-red-800">🕐 Mendekati Kadaluarsa ({expiringBatches.length})</h3>
                <ul className="mt-2 text-sm text-red-700">
                  {expiringBatches.slice(0, 5).map((b) => (
                    <li key={b.id}>
                      {(b.medicine as any)?.name}: {b.batch_no} (exp: {b.expiry_date})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200">
          {(['medicines', 'batches', 'low-stock'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'medicines' && `Daftar Obat (${medicines.length})`}
              {tab === 'batches' && `Batch (${batches.length})`}
              {tab === 'low-stock' && `Stok Rendah (${lowStockMedicines.length})`}
            </button>
          ))}
        </div>

        {fetching ? (
          <div className="py-12 text-center text-slate-500">Memuat data...</div>
        ) : (
          <>
            {activeTab === 'medicines' && (
              <div className="rounded-xl bg-white shadow overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Nama Obat</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Unit</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Harga</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Stok</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-600">Status</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {medicines.map((med) => (
                      <tr key={med.id} className={!med.active ? 'bg-slate-50 opacity-60' : ''}>
                        <td className="px-4 py-3 font-medium text-slate-900">{med.name}</td>
                        <td className="px-4 py-3 text-slate-600">{med.unit || '-'}</td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {med.price ? `Rp ${med.price.toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={
                              (med.total_stock || 0) <= (med.low_stock_threshold || 10)
                                ? 'font-semibold text-orange-600'
                                : 'text-slate-600'
                            }
                          >
                            {med.total_stock || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                              med.active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {med.active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => openEditMedicine(med)}
                            className="text-blue-600 hover:underline mr-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggleMedicineActive(med)}
                            className="text-slate-500 hover:underline"
                          >
                            {med.active ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {medicines.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                          Belum ada data obat
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'batches' && (
              <div className="rounded-xl bg-white shadow overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Obat</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">No. Batch</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Kadaluarsa</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Qty</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Harga Beli</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batches.map((batch) => {
                      const isExpiring = new Date(batch.expiry_date) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                      const isExpired = new Date(batch.expiry_date) < new Date();
                      return (
                        <tr key={batch.id} className={isExpired ? 'bg-red-50' : isExpiring ? 'bg-orange-50' : ''}>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {(batch.medicine as any)?.name || '-'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{batch.batch_no}</td>
                          <td className="px-4 py-3">
                            <span className={isExpired ? 'text-red-600 font-semibold' : isExpiring ? 'text-orange-600' : 'text-slate-600'}>
                              {batch.expiry_date}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">{batch.quantity}</td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {batch.cost ? `Rp ${batch.cost.toLocaleString('id-ID')}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => deleteBatch(batch.id)}
                              className="text-red-600 hover:underline"
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {batches.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                          Belum ada data batch
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'low-stock' && (
              <div className="rounded-xl bg-white shadow overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Nama Obat</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Stok Saat Ini</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Minimum</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Kekurangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lowStockMedicines.map((med) => (
                      <tr key={med.id}>
                        <td className="px-4 py-3 font-medium text-slate-900">{med.name}</td>
                        <td className="px-4 py-3 text-right text-orange-600 font-semibold">
                          {med.total_stock} {med.unit}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {med.low_stock_threshold} {med.unit}
                        </td>
                        <td className="px-4 py-3 text-right text-red-600 font-semibold">
                          {(med.low_stock_threshold || 10) - (med.total_stock || 0)} {med.unit}
                        </td>
                      </tr>
                    ))}
                    {lowStockMedicines.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-green-600">
                          ✅ Semua stok obat mencukupi
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Medicine Modal */}
      {showMedicineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">
              {editingMedicine ? 'Edit Obat' : 'Tambah Obat Baru'}
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Nama Obat *</label>
                <input
                  type="text"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  placeholder="Paracetamol 500mg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Unit</label>
                  <select
                    value={medUnit}
                    onChange={(e) => setMedUnit(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <option value="tablet">tablet</option>
                    <option value="kapsul">kapsul</option>
                    <option value="botol">botol</option>
                    <option value="ampul">ampul</option>
                    <option value="tube">tube</option>
                    <option value="sachet">sachet</option>
                    <option value="strip">strip</option>
                    <option value="box">box</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Harga Jual</label>
                  <input
                    type="number"
                    value={medPrice}
                    onChange={(e) => setMedPrice(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    placeholder="5000"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Batas Stok Minimum</label>
                <input
                  type="number"
                  value={medThreshold}
                  onChange={(e) => setMedThreshold(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  placeholder="10"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowMedicineModal(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={saveMedicine}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Stock In (Tambah Batch)</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Obat *</label>
                <select
                  value={batchMedicineId}
                  onChange={(e) => setBatchMedicineId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                >
                  {medicines.filter((m) => m.active).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">No. Batch *</label>
                  <input
                    type="text"
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    placeholder="ABC123"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Kadaluarsa *</label>
                  <input
                    type="date"
                    value={batchExpiry}
                    onChange={(e) => setBatchExpiry(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Jumlah *</label>
                  <input
                    type="number"
                    value={batchQty}
                    onChange={(e) => setBatchQty(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Harga Beli/unit</label>
                  <input
                    type="number"
                    value={batchCost}
                    onChange={(e) => setBatchCost(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    placeholder="3000"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowBatchModal(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={saveBatch}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
