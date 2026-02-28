import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Edit } from "lucide-react";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import API from "../../../api/axios";

const AdminStaff = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const urlPage = parseInt(queryParams.get("page")) || 1;

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pagination, setPagination] = useState({
    currentPage: urlPage,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });

  const basePath = `/${location.pathname.split("/")[1]}`;

  useEffect(() => {
    if (urlPage !== pagination.currentPage) {
      setPagination((prev) => ({ ...prev, currentPage: urlPage }));
    }
  }, [urlPage]);

  useEffect(() => {
    fetchStaff(pagination.currentPage);
  }, [pagination.currentPage]);

  const fetchStaff = async (page) => {
    setLoading(true);
    try {
      const res = await API.get(`api/hotels/staff-list/paginated`, {
        params: { page: page, limit: 10 },
      });

      if (res.data.success) {
        setStaffList(res.data.staff);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Failed to load staff members");
    } finally {
      setLoading(false);
    }
  };

  const handlePageClick = (pageNum) => {
    navigate(`${location.pathname}?page=${pageNum}`);
  };

  const downloadExcel = () => {
    const dataToExport = staffList.map((s) => ({
      ID: s.id,
      Full_Name: s.username,
      Email: s.email,
      Mobile_Number: s.phone,
      Assigned_Hotel: s.hotel_name || "Unassigned",
      Status: s.status || "pending",
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Staff_Directory");
    XLSX.writeFile(
      workbook,
      `Staff_Directory_Page_${pagination.currentPage}.xlsx`,
    );
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text(`Staff Directory Report - Page ${pagination.currentPage}`, 14, 15);
    const tableColumn = ["ID", "Name", "Email", "Phone", "Hotel", "Status"];
    const tableRows = staffList.map((s) => [
      s.id,
      s.username,
      s.email,
      s.phone,
      s.hotel_name || "Unassigned",
      s.status || "pending",
    ]);
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    doc.save(`Staff_Report_Page_${pagination.currentPage}.pdf`);
  };

  return (
    <div className="admin-container">
      <div className="table-wrapper boxed-layout">
        <div className="table-header" style={{ flexWrap: "wrap", gap: "1rem" }}>
          <div className="title-section">
            <h2>Staff Management</h2>
            <p>Manage access for hotel personnel (Server-side)</p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={downloadExcel}
              className="add-btn"
              style={{
                backgroundColor: "#10b981",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <FaFileExcel size={16} /> Excel
            </button>
            <button
              onClick={downloadPDF}
              className="add-btn"
              style={{
                backgroundColor: "#ef4444",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <FaFilePdf size={16} /> PDF
            </button>
            <button
              onClick={() => navigate(`${basePath}/staff/add`)}
              className="add-btn"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={16} /> Add Staff
            </button>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style={{ width: "60px" }}>ID</th>
              <th>Full Name</th>
              <th>Email Address</th>
              <th>Mobile Number</th>
              <th>Assigned Hotel</th>
              <th>Verification Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="status-cell">
                  Loading personnel records...
                </td>
              </tr>
            ) : staffList.length === 0 ? (
              <tr>
                <td colSpan="7" className="status-cell">
                  No staff members found.
                </td>
              </tr>
            ) : (
              staffList.map((s) => (
                <tr key={s.id}>
                  <td className="font-mono" style={{ fontSize: "0.85rem" }}>
                    #{s.id}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{s.username}</span>
                  </td>
                  <td style={{ fontSize: "0.85rem" }}>{s.email}</td>
                  <td style={{ fontSize: "0.85rem" }}>{s.phone}</td>
                  <td>
                    {s.hotel_name || (
                      <span className="muted">Not Assigned</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${s.status === "active" ? "online" : "offline"}`}
                    >
                      {s.status || "pending"}
                    </span>
                  </td>
                  <td className="action-cell">
                    <div className="action-group">
                      <button
                        onClick={() =>
                          navigate(`${basePath}/staff/edit/${s.id}`, {
                            state: { staffMember: s },
                          })
                        }
                        className="edit-btn"
                        title="Edit Details"
                      >
                        <Edit size={16} /> Edit
                      </button>
                    </div>
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
              of <span>{pagination.totalItems}</span> members
            </div>
            <div className="pagination-controls">
              <button
                disabled={pagination.currentPage === 1}
                onClick={() => handlePageClick(pagination.currentPage - 1)}
              >
                Prev
              </button>
              {Array.from(
                { length: pagination.totalPages },
                (_, i) => i + 1,
              ).map((n) => (
                <button
                  key={n}
                  className={pagination.currentPage === n ? "active" : ""}
                  onClick={() => handlePageClick(n)}
                >
                  {n}
                </button>
              ))}
              <button
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => handlePageClick(pagination.currentPage + 1)}
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

export default AdminStaff;
