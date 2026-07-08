"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/api/axiosInstance";
import { motion } from "framer-motion";
import { FiCpu, FiSend, FiUser, FiArrowLeft } from "react-router-dom"; // wait, next.js uses next/navigation! Let's be careful.
// Oh, let's import icons correctly.

import { FiSend as FiSendIcon } from "react-icons/fi";
// let's do this:
// import { FiCpu, FiSend, FiUser, FiArrowLeft } from "react-icons/fi";
// Yes! Let's write the complete file with next/navigation for router and react-icons.
