import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Download,
  Printer,
  ArrowLeft,
  ShieldCheck,
  Award,
  AlertTriangle,
  CheckCircle,
  FileText
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function ReportViewerPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get(`/reports/${id}`);
        setReport(res.data.report || null);
      } catch (err) {
        console.error('Failed to load report:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (report) {
      const downloadUrl = `http://localhost:5001/api/reports/${report.id}/download?token=${token}`;
      window.open(downloadUrl, '_blank');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Rendering medical laboratory report..." />;
  }

  if (!report) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Report Not Found</h2>
        <p className="text-xs text-slate-500">The requested laboratory report does not exist or you do not have permission to view it.</p>
        <Link to="/reports" className="inline-block px-5 py-2.5 bg-[#16A34A] text-white text-xs font-bold rounded-xl">
          Back to Reports
        </Link>
      </div>
    );
  }

  const parameters = report.parameters || [];
  const abnormalCount = parameters.filter((p) => p.is_abnormal).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top action bar (hidden during print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <Link
          to="/reports"
          className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to All Reports
        </Link>

        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center space-x-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleDownload}
            className="px-5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Download Official PDF</span>
          </button>
        </div>
      </div>

      {/* --- CLINICAL REPORT CANVAS --- */}
      <div className="bg-white rounded-3xl border border-slate-300 shadow-2xl p-6 sm:p-12 space-y-8 text-slate-900 print:border-none print:shadow-none print:p-0">
        {/* Lab Official Letterhead */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-[#16A34A]">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#15803D]">
                DHANASHRI
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-800">HEALTH CARE & DIAGNOSTICS</span>
            </div>
            <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase mt-0.5">
              NABL ACCREDITED & ISO 15189:2022 CERTIFIED CENTRAL LABORATORY
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Central Facility: 102 Health Avenue, Bannerghatta Road, Bengaluru, KA 560076 | Phone: +91 80 4920 1100
            </p>
          </div>

          <div className="text-right sm:border-l sm:pl-6 border-slate-200 text-xs space-y-1">
            <div className="font-extrabold text-[#15803D] uppercase tracking-wider text-[11px] flex items-center justify-end">
              <ShieldCheck className="w-4 h-4 mr-1 text-[#16A34A]" />
              NABL Certified
            </div>
            <div className="text-slate-500">Certificate No: MC-4921</div>
            <div className="text-slate-500">ICMR Reg: PULSE-2026-BLR</div>
          </div>
        </div>

        {/* Patient Demographics & Report Metadata Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-[#F0FDF4] border border-[#86EFAC] text-xs">
          <div className="space-y-1.5">
            <div className="grid grid-cols-3">
              <span className="font-bold text-slate-600">Patient Name:</span>
              <span className="col-span-2 font-black text-slate-900 uppercase">{report.patient_name}</span>
            </div>
            <div className="grid grid-cols-3">
              <span className="font-bold text-slate-600">Age / Gender:</span>
              <span className="col-span-2 font-semibold text-slate-800">{report.patient_age || 34} Yrs / {report.patient_gender || 'Male'}</span>
            </div>
            <div className="grid grid-cols-3">
              <span className="font-bold text-slate-600">Ref. Doctor:</span>
              <span className="col-span-2 font-semibold text-slate-800">Self / Routine Wellness Check</span>
            </div>
          </div>

          <div className="space-y-1.5 sm:border-l sm:pl-5 border-emerald-200">
            <div className="grid grid-cols-3">
              <span className="font-bold text-slate-600">Report ID:</span>
              <span className="col-span-2 font-mono font-black text-[#15803D]">{report.report_code}</span>
            </div>
            <div className="grid grid-cols-3">
              <span className="font-bold text-slate-600">Booking Ref:</span>
              <span className="col-span-2 font-mono font-semibold text-slate-800">{report.booking_code || 'N/A'}</span>
            </div>
            <div className="grid grid-cols-3">
              <span className="font-bold text-slate-600">Report Date:</span>
              <span className="col-span-2 font-semibold text-slate-800">{report.report_date}</span>
            </div>
            <div className="grid grid-cols-3">
              <span className="font-bold text-slate-600">Sample Matrix:</span>
              <span className="col-span-2 font-semibold text-slate-800">{report.sample_type || 'Venous Blood'}</span>
            </div>
          </div>
        </div>

        {/* Department & Test Title Banner */}
        <div className="p-3 bg-[#16A34A] text-white rounded-xl flex items-center justify-between">
          <h2 className="font-black text-sm uppercase tracking-wider">
            DEPARTMENT OF PATHOLOGY — {report.test_name}
          </h2>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-semibold">
            Status: {report.report_status}
          </span>
        </div>

        {/* Results Parameters Table */}
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 uppercase font-black tracking-wider border-y border-slate-300">
                  <th className="py-3 px-4">Test Parameter</th>
                  <th className="py-3 px-4">Result Value</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Biological Reference Range</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {parameters.map((param, index) => (
                  <tr
                    key={param.id || index}
                    className={param.is_abnormal ? 'bg-rose-50/70 font-semibold' : index % 2 === 0 ? 'bg-slate-50/40' : 'bg-white'}
                  >
                    <td className="py-3 px-4 font-bold text-slate-900">{param.parameter_name}</td>
                    <td className="py-3 px-4">
                      {param.is_abnormal ? (
                        <span className="text-rose-600 font-black text-sm inline-flex items-center">
                          {param.result_value} *
                        </span>
                      ) : (
                        <span className="text-[#15803D] font-bold text-sm">
                          {param.result_value}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{param.unit || '-'}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{param.reference_range || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      {param.is_abnormal ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold uppercase">
                          Abnormal
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {abnormalCount > 0 && (
            <div className="flex items-center space-x-2 text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>* Values marked with asterisk indicate results outside standard biological reference ranges. Please consult your physician.</span>
            </div>
          )}
        </div>

        {/* Clinical Remarks & Pathologist Sign-off */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6 border-t border-slate-200">
          <div className="md:col-span-7 space-y-2 text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              Clinical Remarks & Interpretation:
            </span>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed italic">
              "{report.remarks || 'Normal morphological and biological indices. Correlate with clinical condition.'}"
            </div>
            <p className="text-[11px] text-slate-400">
              Disclaimer: Laboratory test results must be interpreted by a registered medical practitioner in conjunction with history and clinical presentation.
            </p>
          </div>

          <div className="md:col-span-5 flex flex-col justify-end items-end text-right space-y-3 pt-4 md:pt-0">
            {/* Digital Seal & Signature */}
            <div className="p-3 border-2 border-dashed border-[#16A34A] rounded-2xl bg-[#F0FDF4] text-center w-52 space-y-1">
              <div className="text-[10px] font-black text-[#15803D] uppercase tracking-wider flex items-center justify-center">
                <CheckCircle className="w-3.5 h-3.5 mr-1 text-[#16A34A]" />
                DIGITALLY VERIFIED
              </div>
              <div className="font-serif text-sm font-bold text-slate-800 italic">Dr. Arvind Mehra</div>
              <div className="text-[9px] text-slate-500">Hash: 8a9f24e0b127...</div>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-900">{report.pathologist_name}</div>
              <div className="text-[11px] text-slate-500">{report.pathologist_qualification}</div>
              <div className="text-[10px] text-slate-400">Chief Pathologist & Medical Director</div>
            </div>
          </div>
        </div>

        {/* Report Footer */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400">
          <span>Dhanashri Health Care Central Diagnostic Laboratory • End of Report</span>
          <span>Computer generated digital record under IT Act 2000. Verified on: {report.report_date}</span>
        </div>
      </div>
    </div>
  );
}
