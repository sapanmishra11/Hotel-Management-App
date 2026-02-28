import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../../../api/axios";
import { toast } from "react-toastify";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./AdminLogs.scss";

const AdminLogs = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const urlPage = parseInt(queryParams.get("page")) || 1;

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [logFilter, setLogFilter] = useState("all");
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString(),
  );

  const [pagination, setPagination] = useState({
    currentPage: urlPage,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });

  const yearOptions = Array.from({ length: 5 }, (_, i) =>
    (new Date().getFullYear() - i).toString(),
  );

  useEffect(() => {
    if (urlPage !== pagination.currentPage) {
      setPagination((prev) => ({ ...prev, currentPage: urlPage }));
    }
  }, [urlPage]);

  useEffect(() => {
    fetchLogs(pagination.currentPage);
  }, [pagination.currentPage, logFilter, selectedYear]);

  const fetchLogs = async (page) => {
    setLoading(true);
    try {
      const res = await API.get(`api/bookings/admin/logs/paginated`, {
        params: {
          page: page,
          limit: 10,
          status: logFilter !== "all" ? logFilter : undefined,
          year: selectedYear,
        },
      });

      if (res.data.success) {
        setLogs(res.data.logs);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
      toast.error("Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  const fetchFullReportData = async () => {
    try {
      const res = await API.get(`api/bookings/admin/logs/report`, {
        params: {
          status: logFilter !== "all" ? logFilter : undefined,
          year: selectedYear,
        },
      });
      if (res.data.success) {
        return res.data.logs;
      }
      return [];
    } catch (err) {
      console.error("Error fetching full report:", err);
      toast.error("Failed to generate full report");
      return null;
    }
  };

  const downloadPDF = async () => {
    setIsDownloading(true);
    const fullLogs = await fetchFullReportData();

    if (!fullLogs) {
      setIsDownloading(false);
      return;
    }

    if (fullLogs.length === 0) {
      toast.info("No records found for this filter to download.");
      setIsDownloading(false);
      return;
    }

    const doc = new jsPDF();
    doc.text(`Hotel Booking Report: ${selectedYear} (${logFilter})`, 14, 15);

    const tableColumn = [
      "#",
      "Hotel",
      "Check In",
      "Check Out",
      "Total",
      "Status",
    ];
    let grandTotal = 0;

    const tableRows = fullLogs.map((log, index) => {
      grandTotal += Number(log.total_price) || 0;
      return [
        index + 1,
        log.hotel_name,
        new Date(log.check_in_date).toLocaleDateString(),
        new Date(log.check_out_date).toLocaleDateString(),
        `Rs. ${log.total_price}`,
        log.booking_status,
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      foot: [["", "", "", "GRAND TOTAL", `Rs. ${grandTotal.toFixed(2)}`, ""]],
      footStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
    });

    doc.save(`Full_Report_${selectedYear}_${logFilter}.pdf`);
    setIsDownloading(false);
  };

  const downloadExcel = async () => {
    setIsDownloading(true);
    const fullLogs = await fetchFullReportData();

    if (!fullLogs) {
      setIsDownloading(false);
      return;
    }

    if (fullLogs.length === 0) {
      toast.info("No records found for this filter to download.");
      setIsDownloading(false);
      return;
    }

    let grandTotal = 0;
    const dataToExport = fullLogs.map((log, index) => {
      grandTotal += Number(log.total_price) || 0;
      return {
        "S.No": index + 1,
        Hotel: log.hotel_name,
        Check_In: new Date(log.check_in_date).toLocaleDateString(),
        Check_Out: new Date(log.check_out_date).toLocaleDateString(),
        Total: log.total_price,
        Status: log.booking_status,
        Year: selectedYear,
      };
    });

    dataToExport.push({});
    dataToExport.push({
      "S.No": "",
      Hotel: "GRAND TOTAL SALES",
      Check_In: "",
      Check_Out: "",
      Total: grandTotal.toFixed(2),
      Status: `Total Records: ${fullLogs.length}`,
      Year: "",
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");
    XLSX.writeFile(workbook, `Full_Report_${selectedYear}_${logFilter}.xlsx`);
    setIsDownloading(false);
  };

  const handleFilterChange = (e) => {
    setLogFilter(e.target.value);
    navigate(`${location.pathname}?page=1`);
  };

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
    navigate(`${location.pathname}?page=1`);
  };

  const paginate = (pageNumber) => {
    navigate(`${location.pathname}?page=${pageNumber}`);
  };

  return (
    <div className="admin-container">
      <div className="table-wrapper boxed-layout">
        <div
          className="table-header"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            padding: "1.5rem",
          }}
        >
          <div className="title-section" style={{ width: "100%" }}>
            <h2
              style={{
                margin: 0,
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "#1e293b",
              }}
            >
              Booking Logs
            </h2>
            <p
              style={{
                margin: "5px 0 0",
                fontSize: "0.85rem",
                color: "#64748b",
              }}
            >
              Review operational records
            </p>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              width: "100%",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                <label
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "#64748b",
                    textTransform: "uppercase",
                  }}
                >
                  Status Filter
                </label>
                <select
                  value={logFilter}
                  onChange={handleFilterChange}
                  style={{
                    padding: "0.6rem",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    minWidth: "150px",
                  }}
                >
                  <option value="all">All Records</option>
                  <option value="pending">Pending</option>
                  <option value="checked_in">Checked In</option>
                  <option value="checked_out">Checked Out</option>
                </select>
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                <label
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "#64748b",
                    textTransform: "uppercase",
                  }}
                >
                  Report Year
                </label>
                <select
                  value={selectedYear}
                  onChange={handleYearChange}
                  style={{
                    padding: "0.6rem",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    minWidth: "120px",
                  }}
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={downloadExcel}
                className="add-btn"
                disabled={isDownloading}
                style={{
                  backgroundColor: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  opacity: isDownloading ? 0.7 : 1,
                  cursor: isDownloading ? "not-allowed" : "pointer",
                }}
              >
                <FaFileExcel size={16} />{" "}
                {isDownloading ? "Fetching..." : "Excel (Report)"}
              </button>
              <button
                onClick={downloadPDF}
                className="add-btn"
                disabled={isDownloading}
                style={{
                  backgroundColor: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  opacity: isDownloading ? 0.7 : 1,
                  cursor: isDownloading ? "not-allowed" : "pointer",
                }}
              >
                <FaFilePdf size={16} />{" "}
                {isDownloading ? "Fetching..." : "PDF (Report)"}
              </button>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Property Details</th>
              <th>Stay Dates</th>
              <th>Booking Date</th>
              <th>Total Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="status-cell">
                  Loading logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="5" className="status-cell">
                  No records found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <span style={{ fontWeight: 600 }}>{log.hotel_name}</span>
                  </td>
                  <td>
                    <div className="hotel-cell">
                      <span className="hotel-name">
                        In: {new Date(log.check_in_date).toLocaleDateString()}
                      </span>
                      <span className="hotel-id">
                        Out: {new Date(log.check_out_date).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="location-text muted">
                      {new Date(log.created_at).toLocaleString([], {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, fontFamily: "monospace" }}>
                      ₹{log.total_price}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${log.booking_status === "pending" ? "offline" : "online"}`}
                    >
                      {log.booking_status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!loading && pagination.totalItems > 0 && (
          <div className="pagination-footer">
            <div className="entries-info">
              Showing{" "}
              <span>{(pagination.currentPage - 1) * pagination.limit + 1}</span>{" "}
              to{" "}
              <span>
                {Math.min(
                  pagination.currentPage * pagination.limit,
                  pagination.totalItems,
                )}
              </span>{" "}
              of <span>{pagination.totalItems}</span> records
            </div>
            <div className="pagination-controls">
              <button
                disabled={pagination.currentPage === 1}
                onClick={() => paginate(pagination.currentPage - 1)}
              >
                Previous
              </button>

              {Array.from(
                { length: pagination.totalPages },
                (_, i) => i + 1,
              ).map((num) => (
                <button
                  key={num}
                  className={pagination.currentPage === num ? "active" : ""}
                  onClick={() => paginate(num)}
                >
                  {num}
                </button>
              ))}

              <button
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => paginate(pagination.currentPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogs;
