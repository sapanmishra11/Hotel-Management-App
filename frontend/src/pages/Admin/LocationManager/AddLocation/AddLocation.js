import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Globe, Landmark, MapPin } from "lucide-react";
import { toast } from "react-toastify";
import API from "../../../../api/axios";
import "./AddLocation.scss";

const AddLocation = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const [locationData, setLocationData] = useState({
    countries: [],
    countryStateMap: {},
    stateCityMap: {},
  });

  const [countryForm, setCountryForm] = useState({ country: "" });
  const [stateForm, setStateForm] = useState({ country: "", state: "" });
  const [cityForm, setCityForm] = useState({
    country: "",
    state: "",
    city: "",
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await API.get("api/hotels/locations");
      setLocationData(res.data);
    } catch (err) {
      console.error("Error fetching locations", err);
      toast.error("Failed to fetch existing locations.");
    }
  };

  const handleAddLocation = async (formData, resetFn) => {
    setIsProcessing(true);
    try {
      await API.post("api/hotels/locations/add", formData);
      toast.success("Location added successfully!");
      resetFn();
      fetchLocations();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error adding location");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="form-header-toolbar">
        <button onClick={() => navigate(-1)} className="back-link">
          <ArrowLeft size={16} /> Back to Location Directory
        </button>
      </div>

      <div className="table-wrapper boxed-layout">
        <div className="table-header">
          <div className="title-section">
            <h2>Add Infrastructure</h2>
            <p>
              Expand your operational areas by adding new Countries, States, or
              Cities.
            </p>
          </div>
        </div>

        <div className="form-sections">
          <div className="form-card">
            <h4 className="section-title">
              <Globe size={14} /> 1. Add New Country
            </h4>
            <div className="inline-add-row">
              <input
                type="text"
                placeholder="e.g., India, United States..."
                value={countryForm.country}
                onChange={(e) => setCountryForm({ country: e.target.value })}
              />
              <button
                type="button"
                className="btn-stage"
                disabled={!countryForm.country || isProcessing}
                onClick={() =>
                  handleAddLocation(countryForm, () =>
                    setCountryForm({ country: "" }),
                  )
                }
              >
                <Plus size={14} /> Save Country
              </button>
            </div>
          </div>

          <div className="form-card">
            <h4 className="section-title">
              <Landmark size={14} /> 2. Add New State / Region
            </h4>
            <div className="inline-add-row">
              <select
                value={stateForm.country}
                onChange={(e) =>
                  setStateForm({ ...stateForm, country: e.target.value })
                }
              >
                <option value="">Select Parent Country...</option>
                {locationData.countries?.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="e.g., Maharashtra, California..."
                value={stateForm.state}
                onChange={(e) =>
                  setStateForm({ ...stateForm, state: e.target.value })
                }
              />
              <button
                type="button"
                className="btn-stage"
                disabled={
                  !stateForm.state || !stateForm.country || isProcessing
                }
                onClick={() =>
                  handleAddLocation(stateForm, () =>
                    setStateForm({ country: "", state: "" }),
                  )
                }
              >
                <Plus size={14} /> Save State
              </button>
            </div>
          </div>

          <div className="form-card">
            <h4 className="section-title">
              <MapPin size={14} /> 3. Add New City / Area
            </h4>
            <div className="form-grid">
              <div className="input-field">
                <label>Parent Country</label>
                <select
                  value={cityForm.country}
                  onChange={(e) =>
                    setCityForm({
                      ...cityForm,
                      country: e.target.value,
                      state: "",
                    })
                  }
                >
                  <option value="">Select Country...</option>
                  {locationData.countries?.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-field">
                <label>Parent State</label>
                <select
                  value={cityForm.state}
                  disabled={!cityForm.country}
                  onChange={(e) =>
                    setCityForm({ ...cityForm, state: e.target.value })
                  }
                >
                  <option value="">Select State...</option>
                  {cityForm.country &&
                    locationData.countryStateMap?.[cityForm.country]?.map(
                      (s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ),
                    )}
                </select>
              </div>

              <div className="input-field full-width">
                <label>City Name</label>
                <input
                  type="text"
                  placeholder="e.g., Mumbai, Los Angeles..."
                  value={cityForm.city}
                  onChange={(e) =>
                    setCityForm({ ...cityForm, city: e.target.value })
                  }
                />
              </div>
            </div>

            <button
              style={{ marginTop: "1.5rem" }}
              type="button"
              className="btn-stage"
              disabled={!cityForm.city || !cityForm.state || isProcessing}
              onClick={() =>
                handleAddLocation(cityForm, () =>
                  setCityForm({ country: "", state: "", city: "" }),
                )
              }
            >
              <Plus size={14} /> Save City
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLocation;
