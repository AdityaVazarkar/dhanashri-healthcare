import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, Eye, Calendar, ShieldCheck, Clock } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

export default function UserReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports/my-reports');
      setReports(res.data.reports || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (report) => {
    // Authenticated download endpoint
    const downloadUrl = `http://localhost:5001/api/reports/${report.id}/download?token=${token}`;
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">
            Diagnostic Records
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            My Medical & Laboratory Reports
          </h1>
          <p className="text-xs text-slate-500">
            View, download and share verified pathology and blood test reports signed by MD Pathologists.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-800 bg-[#DCFCE7] px-3 py-1.5 rounded-xl border border-emerald-300">
          <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
          <span>NABL Verified Digitally</span>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching your verified reports..." />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No laboratory reports available yet"
          description="Once your blood samples are collected and verified by our pathologists, your verified digital reports will appear here."
          actionLabel="Book a Test"
          actionLink="/tests"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div
              key={report.id}
              className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm hover:border-emerald-300 transition space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {report.report_code}
                  </span>
                  <StatusBadge status={report.report_status} />
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 line-clamp-1">
                    {report.test_name || 'Complete Diagnostic Report'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Patient: <strong className="text-slate-700">{report.patient_name}</strong>
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Verified Date:</span>
                    <span className="font-semibold text-slate-800">{report.report_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pathologist:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[150px]">{report.pathologist_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Biomarkers:</span>
                    <span className="font-semibold text-slate-800">{report.parameter_count || 14} Evaluated</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                <Link
                  to={`/reports/${report.id}`}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition text-center flex items-center justify-center space-x-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Report</span>
                </Link>

                <button
                  onClick={() => handleDownload(report)}
                  className="px-4 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
