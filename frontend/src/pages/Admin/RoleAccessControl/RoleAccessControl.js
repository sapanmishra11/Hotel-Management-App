import React, { useState, useEffect } from "react";
import API from "../../../api/axios";
import { toast } from "react-toastify";
import { FaShieldAlt } from "react-icons/fa";

const RoleAccess = () => {
  const [rolesWithPermissions, setRolesWithPermissions] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);

  useEffect(() => {
    fetchAccessControlData();
  }, []);

  const fetchAccessControlData = async () => {
    try {
      const permsRes = await API.get("api/all-permissions");
      const rolesRes = await API.get("api/role-permissions");
      setAllPermissions(permsRes.data);
      setRolesWithPermissions(rolesRes.data);
    } catch (err) {
      console.error("Error loading permissions:", err);
      toast.error("Failed to load access control data");
    }
  };

  const handlePermissionToggle = async (roleId, permissionId, isChecked) => {
    try {
      await API.post("api/toggle-permission", {
        role_id: roleId,
        permission_id: permissionId,
        action: isChecked ? "add" : "remove",
      });
      toast.success("Access updated!");
      fetchAccessControlData();
    } catch (err) {
      toast.error("Failed to update access");
      fetchAccessControlData();
    }
  };

  return (
    <div className="hotel-management">
      {" "}
      <section className="table-wrapper">
        <h3>
          <FaShieldAlt /> Role Access Control
        </h3>
        <p
          style={{
            color: "#64748b",
            marginBottom: "20px",
            fontSize: "0.95rem",
          }}
        >
          Assign which pages each user role is allowed to view and interact with
          in their dashboard.
        </p>
        <div style={{ overflowX: "auto" }}>
          {" "}
          <table className="log-table">
            <thead>
              <tr>
                <th>User Role</th>
                {allPermissions.map((p) => (
                  <th key={p.id} style={{ textAlign: "center" }}>
                    {p.display_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rolesWithPermissions.map((role) => (
                <tr key={role.role_id}>
                  <td style={{ fontWeight: "600" }}>{role.role_name}</td>
                  {allPermissions.map((p) => (
                    <td key={p.id} style={{ textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={role.permission_ids.includes(p.id)}
                        onChange={(e) =>
                          handlePermissionToggle(
                            role.role_id,
                            p.id,
                            e.target.checked,
                          )
                        }
                        style={{
                          width: "20px",
                          height: "20px",
                          cursor: "pointer",
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default RoleAccess;
