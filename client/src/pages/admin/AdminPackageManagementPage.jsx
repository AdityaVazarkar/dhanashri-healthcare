import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, CheckCircle2, AlertCircle, X, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminPackageManagementPage() {
  const [packages, setPackages] = useState([]);
  const [allTests, setAllTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    original_price: '',
    discount_price: '',
    benefits: [''],
    preparation_instructions: '',
    is_featured: false,
    test_ids: [],
  });

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [pkgsRes, testsRes] = await Promise.all([
        api.get('/packages?status=all', { headers: { 'X-Admin-Request': 'true' } }),
        api.get('/tests?status=all', { headers: { 'X-Admin-Request': 'true' } }),
      ]);
      setPackages(pkgsRes.data.packages || []);
      setAllTests(testsRes.data.tests || []);
    } catch (err) {
      console.error('Failed to load packages:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Live polling every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(false);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenAdd = () => {
    setEditingPkg(null);
    setFormData({
      name: '',
      description: '',
      original_price: '',
      discount_price: '',
      benefits: ['Free Home Sample Collection', 'Certified Digital Report Same Day'],
      preparation_instructions: '10-12 hours overnight fasting mandatory.',
      is_featured: false,
      test_ids: allTests.slice(0, 3).map((t) => t.id),
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pkg) => {
    setEditingPkg(pkg);
    const parsedBenefits = typeof pkg.benefits === 'string' ? JSON.parse(pkg.benefits || '[]') : (pkg.benefits || []);
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      original_price: pkg.original_price,
      discount_price: pkg.discount_price,
      benefits: parsedBenefits.length ? parsedBenefits : [''],
      preparation_instructions: pkg.preparation_instructions || '',
      is_featured: Boolean(pkg.is_featured),
      test_ids: pkg.included_tests ? pkg.included_tests.map((t) => t.id) : [],
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleAddBenefit = () => {
    setFormData({ ...formData, benefits: [...formData.benefits, ''] });
  };

  const handleRemoveBenefit = (index) => {
    setFormData({ ...formData, benefits: formData.benefits.filter((_, i) => i !== index) });
  };

  const handleBenefitChange = (index, value) => {
    const next = [...formData.benefits];
    next[index] = value;
    setFormData({ ...formData, benefits: next });
  };

  const handleToggleTestSelection = (testId) => {
    const exists = formData.test_ids.includes(testId);
    if (exists) {
      setFormData({ ...formData, test_ids: formData.test_ids.filter((id) => id !== testId) });
    } else {
      setFormData({ ...formData, test_ids: [...formData.test_ids, testId] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const payload = {
        ...formData,
        benefits: formData.benefits.filter((b) => b.trim() !== ''),
      };

      if (editingPkg) {
        await api.put(`/packages/${editingPkg.id}`, payload, {
          headers: { 'X-Admin-Request': 'true' },
        });
      } else {
        await api.post('/packages', payload, {
          headers: { 'X-Admin-Request': 'true' },
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save package');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this package?')) {
      try {
        await api.delete(`/packages/${id}`, { headers: { 'X-Admin-Request': 'true' } });
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || 'Delete failed');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Health Packages Management</h2>
          <p className="text-xs text-slate-500">Bundle clinical tests into discounted preventive profiles.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-sm transition active:scale-95 disabled:opacity-50"
            title="Refresh packages list"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#16A34A] ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Package</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading health packages..." />
      ) : packages.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 shadow-sm">
          <Package className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <h3 className="text-base font-bold text-slate-800">No health packages found</h3>
          <p className="text-xs text-slate-400 mt-1">Create your first bundled health package to offer discounted checkups.</p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs rounded-xl transition"
          >
            + Create First Package
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#15803D] bg-emerald-50 px-2.5 py-1 rounded-full">
                    {pkg.is_featured ? '⭐ Featured' : 'General'}
                  </span>
                  <div className="text-right">
                    <span className="text-base font-black text-slate-900">₹{pkg.discount_price}</span>
                    <span className="text-xs text-slate-400 line-through ml-1.5">₹{pkg.original_price}</span>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{pkg.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{pkg.description}</p>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-400 font-semibold block">Tests Included ({pkg.included_tests?.length || 0}):</span>
                  <div className="flex flex-wrap gap-1">
                    {(pkg.included_tests || []).map((t) => (
                      <span key={t.id} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  onClick={() => handleOpenEdit(pkg)}
                  className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(pkg.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Package Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingPkg ? 'Edit Package' : 'Create Health Package'}
          subtitle="Configure package tests bundle, benefits, and pricing"
          maxWidth="max-w-2xl"
        >
          {errorMsg && (
            <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2">
                <label className="font-bold text-slate-700">Package Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Basic Health Checkup"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Original Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={formData.original_price}
                  onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Discounted Offer Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={formData.discount_price}
                  onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Description</label>
              <textarea
                rows="2"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              />
            </div>

            {/* Test Selection Checkboxes */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700">Select Tests Included in Package</label>
              <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl p-3 grid grid-cols-2 gap-2 bg-slate-50">
                {allTests.map((t) => (
                  <label key={t.id} className="flex items-center space-x-2 text-[11px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.test_ids.includes(t.id)}
                      onChange={() => handleToggleTestSelection(t.id)}
                      className="rounded accent-[#16A34A]"
                    />
                    <span className="truncate">{t.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-700">Key Benefits</label>
                <button
                  type="button"
                  onClick={handleAddBenefit}
                  className="text-[#16A34A] font-bold text-[11px] hover:underline"
                >
                  + Add Benefit
                </button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {formData.benefits.map((b, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={b}
                      onChange={(e) => handleBenefitChange(idx, e.target.value)}
                      placeholder="e.g. Free Home Sample Collection"
                      className="flex-1 p-2 rounded-lg border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveBenefit(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-4 h-4 accent-[#16A34A]"
                />
                <span className="font-bold text-slate-700">Feature on Homepage</span>
              </label>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-xl shadow-sm"
                >
                  Save Package
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
