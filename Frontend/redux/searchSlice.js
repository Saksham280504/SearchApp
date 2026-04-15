// src/redux/searchSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// ── Backend base URL — set VITE_API_URL in your .env / Vercel env vars
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ── Search (compound or category) ──────────────────────────────────
export const fetchSearchResults = createAsyncThunk(
  "search/fetchResults",
  async ({ keyword, searchType }, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API}/search`, { keyword, searchType });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Search failed. Please try again."
      );
    }
  }
);

// ── Autocomplete ────────────────────────────────────────────────────
export const fetchAutocompleteResults = createAsyncThunk(
  "search/fetchAutocomplete",
  async (query, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API}/autocomplete`, { params: { query } });
      return res.data.suggestions;
    } catch (err) {
      return rejectWithValue("Autocomplete failed");
    }
  }
);

const searchSlice = createSlice({
  name: "search",
  initialState: {
    // Compound search results
    fileUrl: null,
    tableData: [],
    // Category search results
    Count: 0,
    CompoundNames: [],
    CompoundFormulas: [],
    // Autocomplete
    suggestions: [],
    // UI state
    loading: false,
    error: null,
  },
  reducers: {
    clearSearchResults: (state) => {
      state.fileUrl        = null;
      state.tableData      = [];
      state.Count          = 0;
      state.CompoundNames  = [];
      state.CompoundFormulas = [];
      state.suggestions    = [];
      state.error          = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchSearchResults
      .addCase(fetchSearchResults.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchSearchResults.fulfilled, (state, action) => {
        state.loading = false;
        const d = action.payload;
        // Compound search
        state.fileUrl   = d.file   ?? null;
        state.tableData = d.tableData ?? [];
        // Category search
        state.Count            = d.Count            ?? 0;
        state.CompoundNames    = d.CompoundNames    ?? [];
        state.CompoundFormulas = d.CompoundFormulas ?? [];
      })
      .addCase(fetchSearchResults.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      })
      // fetchAutocompleteResults
      .addCase(fetchAutocompleteResults.fulfilled, (state, action) => {
        state.suggestions = action.payload;
      });
  },
});

export const { clearSearchResults } = searchSlice.actions;
export default searchSlice.reducer;