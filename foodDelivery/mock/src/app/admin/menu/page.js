"use client";

import React, { useState, useEffect } from "react";
import axiosInstance from "@/api/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiTrash2, FiToggleLeft, FiToggleRight, FiX, FiCheckCircle, FiLayers } from "react-icons/fi";

export default function AdminMenu() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestId, setSelectedRestId] = useState("");
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [success, setSuccess] = useState("");

  // Add Item form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 150,
    imageUrl: "",
    category: "VEG",
    vegetarian: true,
  });

  const loadRestaurants = async () => {
    try {
      const response = await axiosInstance.get("/restaurants");
      const data = response.data.data || [];
      setRestaurants(data);
      if (data.length > 0) {
        setSelectedRestId(data[0].id);
      }
    } catch (error) {
      console.error("Error loading restaurants:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMenu = async (restId) => {
    if (!restId) return;
    setMenuLoading(true);
    try {
      const response = await axiosInstance.get(`/menu/restaurant/${restId}`);
      setMenu(response.data.data || []);
    } catch (error) {
      console.error("Error loading menu:", error);
    } finally {
      setMenuLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestId) {
      loadMenu(selectedRestId);
    }
  }, [selectedRestId]);

  const handleChange = (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: val });
  };

  const handleCreateMenuItem = async (e) => {
    e.preventDefault();
    setSuccess("");
    try {
      await axiosInstance.post(`/menu/restaurant/${selectedRestId}`, formData);
      setSuccess("Menu item created successfully!");
      setFormData({
        name: "",
        description: "",
        price: 150,
        imageUrl: "",
        category: "VEG",
        vegetarian: true,
      });
      await loadMenu(selectedRestId);
      setTimeout(() => {
        setSuccess("");
        setShowAddModal(false);
      }, 1200);
    } catch (error) {
      console.error("Error creating menu item:", error);
      alert("Failed to add menu item. Verify parameters.");
    }
  };

  const handleToggleAvailability = async (itemId) => {
    try {
      await axiosInstance.patch(`/menu/${itemId}/toggle`);
      await loadMenu(selectedRestId);
    } catch (error) {
      console.error("Error toggling item availability:", error);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm("Are you sure you want to remove this menu item?")) return;
    try {
      await axiosInstance.delete(`/menu/${itemId}`);
      await loadMenu(selectedRestId);
    } catch (error) {
      console.error("Error deleting menu item:", error);
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
          <FiLayers className="text-primary" /> Menus
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          disabled={!selectedRestId}
          className="bg-primary hover:bg-primary-light text-white font-bold p-2.5 rounded-full shadow-lg hover:shadow-primary/20 active:scale-90 transition-all flex items-center justify-center disabled:opacity-50"
          title="Add Menu Item"
        >
          <FiPlus className="text-lg" />
        </button>
      </div>

      {/* Restaurant Selector */}
      <div className="flex flex-col">
        <label className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold mb-1.5">
          Select Restaurant Outlet
        </label>
        <select
          value={selectedRestId}
          onChange={(e) => setSelectedRestId(e.target.value)}
          className="w-full glass-input text-xs cursor-pointer select-none bg-cardBg"
        >
          {restaurants.map((res) => (
            <option key={res.id} value={res.id}>
              {res.name} ({res.city})
            </option>
          ))}
        </select>
      </div>

      {/* Menu Items List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-semibold text-textSecondary uppercase tracking-widest">
            Menu Items
          </h4>
          <span className="text-[10px] text-textSecondary font-semibold">
            {menu.length} ITEMS
          </span>
        </div>

        {menuLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 rounded-full border-2 border-t-primary border-white/5 animate-spin" />
          </div>
        ) : menu.length === 0 ? (
          <div className="glass-panel p-10 text-center text-textSecondary rounded-2xl text-xs">
            No menu items found for this restaurant.
          </div>
        ) : (
          <div className="space-y-3">
            {menu.map((item) => (
              <div
                key={item.id}
                className="glass-panel p-4 rounded-xl flex items-center justify-between gap-4 border border-white/5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${
                      item.vegetarian ? "bg-success/15 text-success" : "bg-error/15 text-error"
                    }`}>
                      {item.vegetarian ? "Veg" : "Non-Veg"}
                    </span>
                    <span className="text-[8px] text-textSecondary font-medium">{item.category}</span>
                  </div>
                  <h4 className="font-bold text-textPrimary text-sm truncate">
                    {item.name}
                  </h4>
                  <p className="text-xs text-textSecondary truncate mt-0.5">
                    ₹{item.price}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleAvailability(item.id)}
                    className={`text-xl p-1.5 rounded-xl transition-all ${
                      item.available ? "text-success hover:bg-success/5" : "text-textSecondary hover:bg-white/5"
                    }`}
                    title={item.available ? "Available (Toggle Unavailable)" : "Unavailable (Toggle Available)"}
                  >
                    {item.available ? <FiToggleRight /> : <FiToggleLeft />}
                  </button>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 bg-error/10 hover:bg-error/20 text-error rounded-xl transition-all"
                    title="Delete Menu Item"
                  >
                    <FiTrash2 className="text-sm" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Item Modal Overlay */}
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
                  Add Menu Item
                </h3>
              </div>

              {success && (
                <div className="bg-success/15 border border-success/20 text-success rounded-xl p-3 flex items-center gap-2 mb-4 text-xs font-semibold">
                  <FiCheckCircle className="text-base flex-shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleCreateMenuItem} className="space-y-4">
                <div className="flex flex-col">
                  <label className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold mb-1">
                    Item Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Cheese Pizza"
                    className="glass-input text-xs w-full"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    name="description"
                    required
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Rich cheese with hand-tossed base"
                    className="glass-input text-xs w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold mb-1">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      name="price"
                      required
                      value={formData.price}
                      onChange={handleChange}
                      className="glass-input text-xs w-full"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold mb-1">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="glass-input text-xs w-full bg-cardBg"
                    >
                      <option value="VEG">VEG</option>
                      <option value="NON_VEG">NON_VEG</option>
                      <option value="DESSERT">DESSERT</option>
                      <option value="BEVERAGES">BEVERAGES</option>
                      <option value="SIDES">SIDES</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold mb-1">
                    Food Cloudinary URL
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

                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    name="vegetarian"
                    id="vegetarian"
                    checked={formData.vegetarian}
                    onChange={handleChange}
                    className="w-4 h-4 cursor-pointer accent-primary"
                  />
                  <label htmlFor="vegetarian" className="text-xs font-semibold text-textSecondary cursor-pointer">
                    Mark as Vegetarian
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-light text-white font-bold py-3 rounded-xl text-xs active:scale-[0.98] transition-all uppercase tracking-wider"
                >
                  Create Menu Item
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
