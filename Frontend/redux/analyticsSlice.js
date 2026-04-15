// src/redux/analyticsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// ── Read the backend URL from the Vite environment variable.
//    In development: set VITE_API_URL=http://localhost:5000 in Frontend/.env
//    In production:  set VITE_API_URL=https://searchapp-backend-wowc.onrender.com
//                   in your Vercel project → Settings → Environment Variables
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const fetchSampleFiles = createAsyncThunk(
  "analytics/fetchSampleFiles",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API}/analytics/files`);
      return res.data.files;
    } catch (err) {
      return rejectWithValue("Failed to load sample file list");
    }
  }
);

export const fetchAnalyticsData = createAsyncThunk(
  "analytics/fetchData",
  async (selectedFiles, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API}/analytics/data`, {
        files: selectedFiles,
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue("Failed to load analytics data");
    }
  }
);

const analyticsSlice = createSlice({
  name: "analytics",
  initialState: {
    availableFiles: [],
    selectedFiles: [],
    data: {},
    loading: false,
    error: null,
  },
  reducers: {
    setSelectedFiles: (state, action) => {
      state.selectedFiles = action.payload;
    },
    clearAnalyticsData: (state) => {
      state.data = {};
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSampleFiles.fulfilled, (state, action) => {
        state.availableFiles = action.payload;
      })
      .addCase(fetchSampleFiles.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(fetchAnalyticsData.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.data = {};
      })
      .addCase(fetchAnalyticsData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchAnalyticsData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setSelectedFiles, clearAnalyticsData } = analyticsSlice.actions;
export default analyticsSlice.reducer;