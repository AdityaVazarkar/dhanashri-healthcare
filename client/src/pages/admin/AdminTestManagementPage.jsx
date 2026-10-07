import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Droplet,
  SlidersHorizontal,
  X,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminTestManagementPage() {
  const [tests, setTests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    test_code: '',
    category_id: '',
    description: '',
    price: '',
    discount_price: '',
    sample_type: 'Blood',
    report_time: 'Same Day (Within 8 hours)',
    fasting_required: false,
    preparation_instructions: '',
    status: 'active',
    is_popular: false,
    parameters: [{ name: '', unit: '', reference_range: '' }],
  });

  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [testsRes, catsRes] = await Promise.all([
        api.get('/tests?status=all', { headers: { 'X-Admin-Request': 'true' } }),
        api.get('/categories', { headers: { 'X-Admin-Request': 'true' } }),
      ]);
      setTests(testsRes.data.tests || []);
      setCategories(catsRes.data.categories || []);
    } catch (err) {
      console.error('Failed to load tests:', err);
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

  const handleOpenAddModal = () => {
    setEditingTest(null);
    setFormData({
      name: '',
      test_code: `TEST${Math.floor(100 + Math.random() * 900)}`,
      category_id: categories[0]?.id || '',
      description: '',
      price: '',
      discount_price: '',
      sample_type: 'Blood',
      report_time: 'Same Day',
      fasting_required: false,
      preparation_instructions: '',
      status: 'active',
      is_popular: false,
      parameters: [{ name: '', unit: '', reference_range: '' }],
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (test) => {
    setEditingTest(test);
    setErrorMsg('');
    try {
      const res = await api.get(`/tests/${test.id}`);
      const t = res.data.test;
      setFormData({
        name: t.name,
        test_code: t.test_code,
        category_id: t.category_id || '',
        description: t.description || '',
        price: t.price,
        discount_price: t.discount_price || '',
        sample_type: t.sample_type || 'Blood',
        report_time: t.report_time || 'Same Day',
        fasting_required: Boolean(t.fasting_required),
        preparation_instructions: t.preparation_instructions || '',
        status: t.status || 'active',
        is_popular: Boolean(t.is_popular),
        parameters: t.parameters?.length
          ? t.parameters.map((p) => ({ name: p.name, unit: p.unit || '', reference_range: p.reference_range || '' }))
          : [{ name: '', unit: '', reference_range: '' }],
      });
      setIsModalOpen(true);
    } catch (err) {
      console.error('Failed to load test details for edit', err);
    }
  };

  const handleAddParameterRow = () => {
    setFormData({
      ...formData,
      parameters: [...formData.parameters, { name: '', unit: '', reference_range: '' }],
    });
  };

  const handleRemoveParameterRow = (index) => {
    const next = formData.parameters.filter((_, idx) => idx !== index);
    setFormData({ ...formData, parameters: next });
  };

  const handleParameterChange = (index, field, value) => {
    const next = [...formData.parameters];
    next[index][field] = value;
    setFormData({ ...formData, parameters: next });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setFormLoading(true);

    try {
      if (editingTest) {
        await api.put(`/tests/${editingTest.id}`, formData, {
          headers: { 'X-Admin-Request': 'true' },
        });
      } else {
        await api.post('/tests', formData, {
          headers: { 'X-Admin-Request': 'true' },
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save test.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (testId) => {
    try {
      await api.patch(`/tests/${testId}/toggle-status`, {}, {
        headers: { 'X-Admin-Request': 'true' },
      });
      fetchData();
    } catch (err) {
      console.error('Failed to toggle test status', err);
    }
  };

  const handleDeleteTest = async (testId) => {
    if (window.confirm('Are you sure you want to delete this test permanently?')) {
      try {
        await api.delete(`/tests/${testId}`, {
          headers: { 'X-Admin-Request': 'true' },
        });
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete test');
      }
    }
  };

  const filteredTests = tests.filter((t) => {
    const s = search.toLowerCase().trim();
    const matchesSearch = !s ||
      (t.name || '').toLowerCase().includes(s) ||
      (t.test_code || '').toLowerCase().includes(s);
    const matchesCategory = categoryFilter ? String(t.category_id) === String(categoryFilter) : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Diagnostic Test Management</h2>
          <p className="text-xs text-slate-500">Configure blood test profiles, biological reference parameters, and prices.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-sm transition active:scale-95 disabled:opacity-50"
            title="Refresh tests list"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#16A34A] ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Test</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search test name or code..."
            className="w-full py-2 pl-9 pr-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-48 p-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tests Table */}
      {loading ? (
        <LoadingSpinner message="Loading catalog tests..." />
      ) : (
        <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-4 font-bold">Code</th>
                  <th className="py-3 px-4 font-bold">Test Name</th>
                  <th className="py-3 px-4 font-bold">Category</th>
                  <th className="py-3 px-4 font-bold">Sample</th>
                  <th className="py-3 px-4 font-bold">Price / Disc.</th>
                  <th className="py-3 px-4 font-bold">Turnaround</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTests.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      <FlaskConical className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-700 text-sm">No diagnostic tests found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {search || categoryFilter ? 'Try clearing your search or category filter.' : 'Click "Add New Test" to register a clinical test profile.'}
                      </p>
                      {(search || categoryFilter) && (
                        <button
                          onClick={() => { setSearch(''); setCategoryFilter(''); }}
                          className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-50 text-[#15803D] font-bold text-xs hover:bg-emerald-100 transition"
                        >
                          Clear Filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredTests.map((test) => (
                  <tr key={test.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{test.test_code}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{test.name}</div>
                      {test.is_popular && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                          ⭐ Popular
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">{test.category_name || '-'}</td>
                    <td className="py-3 px-4 text-slate-600">{test.sample_type}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">₹{test.discount_price || test.price}</div>
                      {test.discount_price && (
                        <span className="text-[10px] text-slate-400 line-through">₹{test.price}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{test.report_time}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(test.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition ${
                          test.status === 'active'
                            ? 'bg-emerald-100 text-[#15803D] hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                        }`}
                        title="Click to toggle status"
                      >
                        {test.status}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(test)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          title="Edit Test"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTest(test.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Test"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT TEST MODAL --- */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingTest ? 'Edit Diagnostic Test' : 'Add New Diagnostic Test'}
          subtitle="Configure sample requirements and biological reference parameters"
          maxWidth="max-w-3xl"
        >
          {errorMsg && (
            <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Test Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Complete Blood Count (CBC)"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Test Code *</label>
                <input
                  type="text"
                  required
                  value={formData.test_code}
                  onChange={(e) => setFormData({ ...formData, test_code: e.target.value })}
                  placeholder="e.g. CBC001"
                  className="w-full p-2.5 rounded-xl border border-slate-200 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Sample Matrix</label>
                <input
                  type="text"
                  value={formData.sample_type}
                  onChange={(e) => setFormData({ ...formData, sample_type: e.target.value })}
                  placeholder="e.g. EDTA Blood, Serum, Fluoride Plasma"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Standard Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="e.g. 500"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Discounted Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discount_price}
                  onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                  placeholder="e.g. 450"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Report Turnaround Time</label>
                <input
                  type="text"
                  value={formData.report_time}
                  onChange={(e) => setFormData({ ...formData, report_time: e.target.value })}
                  placeholder="e.g. Same Day (Within 6 hours)"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>

              <div className="space-y-1 flex items-center pt-5">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.fasting_required}
                    onChange={(e) => setFormData({ ...formData, fasting_required: e.target.checked })}
                    className="w-4 h-4 accent-[#16A34A]"
                  />
                  <span className="font-bold text-slate-700">Overnight Fasting Required</span>
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Description</label>
              <textarea
                rows="2"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Clinical scope of this test..."
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Patient Preparation Instructions</label>
              <input
                type="text"
                value={formData.preparation_instructions}
                onChange={(e) => setFormData({ ...formData, preparation_instructions: e.target.value })}
                placeholder="e.g. 10 hours fasting. Take morning medicine after blood draw."
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              />
            </div>

            {/* Dynamic Parameters List */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Biomarker Parameters & Reference Ranges</span>
                  <p className="text-[11px] text-slate-400">Add individual parameters evaluated in this test</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddParameterRow}
                  className="px-2.5 py-1 bg-emerald-50 text-[#15803D] hover:bg-emerald-100 font-bold rounded-lg transition"
                >
                  + Add Parameter
                </button>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {formData.parameters.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Parameter Name (e.g. Hemoglobin)"
                      value={p.name}
                      onChange={(e) => handleParameterChange(idx, 'name', e.target.value)}
                      className="flex-1 p-2 rounded-lg border border-slate-200 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Unit (e.g. g/dL)"
                      value={p.unit}
                      onChange={(e) => handleParameterChange(idx, 'unit', e.target.value)}
                      className="w-24 p-2 rounded-lg border border-slate-200 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Reference Range (e.g. 13.0 - 17.0)"
                      value={p.reference_range}
                      onChange={(e) => handleParameterChange(idx, 'reference_range', e.target.value)}
                      className="w-40 p-2 rounded-lg border border-slate-200 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveParameterRow(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_popular}
                  onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                  className="w-4 h-4 accent-[#16A34A]"
                />
                <span className="font-bold text-slate-700">Feature as Popular Test</span>
              </label>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-xl shadow-sm"
                >
                  {formLoading ? 'Saving...' : 'Save Diagnostic Test'}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
