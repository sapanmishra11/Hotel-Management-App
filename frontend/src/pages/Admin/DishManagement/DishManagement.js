import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, XCircle, CheckCircle } from "lucide-react";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import API from "../../../api/axios";

const DishManager = () => {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const urlPage = parseInt(queryParams.get("page")) || 1;

  const pathParts = location.pathname.split("/");
  const basePath = `/${pathParts[1]}`;

  const [pagination, setPagination] = useState({
    currentPage: urlPage,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });

  useEffect(() => {
    if (urlPage !== pagination.currentPage) {
      setPagination((prev) => ({ ...prev, currentPage: urlPage }));
    }
  }, [urlPage]);

  useEffect(() => {
    fetchGlobalDishes(pagination.currentPage);
  }, [pagination.currentPage]);

  const fetchGlobalDishes = async (page) => {
    setLoading(true);
    try {
      const res = await API.get("api/hotels/global-dishes/paginated", {
        params: {
          page: page,
          limit: 10,
        },
      });

      if (res.data.success) {
        setDishes(res.data.dishes);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error("Error fetching global dishes:", err);
      toast.error("Failed to load dish catalog");
    } finally {
      setLoading(false);
    }
  };

  const fetchFullReportData = async () => {
    try {
      const res = await API.get("api/hotels/global-dishes/report");
      if (res.data.success) {
        return res.data.dishes;
      }
      return [];
    } catch (err) {
      console.error("Error fetching full report:", err);
      toast.error("Failed to fetch complete dish list");
      return null;
    }
  };

  const downloadExcel = async () => {
    setIsProcessing(true);
    const fullDishes = await fetchFullReportData();

    if (fullDishes && fullDishes.length > 0) {
      const dataToExport = fullDishes.map((dish, index) => ({
        "S.No": index + 1,
        ID: dish.id,
        Dish_Name: dish.dish_name,
        Dietary_Type: dish.dietary_type,
        Status: dish.status,
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Global_Dishes");
      XLSX.writeFile(workbook, `Full_Dish_Catalog_Report.xlsx`);
    } else if (fullDishes) {
      toast.info("No records found to export.");
    }
    setIsProcessing(false);
  };

  const downloadPDF = async () => {
    setIsProcessing(true);
    const fullDishes = await fetchFullReportData();

    if (fullDishes && fullDishes.length > 0) {
      const doc = new jsPDF();
      doc.text(`Full Global Dish Directory Report`, 14, 15);

      const tableColumn = ["#", "ID", "Dish Name", "Dietary Type", "Status"];
      const tableRows = fullDishes.map((dish, index) => [
        index + 1,
        dish.id,
        dish.dish_name,
        dish.dietary_type,
        dish.status,
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        theme: "striped",
      });

      doc.save(`Full_Dish_Catalog_Report.pdf`);
    } else if (fullDishes) {
      toast.info("No records found to export.");
    }
    setIsProcessing(false);
  };

  const handlePageClick = (pageNum) => {
    navigate(`${location.pathname}?page=${pageNum}`);
  };

  const toggleDishStatus = async (dishId, dishName, currentStatus) => {
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    setIsProcessing(true);
    try {
      await API.patch(`api/hotels/global-dishes/status/${dishId}`, {
        status: nextStatus,
      });
      toast.success(`${dishName} is now ${nextStatus}`);
      fetchGlobalDishes(pagination.currentPage);
    } catch (err) {
      toast.error("Failed to update dish status");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="table-wrapper boxed-layout">
        <div className="table-header" style={{ flexWrap: "wrap", gap: "1rem" }}>
          <div className="title-section">
            <h2>Dish Directory</h2>
            <p>Manage the master catalog</p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={downloadExcel}
              className="add-btn"
              disabled={isProcessing}
              style={{
                backgroundColor: "#10b981",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                opacity: isProcessing ? 0.7 : 1,
                cursor: isProcessing ? "not-allowed" : "pointer",
              }}
            >
              <FaFileExcel size={16} /> {isProcessing ? "Fetching..." : "Excel"}
            </button>
            <button
              onClick={downloadPDF}
              className="add-btn"
              disabled={isProcessing}
              style={{
                backgroundColor: "#ef4444",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                opacity: isProcessing ? 0.7 : 1,
                cursor: isProcessing ? "not-allowed" : "pointer",
              }}
            >
              <FaFilePdf size={16} /> {isProcessing ? "Fetching..." : "PDF"}
            </button>
            <button
              onClick={() => navigate(`${basePath}/hotels/dishes/add`)}
              className="add-btn"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={16} /> Add Global Dish
            </button>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Dish Details</th>
              <th>Dietary Type</th>
              <th>Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="status-cell">
                  Loading dish catalog...
                </td>
              </tr>
            ) : dishes.length === 0 ? (
              <tr>
                <td colSpan="4" className="status-cell">
                  No dishes found.
                </td>
              </tr>
            ) : (
              dishes.map((dish) => (
                <tr key={dish.id}>
                  <td>
                    <div className="hotel-cell">
                      <span className="hotel-name">{dish.dish_name}</span>
                      <span className="hotel-id">Master ID: #{dish.id}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${dish.dietary_type === "Veg" ? "online" : "offline"}`}
                      style={{ fontSize: "10px" }}
                    >
                      {dish.dietary_type}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${dish.status === "active" ? "online" : "offline"}`}
                    >
                      {dish.status}
                    </span>
                  </td>
                  <td className="action-cell">
                    <div className="action-group">
                      <button
                        className={`toggle-btn ${dish.status === "active" ? "off" : "on"}`}
                        disabled={isProcessing}
                        onClick={() =>
                          toggleDishStatus(dish.id, dish.dish_name, dish.status)
                        }
                      >
                        {dish.status === "active" ? (
                          <XCircle size={16} color="#ef4444" />
                        ) : (
                          <CheckCircle size={16} color="#22c55e" />
                        )}
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
              of <span>{pagination.totalItems}</span> master dishes
            </div>

            <div className="pagination-controls">
              <button
                disabled={pagination.currentPage === 1}
                onClick={() => handlePageClick(pagination.currentPage - 1)}
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
                  onClick={() => handlePageClick(num)}
                >
                  {num}
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

export default DishManager;
