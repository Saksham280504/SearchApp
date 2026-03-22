// redux/analyticsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Fetch the list of available sample files from the backend
export const fetchSampleFiles = createAsyncThunk(
  "analytics/fetchSampleFiles",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("http://localhost:5000/analytics/files");
      return res.data.files; // string[]
    } catch (err) {
      return rejectWithValue("Failed to load sample file list");
    }
  }
);

// Fetch compound data for a selected set of files
export const fetchAnalyticsData = createAsyncThunk(
  "analytics/fetchData",
  async (selectedFiles, { rejectWithValue }) => {
    try {
      const res = await axios.post("http://localhost:5000/analytics/data", {
        files: selectedFiles,
      });
      return res.data.data; // { [fileName]: CompoundRow[] }
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