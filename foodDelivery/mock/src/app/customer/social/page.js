"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/api/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import { FiGlobe, FiShare2, FiHeart, FiPlus, FiX, FiImage, FiSmile, FiAlertCircle } from "react-icons/fi";

export default function CustomerSocial() {
  const { user } = useAuth();
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadFeed = async () => {
    try {
      const response = await axiosInstance.get("/social/feed");
      // Sort posts by ID desc (or latest first)
      const posts = response.data.data || [];
      setFeed(posts.reverse());
    } catch (error) {
      console.error("Error loading social feed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!imageUrl.trim() || !caption.trim() || !user) return;
    setPosting(true);
    setErrorMsg("");

    try {
      const response = await axiosInstance.post(
        `/social/post?userId=${user.id}&imageUrl=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}`
      );
      
      setSuccessMsg(response.data.message || "Post created! +50 Coins Added!");
      setImageUrl("");
      setCaption("");
      
      // Reload feed and close modal
      await loadFeed();
      setTimeout(() => {
        setSuccessMsg("");
        setShowPostModal(false);
      }, 1500);
    } catch (error) {
      console.error("Error posting to social:", error);
      setErrorMsg(error.response?.data?.message || "Failed to submit post.");
    } finally {
      setPosting(false);
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
          <FiGlobe className="text-primary" /> Social Feed
        </h2>
        <button
          onClick={() => setShowPostModal(true)}
          className="bg-primary hover:bg-primary-light text-white font-bold p-2.5 rounded-full shadow-lg hover:shadow-primary/20 active:scale-90 transition-all flex items-center justify-center"
          title="Create Post"
        >
          <FiPlus className="text-lg" />
        </button>
      </div>

      {/* Feed List */}
      <div className="space-y-6">
        {feed.length === 0 ? (
          <div className="glass-panel p-12 text-center text-textSecondary rounded-2xl text-sm">
            No social posts found. Share your first food pic!
          </div>
        ) : (
          feed.map((post) => (
            <div
              key={post.id}
              className="glass-panel rounded-2xl overflow-hidden border border-white/5"
            >
              {/* Header */}
              <div className="p-4 flex items-center gap-3 border-b border-white/5">
                <div className="w-8 h-8 rounded-full bg-surface border border-white/10 flex items-center justify-center font-bold text-xs text-textPrimary">
                  U
                </div>
                <div>
                  <h5 className="text-xs font-bold text-textPrimary">
                    User #{post.userId}
                  </h5>
                  <p className="text-[9px] text-textSecondary uppercase tracking-widest mt-0.5">
                    Food Enthusiast
                  </p>
                </div>
              </div>

              {/* Post Image */}
              <div className="h-64 bg-cardBg w-full border-b border-white/5">
                {post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt="Food Snap"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-textSecondary">
                    No post image loaded
                  </div>
                )}
              </div>

              {/* Actions & Caption */}
              <div className="p-4 space-y-2.5">
                <div className="flex items-center gap-4 text-textSecondary text-lg">
                  <button className="hover:text-primary active:scale-90 transition-all flex items-center gap-1.5 text-xs font-semibold">
                    <FiHeart /> Like
                  </button>
                  <button className="hover:text-accent active:scale-90 transition-all flex items-center gap-1.5 text-xs font-semibold">
                    <FiShare2 /> Share
                  </button>
                </div>
                <p className="text-xs text-textSecondary leading-relaxed">
                  <span className="font-bold text-textPrimary mr-1.5">User #{post.userId}</span>
                  {post.caption}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Post Modal Overlay */}
      <AnimatePresence>
        {showPostModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm glass-panel p-6 rounded-2xl relative"
            >
              <button
                onClick={() => setShowPostModal(false)}
                className="absolute right-4 top-4 p-1 rounded-full hover:bg-white/10 text-textSecondary"
              >
                <FiX className="text-lg" />
              </button>

              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-textPrimary uppercase tracking-wider">
                  Post Food Snap
                </h3>
                <p className="text-[10px] text-accent tracking-widest font-black uppercase mt-1">
                  Earn +50 Coins Instantly
                </p>
              </div>

              {successMsg && (
                <div className="bg-success/15 border border-success/20 text-success rounded-xl p-3 flex items-center gap-2 mb-4 text-xs font-semibold">
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="bg-error/15 border border-error/20 text-error rounded-xl p-3 flex items-center gap-2 mb-4 text-xs font-semibold">
                  <FiAlertCircle className="text-base flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreatePost} className="space-y-4">
                <div className="flex flex-col">
                  <label className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold mb-1.5 flex items-center gap-1">
                    <FiImage /> Image URL (Cloudinary URL)
                  </label>
                  <input
                    type="url"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://res.cloudinary.com/..."
                    className="glass-input text-xs w-full"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] text-textSecondary uppercase tracking-widest font-semibold mb-1.5 flex items-center gap-1">
                    <FiSmile /> Caption
                  </label>
                  <input
                    type="text"
                    required
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Describe this delicious dish..."
                    className="glass-input text-xs w-full"
                  />
                </div>

                <button
                  type="submit"
                  disabled={posting}
                  className="w-full bg-primary hover:bg-primary-light text-white font-bold py-3 rounded-xl text-xs active:scale-[0.98] transition-all uppercase tracking-wider"
                >
                  {posting ? "Publishing..." : "Publish Post"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
