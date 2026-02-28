import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Utensils, Plus } from "lucide-react";
import API from "../../../../api/axios";
import { toast } from "react-toastify";

const AddDish = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [dishForm, setDishForm] = useState({ name: "", type: "Veg" });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!dishForm.name) return toast.warn("Dish name is required");

    setIsProcessing(true);
    try {
      await API.post("api/hotels/global-dishes", {
        name: dishForm.name,
        type: dishForm.type,
      });
      toast.success("Dish added to global list!");
      navigate("/admin/hotels/dishes");
    } catch (err) {
      toast.error("Failed to add dish");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="form-header-toolbar">
        <button onClick={() => navigate(-1)} className="back-link">
          <ArrowLeft size={16} /> Back to Directory
        </button>
      </div>

      <div className="table-wrapper boxed-layout">
        <div className="table-header">
          <div className="title-section">
            <h2>Add Global Dish</h2>
            <p>
              Define a new dish to be available for selection in any hotel menu.
            </p>
          </div>
          <button
            className="add-btn"
            onClick={handleSave}
            disabled={isProcessing}
          >
            <Save size={16} /> {isProcessing ? "Processing..." : "Save Dish"}
          </button>
        </div>

        <div className="form-sections">
          <div className="form-card">
            <h4 className="section-title">
              <Utensils size={14} /> Dish Identification
            </h4>
            <div className="form-grid">
              <div className="input-field">
                <label>Dish Name</label>
                <input
                  type="text"
                  placeholder="e.g. Butter Chicken"
                  value={dishForm.name}
                  onChange={(e) =>
                    setDishForm({ ...dishForm, name: e.target.value })
                  }
                />
              </div>
              <div className="input-field">
                <label>Dietary Type</label>
                <select
                  value={dishForm.type}
                  onChange={(e) =>
                    setDishForm({ ...dishForm, type: e.target.value })
                  }
                >
                  <option value="Veg">Veg</option>
                  <option value="Non-Veg">Non-Veg</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDish;
