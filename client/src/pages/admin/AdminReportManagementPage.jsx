import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Upload,
  Plus,
  Search,
  Eye,
  Download,
  Bell,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminReportManagementPage() {
  const [reports, setReports] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tests, setTests] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paramsLoading, setParamsLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [searchParams] = useSearchParams();
  const urlBookingId = searchParams.get('booking_id');

  // Upload modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  const { adminToken } = useAuth();

  // Form fields
  const [formData, setFormData] = useState({
    booking_id: '',
    test_id: '',
    patient_name: '',
    report_date: new Date().toISOString().split('T')[0],
    pathologist_name: 'Dr. Arvind Mehra, MD (Pathology)',
    pathologist_qualification: 'Chief Pathologist & Laboratory Director',
    remarks: 'Normal clinical findings. Correlate with clinical condition.',
    parameters: [
      { parameter_name: 'Hemoglobin', result_value: '', unit: 'g/dL', reference_range: '13.0 - 17.0', is_abnormal: false },
    ],
  });
  const [pdfFile, setPdfFile] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reportsRes, bookingsRes, testsRes, packagesRes] = await Promise.all([
        api.get('/reports/admin', { headers: { 'X-Admin-Request': 'true' } }),
        api.get('/bookings/admin?limit=100', { headers: { 'X-Admin-Request': 'true' } }),
        api.get('/tests?status=all', { headers: { 'X-Admin-Request': 'true' } }),
        api.get('/packages?status=all', { headers: { 'X-Admin-Request': 'true' } }),
      ]);
      setReports(reportsRes.data.reports || []);
      setBookings(bookingsRes.data.bookings || []);
      setTests(testsRes.data.tests || []);
      setPackages(packagesRes.data.packages || []);
    } catch (err) {
      console.error('Failed to load reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Extract all lab tests associated with a booking
  const getTestsForBooking = (bk, allTests = tests, allPackages = packages) => {
    if (!bk || !bk.items || !Array.isArray(bk.items)) return [];
    const foundTests = [];
    const seenIds = new Set();

    for (const it of bk.items) {
      if (!it) continue;
      // 1. Direct test_id
      if (it.test_id) {
        const match = allTests.find((t) => Number(t.id) === Number(it.test_id));
        if (match && !seenIds.has(match.id)) {
          seenIds.add(match.id);
          foundTests.push(match);
        } else if (!match && !seenIds.has(it.test_id)) {
          seenIds.add(it.test_id);
          foundTests.push({ id: it.test_id, name: it.item_name || `Test #${it.test_id}`, test_code: '' });
        }
      }
      // 2. Package package_id
      if (it.package_id) {
        const pkg = allPackages.find((p) => Number(p.id) === Number(it.package_id));
        if (pkg && Array.isArray(pkg.included_tests)) {
          for (const pt of pkg.included_tests) {
            const match = allTests.find((t) => Number(t.id) === Number(pt.id)) || pt;
            if (match && !seenIds.has(match.id)) {
              seenIds.add(match.id);
              foundTests.push(match);
            }
          }
        }
      }
    }

    // 3. Fallback matching by item_name
    if (foundTests.length === 0 && bk.items.length > 0) {
      for (const it of bk.items) {
        if (!it || !it.item_name) continue;
        const cleanName = it.item_name.trim().toLowerCase();
        const match = allTests.find((t) => t.name.trim().toLowerCase() === cleanName);
        if (match && !seenIds.has(match.id)) {
          seenIds.add(match.id);
          foundTests.push(match);
        }
      }
    }

    return foundTests;
  };

  // Helper: Load official clinical parameter templates for a test profile
  const loadTestParameters = async (testId) => {
    if (!testId) {
      return [
        { parameter_name: '', result_value: '', unit: '', reference_range: '', is_abnormal: false },
      ];
    }
    try {
      const res = await api.get(`/tests/${testId}`);
      if (res.data?.test?.parameters && res.data.test.parameters.length > 0) {
        return res.data.test.parameters.map((p) => ({
          parameter_name: p.name,
          result_value: '',
          unit: p.unit || '',
          reference_range: p.reference_range || '',
          is_abnormal: false,
        }));
      }
    } catch (err) {
      console.error('Failed to load parameters for test', testId, err);
    }
    return [
      { parameter_name: '', result_value: '', unit: '', reference_range: '', is_abnormal: false },
    ];
  };

  const handleOpenUploadModal = async (initialBookingId = null) => {
    setErrorMsg('');
    setPdfFile(null);

    const targetBooking = initialBookingId
      ? bookings.find((b) => String(b.id) === String(initialBookingId)) || bookings[0]
      : bookings[0];

    const bookedTests = getTestsForBooking(targetBooking, tests, packages);
    const autoTestId = bookedTests.length > 0 ? bookedTests[0].id : (tests[0]?.id || '');

    setFormData({
      booking_id: targetBooking ? targetBooking.id : '',
      test_id: autoTestId,
      patient_name: targetBooking ? targetBooking.patient_name : '',
      report_date: new Date().toISOString().split('T')[0],
      pathologist_name: 'Dr. Arvind Mehra, MD (Pathology)',
      pathologist_qualification: 'Chief Pathologist & Laboratory Director',
      remarks: 'Normal clinical findings. Correlate with clinical condition.',
      parameters: [
        { parameter_name: 'Loading template...', result_value: '', unit: '', reference_range: '', is_abnormal: false },
      ],
    });
    setIsModalOpen(true);

    if (autoTestId) {
      setParamsLoading(true);
      const loadedParams = await loadTestParameters(autoTestId);
      setFormData((prev) => ({
        ...prev,
        parameters: loadedParams,
      }));
      setParamsLoading(false);
    }
  };

  // Auto open modal if booking_id was passed in URL
  useEffect(() => {
    if (urlBookingId && bookings.length > 0 && !isModalOpen) {
      handleOpenUploadModal(urlBookingId);
    }
  }, [urlBookingId, bookings.length]);

  const handleBookingSelect = async (bId) => {
    const selectedBk = bookings.find((b) => String(b.id) === String(bId));
    const bookedTests = getTestsForBooking(selectedBk, tests, packages);
    const autoTestId = bookedTests.length > 0 ? bookedTests[0].id : (tests[0]?.id || '');

    setFormData((prev) => ({
      ...prev,
      booking_id: bId,
      patient_name: selectedBk ? selectedBk.patient_name : prev.patient_name,
      test_id: autoTestId || prev.test_id,
    }));

    if (autoTestId) {
      setParamsLoading(true);
      const loadedParams = await loadTestParameters(autoTestId);
      setFormData((prev) => ({
        ...prev,
        parameters: loadedParams,
      }));
      setParamsLoading(false);
    }
  };

  const handleTestSelect = async (testId) => {
    setFormData((prev) => ({
      ...prev,
      test_id: testId,
    }));

    if (testId) {
      setParamsLoading(true);
      const loadedParams = await loadTestParameters(testId);
      setFormData((prev) => ({
        ...prev,
        parameters: loadedParams,
      }));
      setParamsLoading(false);
    }
  };

  const handleAddParam = () => {
    setFormData({
      ...formData,
      parameters: [
        ...formData.parameters,
        { parameter_name: '', result_value: '', unit: '', reference_range: '', is_abnormal: false },
      ],
    });
  };

  const handleParamChange = (index, field, value) => {
    const next = [...formData.parameters];
    next[index][field] = value;
    setFormData({ ...formData, parameters: next });
  };

  const handleRemoveParam = (index) => {
    const next = formData.parameters.filter((_, i) => i !== index);
    setFormData({ ...formData, parameters: next });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setUploading(true);

    try {
      const data = new FormData();
      data.append('booking_id', formData.booking_id);
      data.append('test_id', formData.test_id);
      data.append('patient_name', formData.patient_name);
      data.append('report_date', formData.report_date);
      data.append('pathologist_name', formData.pathologist_name);
      data.append('pathologist_qualification', formData.pathologist_qualification);
      data.append('remarks', formData.remarks);
      data.append('parameters', JSON.stringify(formData.parameters));

      if (pdfFile) {
        data.append('pdf', pdfFile);
      }

      await api.post('/reports/upload', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Admin-Request': 'true',
        },
      });

      setIsModalOpen(false);
      setSuccessNotice('Report published successfully! Patient received in-app and email notifications.');
      fetchData();
      setTimeout(() => setSuccessNotice(''), 5000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to upload report.');
    } finally {
      setUploading(false);
    }
  };

  const handleNotifyPatient = async (reportId) => {
    try {
      await api.post(`/reports/${reportId}/notify`, {}, {
        headers: { 'X-Admin-Request': 'true' }
      });
      alert('Notification dispatched successfully to patient via email and in-app alert!');
    } catch (err) {
      alert('Failed to send notification.');
    }
  };

  const handleDownloadReport = (reportId) => {
    const downloadUrl = `http://localhost:5001/api/reports/${reportId}/download?token=${adminToken}`;
    window.open(downloadUrl, '_blank');
  };

  const filteredReports = reports.filter((r) => {
    return (
      r.report_code.toLowerCase().includes(search.toLowerCase()) ||
      r.patient_name.toLowerCase().includes(search.toLowerCase()) ||
      (r.test_name && r.test_name.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const selectedBooking = bookings.find((b) => String(b.id) === String(formData.booking_id));
  const currentBookedTests = getTestsForBooking(selectedBooking, tests, packages);
  const selectedTest = tests.find((t) => String(t.id) === String(formData.test_id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Laboratory Report Management</h2>
          <p className="text-xs text-slate-500">Publish verified PDF laboratory reports and dispatch notifications to patients.</p>
        </div>

        <button
          onClick={handleOpenUploadModal}
          className="px-4 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Upload & Verify Report</span>
        </button>
      </div>

      {successNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search report ID, patient name..."
            className="w-full py-2 pl-9 pr-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
          />
        </div>
      </div>

      {/* Reports Table */}
      {loading ? (
        <LoadingSpinner message="Loading laboratory reports..." />
      ) : (
        <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-4 font-bold">Report ID</th>
                  <th className="py-3 px-4 font-bold">Booking Ref</th>
                  <th className="py-3 px-4 font-bold">Patient Name</th>
                  <th className="py-3 px-4 font-bold">Test Profile</th>
                  <th className="py-3 px-4 font-bold">Verified Date</th>
                  <th className="py-3 px-4 font-bold">Pathologist</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">{r.report_code}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{r.booking_code || '-'}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{r.patient_name}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{r.test_name}</td>
                    <td className="py-3 px-4 text-slate-600">{r.report_date}</td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[140px]">{r.pathologist_name}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={r.report_status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleDownloadReport(r.id)}
                          className="p-1.5 rounded-lg bg-emerald-50 text-[#15803D] hover:bg-emerald-100 transition"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleNotifyPatient(r.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition font-bold text-[11px] flex items-center space-x-1"
                          title="Send Email & App Notification"
                        >
                          <Bell className="w-3.5 h-3.5" />
                          <span>Notify</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload & Generate Report Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Upload / Generate Laboratory Report"
          subtitle="Publish verified diagnostic findings and trigger patient notifications"
          maxWidth="max-w-3xl"
        >
          {errorMsg && (
            <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select Appointment Booking *</label>
                <select
                  required
                  value={formData.booking_id}
                  onChange={(e) => handleBookingSelect(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A] font-medium"
                >
                  <option value="">Select Appointment Booking</option>
                  {bookings.map((b) => {
                    const itemNames = (b.items || [])
                      .map((it) => it?.item_name)
                      .filter(Boolean)
                      .join(', ');
                    return (
                      <option key={b.id} value={b.id}>
                        {b.booking_code} — {b.patient_name} {itemNames ? `[${itemNames}]` : `(${b.appointment_date})`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Select Test Profile *</label>
                  {currentBookedTests.length > 0 && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Auto-Selected from Booking</span>
                    </span>
                  )}
                </div>
                <select
                  required
                  value={formData.test_id}
                  onChange={(e) => handleTestSelect(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A] font-medium"
                >
                  <option value="">Select Test Profile</option>
                  {currentBookedTests.length > 0 && (
                    <optgroup label="⭐ Tests in this Booking (Auto-Selected)">
                      {currentBookedTests.map((t) => (
                        <option key={`booked-${t.id}`} value={t.id}>
                          ✓ {t.test_code ? `${t.test_code} — ` : ''}{t.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label={currentBookedTests.length > 0 ? "All Other Lab Tests" : "All Lab Tests"}>
                    {tests
                      .filter((t) => !currentBookedTests.some((cb) => Number(cb.id) === Number(t.id)))
                      .map((t) => (
                        <option key={`all-${t.id}`} value={t.id}>
                          {t.test_code ? `${t.test_code} — ` : ''}{t.name}
                        </option>
                      ))}
                  </optgroup>
                </select>
                {selectedTest && (
                  <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 pt-0.5">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span className="truncate">Active Profile: <strong className="text-slate-700">{selectedTest.name}</strong></span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Patient Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.patient_name}
                  onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Report Date</label>
                <input
                  type="date"
                  required
                  value={formData.report_date}
                  onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Pathologist Name</label>
                <input
                  type="text"
                  value={formData.pathologist_name}
                  onChange={(e) => setFormData({ ...formData, pathologist_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Remarks</label>
                <input
                  type="text"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>
            </div>

            {/* Optional PDF File Upload */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-700">Upload PDF File (Optional - Will auto-generate if left empty)</label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setPdfFile(e.target.files[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-[#15803D] hover:file:bg-emerald-100"
              />
            </div>

            {/* Parameter Results Table */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <div>
                  <label className="font-bold text-slate-700">Digital Report Parameters</label>
                  {paramsLoading ? (
                    <span className="ml-2 text-[11px] text-[#16A34A] font-semibold animate-pulse">
                      Loading clinical parameter template...
                    </span>
                  ) : (
                    <span className="ml-2 text-[11px] text-slate-500 font-medium">
                      ({formData.parameters.length} parameter{formData.parameters.length !== 1 ? 's' : ''} auto-loaded)
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleTestSelect(formData.test_id)}
                    title="Reload official template"
                    className="text-[11px] text-slate-500 hover:text-slate-800 font-medium underline"
                  >
                    Reset Template
                  </button>
                  <button
                    type="button"
                    onClick={handleAddParam}
                    className="text-xs text-[#16A34A] font-bold hover:underline"
                  >
                    + Add Parameter
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {formData.parameters.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Parameter"
                      value={p.parameter_name}
                      onChange={(e) => handleParamChange(idx, 'parameter_name', e.target.value)}
                      className="flex-1 p-2 rounded-lg border border-slate-200"
                    />
                    <input
                      type="text"
                      placeholder="Result"
                      value={p.result_value}
                      onChange={(e) => handleParamChange(idx, 'result_value', e.target.value)}
                      className="w-24 p-2 rounded-lg border border-slate-200 font-bold"
                    />
                    <input
                      type="text"
                      placeholder="Unit"
                      value={p.unit}
                      onChange={(e) => handleParamChange(idx, 'unit', e.target.value)}
                      className="w-20 p-2 rounded-lg border border-slate-200"
                    />
                    <input
                      type="text"
                      placeholder="Reference Range"
                      value={p.reference_range}
                      onChange={(e) => handleParamChange(idx, 'reference_range', e.target.value)}
                      className="w-32 p-2 rounded-lg border border-slate-200"
                    />
                    <label className="flex items-center space-x-1 text-[11px] text-rose-600 font-bold whitespace-nowrap cursor-pointer">
                      <input
                        type="checkbox"
                        checked={p.is_abnormal}
                        onChange={(e) => handleParamChange(idx, 'is_abnormal', e.target.checked)}
                        className="accent-rose-600"
                      />
                      <span>Abnormal</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-xl shadow-md transition flex items-center space-x-2"
              >
                <FileCheck className="w-4 h-4" />
                <span>{uploading ? 'Processing & Notifying...' : 'Mark Report Ready ✓'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
