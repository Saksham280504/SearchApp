import axios from "axios";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_BASE_URL } from "./config";

// ── Async thunk: search ───────────────────────────────────────────────
export const fetchSearchResults = createAsyncThunk(
  "search/fetchResults",
  async ({ keyword, searchType }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/search`, {
        keyword,
        searchType,
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Search failed. Please try again."
      );
    }
  }
);

// ── Async thunk: autocomplete ────────────────────────────────────────
export const fetchAutocompleteResults = createAsyncThunk(
  "search/fetchAutocomplete",
  async (query, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/autocomplete`, {
        params: { query },
      });
      return res.data.suggestions;
    } catch (err) {
      return rejectWithValue("Autocomplete failed");
    }
  }
);

/**
 * Map the server response (which still sends parallel arrays for backward
 * compat with the file-scan fallback) into a clean array of result objects.
 * The DB path already returns the same array shape via mapCompoundRowsToLegacyShape.
 */
const mapPayloadToResults = (payload) => {
  const fileNames = payload.fileNames || [];
  return fileNames.map((fileName, i) => ({
    fileName,
    mzValue: payload.mzValues?.[i] ?? null,
    retentionTime: payload.retentionTimes?.[i] ?? null,
    molecularWeight: payload.molecularWeights?.[i] ?? null,
    chemicalFormula: payload.ChemicalFormulas?.[i] ?? null,
    ms2Value: payload.ms2Values?.[i] ?? null,
    referenceIon: payload.ReferenceIons?.[i] ?? null,
    area: payload.areas?.[i] ?? null,
  }));
};

const EMPTY_STATE = {
  results: [],           // ← unified result objects (replaces 8 parallel arrays)
  compound: "",
  downloadLink: "",
  loading: false,
  error: null,
  suggestions: [],
  // Category search fields (unchanged)
  Count: 0,
  CompoundNames: [],
  CompoundFormulas: [],
  savedSearches: [],
};

const searchSlice = createSlice({
  name: "search",
  initialState: EMPTY_STATE,
  reducers: {
    clearSearchResults: (state) => {
      state.results = [];
      state.compound = "";
      state.downloadLink = "";
      state.error = null;
      state.Count = 0;
      state.CompoundNames = [];
      state.CompoundFormulas = [];
    },
    saveCurrentSearch: (state, action) => {
      const { compound, graphData } = action.payload;
      state.savedSearches.push({ compound, graphData });
    },
    clearSavedSearches: (state) => {
      state.savedSearches = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSearchResults.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.results = [];
        state.compound = "";
        state.downloadLink = "";
        state.Count = 0;
        state.CompoundNames = [];
        state.CompoundFormulas = [];
      })
      .addCase(fetchSearchResults.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.results = mapPayloadToResults(action.payload);
        state.compound = action.payload.Compound || "";
        state.downloadLink = action.payload.file || "";
        state.Count = action.payload.Count || 0;
        state.CompoundNames = action.payload.CompoundNames || [];
        state.CompoundFormulas = action.payload.CompoundFormulas || [];
      })
      .addCase(fetchSearchResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error fetching results";
      })
      .addCase(fetchAutocompleteResults.fulfilled, (state, action) => {
        state.suggestions = action.payload;
      });
  },
});

export const { clearSearchResults, saveCurrentSearch, clearSavedSearches } =
  searchSlice.actions;
export default searchSlice.reducer;