"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import axiosInstance from "@/api/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import { FiStar, FiClock, FiMapPin, FiPlus, FiMinus, FiShoppingBag, FiMessageSquare } from "react-icons/fi";

export default function RestaurantDetails() {
  const { id } = useParams();
  const { cart, addToCart, updateItemQty, removeItem } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Review form states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const loadRestaurantData = async () => {
      try {
        const restRes = await axiosInstance.get(`/restaurants/${id}`);
        setRestaurant(restRes.data.data);

        const menuRes = await axiosInstance.get(`/menu/restaurant/${id}`);
        setMenu(menuRes.data.data);

        const reviewsRes = await axiosInstance.get(`/reviews/restaurant/${id}`);
        setReviews(reviewsRes.data);
      } catch (error) {
        console.error("Error loading restaurant details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadRestaurantData();
    }
  }, [id]);

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmittingReview(true);

    try {
      const reviewPayload = {
        restaurantId: id,
        rating,
        comment,
      };
      const response = await axiosInstance.post("/reviews", reviewPayload);
      setReviews([response.data, ...reviews]);
      setComment("");
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setSubmittingReview(false);
    }
  };

  const getItemQuantityInCart = (itemId) => {
    if (!cart || !cart.items) return 0;
    const foundItem = cart.items.find((item) => item.menuItemId === itemId);
    return foundItem ? foundItem.quantity : 0;
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-20 space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-t-primary border-white/5 animate-spin" />
        <span className="text-xs text-textSecondary uppercase tracking-widest">
          Reading Menu...
        </span>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex-1 px-6 py-20 text-center text-textSecondary">
        Restaurant not found.
      </div>
    );
  }

  return (
    <div className="flex-1 pb-10">
      {/* Banner */}
      <div className="relative h-56 bg-cardBg w-full border-b border-white/5">
        {restaurant.imageUrl ? (
          <img
            src={restaurant.imageUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-textSecondary">
            No Banner Image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/40 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 space-y-2">
          <h1 className="text-2xl font-black text-textPrimary tracking-wide">
            {restaurant.name}
          </h1>
          <p className="text-xs text-textSecondary">
            {restaurant.cuisineType}
          </p>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-panel p-3.5 rounded-xl flex flex-col items-center justify-center text-center">
            <FiStar className="text-accent text-lg mb-1 fill-accent border-none" />
            <span className="text-xs font-bold text-textPrimary">
              {restaurant.rating ? restaurant.rating.toFixed(1) : "N/A"}
            </span>
            <span className="text-[9px] text-textSecondary uppercase tracking-widest mt-0.5">Rating</span>
          </div>

          <div className="glass-panel p-3.5 rounded-xl flex flex-col items-center justify-center text-center">
            <FiClock className="text-primary text-lg mb-1" />
            <span className="text-xs font-bold text-textPrimary">
              {restaurant.avgDeliveryTime} Min
            </span>
            <span className="text-[9px] text-textSecondary uppercase tracking-widest mt-0.5">Delivery</span>
          </div>

          <div className="glass-panel p-3.5 rounded-xl flex flex-col items-center justify-center text-center">
            <FiMapPin className="text-success text-lg mb-1" />
            <span className="text-xs font-bold text-textPrimary truncate max-w-full">
              {restaurant.city}
            </span>
            <span className="text-[9px] text-textSecondary uppercase tracking-widest mt-0.5">City</span>
          </div>
        </div>

        {/* Menu Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-widest border-b border-white/5 pb-2">
            Recommended Menu
          </h3>

          <div className="space-y-4">
            {menu.length === 0 ? (
              <div className="glass-panel p-8 text-center text-textSecondary rounded-2xl text-xs">
                No menu items available at the moment.
              </div>
            ) : (
              menu.map((item) => {
                const qty = getItemQuantityInCart(item.id);
                return (
                  <div
                    key={item.id}
                    className="glass-panel p-4 rounded-2xl flex items-center justify-between gap-4 border border-white/5 hover:border-white/10 transition-all duration-300"
                  >
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[8px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                            item.vegetarian
                              ? "bg-success/10 text-success border border-success/20"
                              : "bg-error/10 text-error border border-error/20"
                          }`}
                        >
                          {item.vegetarian ? "Veg" : "Non-Veg"}
                        </span>
                        <span className="text-[9px] text-textSecondary font-semibold tracking-wider">
                          {item.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-textPrimary text-sm truncate">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-textSecondary line-clamp-2">
                        {item.description}
                      </p>
                      <p className="text-xs font-bold text-textPrimary">
                        ₹{item.price}
                      </p>
                    </div>

                    <div className="relative w-24 h-24 bg-cardBg rounded-xl overflow-hidden flex-shrink-0 flex flex-col justify-end">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover absolute inset-0"
                        />
                      ) : (
                        <div className="w-full h-full absolute inset-0 flex items-center justify-center text-[10px] text-textSecondary bg-cardBg">
                          No Food Image
                        </div>
                      )}
                      
                      {/* Cart Action Buttons overlay */}
                      <div className="relative z-10 p-1.5 w-full flex justify-center">
                        {qty > 0 ? (
                          <div className="flex items-center justify-between w-full bg-primary text-white rounded-lg text-xs font-bold shadow-lg py-1 px-2">
                            <button
                              onClick={() => updateItemQty(item.id, qty - 1)}
                              className="p-1 hover:bg-white/10 rounded-md active:scale-90 transition-all"
                            >
                              <FiMinus />
                            </button>
                            <span>{qty}</span>
                            <button
                              onClick={() => addToCart(item.id, qty + 1)}
                              className="p-1 hover:bg-white/10 rounded-md active:scale-90 transition-all"
                            >
                              <FiPlus />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item.id, 1)}
                            disabled={!restaurant.open}
                            className="bg-primary hover:bg-primary-light text-white text-[10px] font-black w-full py-1.5 rounded-lg active:scale-95 transition-all shadow-lg hover:shadow-primary/30 disabled:opacity-50 tracking-wider uppercase"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="space-y-6">
          <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-widest border-b border-white/5 pb-2">
            Customer Reviews
          </h3>

          {/* Add Review Form */}
          <form onSubmit={handleAddReview} className="glass-panel p-5 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold text-textPrimary tracking-wide">
              Rate your experience
            </h4>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold">
                Rating Score (1-5 Stars)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 text-xl active:scale-90 transition-all"
                  >
                    <FiStar
                      className={`text-lg ${
                        star <= rating ? "text-accent fill-accent" : "text-textSecondary"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold mb-1.5">
                Leave a comment
              </label>
              <textarea
                value={comment}
                required
                onChange={(e) => setComment(e.target.value)}
                placeholder="Review comment..."
                rows={3}
                className="glass-input text-xs w-full resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submittingReview}
              className="w-full bg-primary hover:bg-primary-light text-white font-bold py-2 rounded-xl text-xs active:scale-[0.98] transition-all uppercase tracking-wider"
            >
              {submittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </form>

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-center text-xs text-textSecondary py-4">
                Be the first to write a review.
              </p>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="glass-panel p-4 rounded-xl space-y-2 border border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-textPrimary">
                      {rev.userName || "User"}
                    </span>
                    <div className="flex gap-0.5 text-accent">
                      {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                        <FiStar key={i} className="fill-accent text-[9px]" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-textSecondary leading-relaxed">
                    {rev.comment}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
