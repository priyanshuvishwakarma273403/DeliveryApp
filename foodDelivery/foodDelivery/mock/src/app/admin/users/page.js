"use client";

import React, { useState, useEffect } from "react";
import axiosInstance from "@/api/axiosInstance";
import { motion } from "framer-motion";
import { FiUsers, FiTrash2, FiUserCheck, FiShield } from "react-icons/fi";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const loadUsers = async () => {
    try {
      const response = await axiosInstance.get("/users");
      setUsers(response.data.data || []);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleChangeRole = async (userId, currentRole) => {
    // Cycles roles: CUSTOMER -> DELIVERY_PARTNER -> ADMIN -> CUSTOMER
    let nextRole = "CUSTOMER";
    if (currentRole === "CUSTOMER") nextRole = "DELIVERY_PARTNER";
    else if (currentRole === "DELIVERY_PARTNER") nextRole = "ADMIN";
    
    setUpdatingId(userId);
    try {
      await axiosInstance.patch(`/users/${userId}/role?role=${nextRole}`);
      await loadUsers();
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Failed to change user role.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user profile?")) return;
    try {
      await axiosInstance.delete(`/users/${userId}`);
      await loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-t-primary border-white/5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 px-6 py-6 space-y-6 pb-20">
      <h2 className="text-xl font-black text-textPrimary tracking-wide uppercase flex items-center gap-2">
        <FiUsers className="text-primary" /> User Directory
      </h2>

      {/* Users List */}
      <div className="space-y-4">
        {users.length === 0 ? (
          <div className="glass-panel p-10 text-center text-textSecondary rounded-2xl text-xs">
            No users registered in system database.
          </div>
        ) : (
          users.map((item, index) => {
            const roleBadgeColor =
              item.role === "ADMIN"
                ? "bg-primary/10 border-primary/20 text-primary"
                : item.role === "DELIVERY_PARTNER"
                ? "bg-accent/10 border-accent/20 text-accent"
                : "bg-success/10 border-success/20 text-success";
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={item.id}
                className="glass-panel p-4 rounded-xl border border-white/5 flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="font-bold text-textPrimary text-sm truncate flex items-center gap-2">
                    {item.name}
                    {item.role === "ADMIN" && <FiShield className="text-primary text-xs" />}
                  </h4>
                  <p className="text-[11px] text-textSecondary truncate">{item.email} &bull; {item.phone}</p>
                  <span className={`inline-block text-[8px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${roleBadgeColor}`}>
                    {item.role}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleChangeRole(item.id, item.role)}
                    disabled={updatingId === item.id}
                    className="p-2 bg-white/5 hover:bg-white/10 text-textPrimary rounded-xl transition-all"
                    title="Cycle User Role"
                  >
                    <FiUserCheck className="text-sm" />
                  </button>

                  <button
                    onClick={() => handleDeleteUser(item.id)}
                    className="p-2 bg-error/10 hover:bg-error/20 text-error rounded-xl transition-all"
                    title="Delete User Account"
                  >
                    <FiTrash2 className="text-sm" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
