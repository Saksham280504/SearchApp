// src/Pages/UploadPage.jsx
// Phase 4/5 Refinement — Dataset Multi-File Upload

import { useState, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { API_BASE_URL } from "../../redux/config";

const STEP = { SELECT: 1, PREVIEW: 2, METADATA: 3, CONFIRM: 4, DONE: 5 };

export default function UploadPage() {
  const { user } = useSelector((s) => s.auth);
  const fileInputRef = useRef(null);
  
  const [step, setStep] = useState(STEP.SELECT);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  
  // State
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewData, setPreviewData] = useState([]); // array of file previews from server
  
  // Metadata form
  const [datasetName, setDatasetName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [river, setRiver] = useState("");
  const [samplingDate, setSamplingDate] = useState("");
  
  const [importResult, setImportResult] = useState(null);

  // ── 1. Select files (Folder or multi-file) ──────────────────────────
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  // ── 2. Upload for preview ──────────────────────────────────────────
  const handleUploadPreview = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setError("");

    const formData = new FormData();
    selectedFiles.forEach(f => formData.append("files", f));

    try {
      const res = await axios.post(`${API_BASE_URL}/api/upload/preview`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPreviewData(res.data.files || []);
      setStep(STEP.PREVIEW);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to upload files for preview.");
    } finally {
      setUploading(false);
    }
  };

  // ── 3. Confirm Import ──────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!datasetName.trim()) { setError("Dataset name is required."); return; }
    setConfirming(true);
    setError("");

    // Prepare files array
    const validFiles = previewData.filter(f => f.isValid && !f.isDuplicate).map(f => ({
      tempFilename: f.tempFilename,
      originalName: f.originalName,
      stationCode: f.detectedStation
    }));

    if (validFiles.length === 0) {
      setError("No valid files to import.");
      setConfirming(false);
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/api/upload/confirm`, {
        datasetName, description, location, river, samplingDate,
        files: validFiles
      });
      setImportResult(res.data);
      setStep(STEP.DONE);
    } catch (err) {
      setError(err.response?.data?.error || "Import failed.");
    } finally {
      setConfirming(false);
    }
  };

  // ── Cancel ─────────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (previewData.length > 0) {
      try {
        await axios.delete(`${API_BASE_URL}/api/upload/cancel`, {
          data: { files: previewData.map(f => f.tempFilename) }
        });
      } catch (e) {}
    }
    setStep(STEP.SELECT);
    setSelectedFiles([]);
    setPreviewData([]);
    setError("");
  };

  const validCount = previewData.filter(f => f.isValid && !f.isDuplicate).length;

  return (
    <main style={{ minHeight: "calc(100vh - 104px)", background: "#FAF8F3", padding: "40px 20px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#C8972A", marginBottom: 8 }}>
            Data Import
          </p>
          <h1 style={{ fontFamily: "'EB Garamond',serif", fontSize: 32, color: "#003087", fontWeight: 700, marginBottom: 8 }}>
            Upload Dataset
          </h1>
          <p style={{ color: "#666", fontSize: 15 }}>Import multiple files as a single dataset.</p>
        </div>

        {error && (
          <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.06)", color: "#b91c1c", fontSize: 14, marginBottom: 20 }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── STEP 1: SELECT FILES ── */}
        {step === STEP.SELECT && (
          <div style={{ background: "#fff", padding: 30, borderRadius: 16, boxShadow: "0 8px 30px rgba(0,48,135,0.06)" }}>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragging ? "#003087" : "#cbd5e1"}`,
                borderRadius: 12, padding: "60px 20px", textAlign: "center",
                background: dragging ? "rgba(0,48,135,0.02)" : "#fafafa",
                transition: "all 0.2s"
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
              <h3 style={{ fontSize: 18, color: "#003087", fontWeight: 700, marginBottom: 8 }}>Select Folder or Files</h3>
              <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>
                Upload multiple .xlsx or .txt files. They will be grouped into one Dataset.
              </p>
              
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button
                  onClick={() => { fileInputRef.current.removeAttribute("webkitdirectory"); fileInputRef.current.click(); }}
                  style={{ background: "#10385e", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 }}
                >
                  Select Files
                </button>
                <button
                  onClick={() => { fileInputRef.current.setAttribute("webkitdirectory", ""); fileInputRef.current.click(); }}
                  style={{ background: "#C8972A", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 }}
                >
                  Select Folder
                </button>
              </div>
              <input
                type="file"
                multiple
                accept=".xlsx,.txt"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />
            </div>

            {selectedFiles.length > 0 && (
              <div style={{ marginTop: 20, textAlign: "center" }}>
                <p style={{ fontWeight: 600, color: "#10385e", marginBottom: 16 }}>{selectedFiles.length} files selected</p>
                <button
                  onClick={handleUploadPreview}
                  disabled={uploading}
                  style={{ background: "#0a6a8b", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 8, cursor: "pointer", fontSize: 15, fontWeight: 600, width: "100%" }}
                >
                  {uploading ? "Uploading & Validating…" : "Next: Preview & Validate"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: PREVIEW ── */}
        {step === STEP.PREVIEW && (
          <div style={{ background: "#fff", padding: 30, borderRadius: 16, boxShadow: "0 8px 30px rgba(0,48,135,0.06)" }}>
            <h2 style={{ fontSize: 20, color: "#10385e", fontWeight: 700, marginBottom: 16 }}>File Validation</h2>
            
            <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 8, marginBottom: 20 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead style={{ background: "#f8fafc", position: "sticky", top: 0 }}>
                  <tr>
                    <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569" }}>File</th>
                    <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569" }}>Station</th>
                    <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569" }}>Rows</th>
                    <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((f, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #e2e8f0", background: !f.isValid || f.isDuplicate ? "#fef2f2" : "#fff" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 500 }}>{f.originalName}</td>
                      <td style={{ padding: "10px 14px" }}>{f.detectedStation || "—"}</td>
                      <td style={{ padding: "10px 14px" }}>{f.totalRows}</td>
                      <td style={{ padding: "10px 14px" }}>
                        {f.isDuplicate ? <span style={{ color: "#dc2626" }}>Duplicate</span> :
                         !f.isValid ? <span style={{ color: "#dc2626" }}>Invalid</span> :
                         <span style={{ color: "#16a34a" }}>Valid</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={handleCancel} style={{ padding: "10px 20px", borderRadius: 8, background: "#f1f5f9", border: "none", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
              <button
                onClick={() => setStep(STEP.METADATA)}
                disabled={validCount === 0}
                style={{ padding: "10px 20px", borderRadius: 8, background: "#10385e", color: "#fff", border: "none", cursor: validCount === 0 ? "not-allowed" : "pointer", fontWeight: 600, opacity: validCount === 0 ? 0.6 : 1 }}
              >
                Proceed with {validCount} files
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: METADATA & CONFIRM ── */}
        {step === STEP.METADATA && (
          <div style={{ background: "#fff", padding: 30, borderRadius: 16, boxShadow: "0 8px 30px rgba(0,48,135,0.06)" }}>
            <h2 style={{ fontSize: 20, color: "#10385e", fontWeight: 700, marginBottom: 20 }}>Dataset Metadata</h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
              <label style={labelStyle}>
                <span style={labelText}>Dataset Name <span style={{ color: "#dc2626" }}>*</span></span>
                <input value={datasetName} onChange={e => setDatasetName(e.target.value)} placeholder="e.g. Sabarmati HRMS 2024" style={inputStyle} />
              </label>
              <label style={labelStyle}>
                <span style={labelText}>Location / Region</span>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Gujarat, India" style={inputStyle} />
              </label>
              <label style={labelStyle}>
                <span style={labelText}>River System</span>
                <input value={river} onChange={e => setRiver(e.target.value)} placeholder="e.g. Sabarmati" style={inputStyle} />
              </label>
              <label style={labelStyle}>
                <span style={labelText}>Sampling Date (General)</span>
                <input type="date" value={samplingDate} onChange={e => setSamplingDate(e.target.value)} style={inputStyle} />
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => setStep(STEP.PREVIEW)} style={{ padding: "10px 20px", borderRadius: 8, background: "#f1f5f9", border: "none", cursor: "pointer", fontWeight: 600 }}>Back</button>
              <button
                onClick={handleConfirm}
                disabled={confirming || !datasetName.trim()}
                style={{ padding: "10px 20px", borderRadius: 8, background: "#10385e", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}
              >
                {confirming ? "Importing Dataset…" : `Import ${validCount} Files`}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: DONE ── */}
        {step === STEP.DONE && importResult && (
          <div style={{ background: "#fff", padding: 40, borderRadius: 16, boxShadow: "0 8px 30px rgba(0,48,135,0.06)", textAlign: "center" }}>
            <div style={{ fontSize: 64, color: "#16a34a", marginBottom: 20 }}>✓</div>
            <h2 style={{ fontSize: 24, color: "#10385e", fontWeight: 700, marginBottom: 12 }}>Dataset Imported</h2>
            <p style={{ color: "#475569", marginBottom: 8 }}>{importResult.processedCount} files successfully processed.</p>
            <p style={{ color: "#475569", marginBottom: 24 }}>{importResult.totalInserted} total observations indexed.</p>
            
            <button
              onClick={() => { setStep(STEP.SELECT); setSelectedFiles([]); setPreviewData([]); setDatasetName(""); }}
              style={{ padding: "12px 24px", borderRadius: 8, background: "#10385e", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}
            >
              Upload Another Dataset
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

const labelStyle = { display: "flex", flexDirection: "column", gap: 6 };
const labelText = { fontSize: 13, fontWeight: 600, color: "#374151" };
const inputStyle = { padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, outline: "none", background: "#fff" };
