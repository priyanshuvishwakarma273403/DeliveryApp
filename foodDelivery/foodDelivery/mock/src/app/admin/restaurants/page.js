"use client";

import React, { useState, useEffect } from "react";
import axiosInstance from "@/api/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiTrash2, FiToggleLeft, FiToggleRight, FiX, FiCheckCircle, FiServer } from "react-icons/fi";

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [success, setSuccess] = useState("");

  // Add Restaurant form state
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "Noida",
    cuisineType: "Fast Food",
    phone: "",
    imageUrl: "",
    minOrderAmount: 100,
    avgDeliveryTime: 30,
  });

  const loadRestaurants = async () => {
    try {
      const response = await axiosInstance.get("/restaurants");
      setRestaurants(response.data.data);
    } catch (error) {
      console.error("Error loading restaurants:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    setSuccess("");
    try {
      await axiosInstance.post("/restaurants", formData);
      setSuccess("Restaurant added successfully!");
      setFormData({
        name: "",
        address: "",
        city: "Noida",
        cuisineType: "Fast Food",
        phone: "",
        imageUrl: "",
        minOrderAmount: 100,
        avgDeliveryTime: 30,
      });
      await loadRestaurants();
      setTimeout(() => {
        setSuccess("");
        setShowAddModal(false);
      }, 1200);
    } catch (error) {
      console.error("Error creating restaurant:", error);
      alert("Failed to add restaurant. Verify parameters.");
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await axiosInstance.patch(`/restaurants/${id}/toggle`);
      await loadRestaurants();
    } catch (error) {
      console.error("Error toggling open status:", error);
    }
  };

  const handleDeleteRestaurant = async (id) => {
    if (!confirm("Are you sure you want to remove this restaurant?")) return;
    try {
      await axiosInstance.delete(`/restaurants/${id}`);
      await loadRestaurants();
    } catch (error) {
      console.error("Error deleting restaurant:", error);
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
    <div className="flex-1 px-6 py-6 space-y-6 pb-20 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-textPrimary tracking-wide uppercase flex items-center gap-2">
          <FiServer className="text-primary" /> Outlets
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary hover:bg-primary-light text-white font-bold p-2.5 rounded-full shadow-lg hover:shadow-primary/20 active:scale-90 transition-all flex items-center justify-center"
          title="Add Restaurant"
        >
          <FiPlus className="text-lg" />
        </button>
      </div>

      {/* Outlets List */}
      <div className="space-y-4">
        {restaurants.length === 0 ? (
          <div className="glass-panel p-10 text-center text-textSecondary rounded-2xl text-xs">
            No restaurants found in database.
          </div>
        ) : (
          restaurants.map((res) => (
            <div
              key={res.id}
              className="glass-panel p-4 rounded-xl flex items-center justify-between gap-4 border border-white/5"
            >
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-textPrimary text-sm truncate">
                  {res.name}
                </h4>
                <p className="text-xs text-textSecondary truncate mt-0.5">
                  {res.cuisineType} &bull; {res.address}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleStatus(res.id)}
                  className={`text-xl p-1.5 rounded-xl transition-all ${
                    res.open ? "text-success hover:bg-success/5" : "text-textSecondary hover:bg-white/5"
                  }`}
                  title={res.open ? "Open (Toggle Close)" : "Closed (Toggle Open)"}
                >
                  {res.open ? <FiToggleRight /> : <FiToggleLeft />}
                </button>

                <button
                  onClick={() => handleDeleteRestaurant(res.id)}
                  className="p-2 bg-error/10 hover:bg-error/20 text-error rounded-xl transition-all"
                  title="Delete Restaurant"
                >
                  <FiTrash2 className="text-sm" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Restaurant Modal Overlay */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm glass-panel p-6 rounded-2xl relative max-h-[85vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute right-4 top-4 p-1 rounded-full hover:bg-white/10 text-textSecondary"
              >
                <FiX className="text-lg" />
              </button>

              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-textPrimary uppercase tracking-wider">
                  Add Restaurant
                </h3>
              </div>

              {success && (
                <div className="bg-success/15 border border-success/20 text-success rounded-xl p-3 flex items-center gap-2 mb-4 text-xs font-semibold">
                  <FiCheckCircle className="text-base flex-shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleCreateRestaurant} className="space-y-4">
                <div className="flex flex-col">
                  <label className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold mb-1">
                    Restaurant Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Pizza Parlor"
                    className="glass-input text-xs w-full"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold mb-1">
                    Cuisine Type
                  </label>
                  <input
                    type="text"
                    name="cuisineType"
                    required
                    value={formData.cuisineType}
                    onChange={handleChange}
                    placeholder="Italian, Continental"
                    className="glass-input text-xs w-full"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Sector 18"
                    className="glass-input text-xs w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      className="glass-input text-xs w-full"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      className="glass-input text-xs w-full"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold mb-1">
                    Banner Cloudinary URL
                  </label>
                  <input
                    type="url"
                    name="imageUrl"
                    required
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder="https://res.cloudinary.com/..."
                    className="glass-input text-xs w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold mb-1">
                      Min. Order (₹)
                    </label>
                    <input
                      type="number"
                      name="minOrderAmount"
                      required
                      value={formData.minOrderAmount}
                      onChange={handleChange}
                      className="glass-input text-xs w-full"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold mb-1">
                      Deliv. Time (Mins)
                    </label>
                    <input
                      type="number"
                      name="avgDeliveryTime"
                      required
                      value={formData.avgDeliveryTime}
                      onChange={handleChange}
                      className="glass-input text-xs w-full"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-light text-white font-bold py-3 rounded-xl text-xs active:scale-[0.98] transition-all uppercase tracking-wider"
                >
                  Create Restaurant
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
