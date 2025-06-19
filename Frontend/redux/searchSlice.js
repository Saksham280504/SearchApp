import axios from "axios";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";


//Async thunk to handle API request
export const fetchSearchResults = createAsyncThunk(
    "search/fetchResults",
    async ({ keyword, searchType }, { rejectWithValue }) => {
        try{
            const response = await axios.post("http://localhost:5000/search", {
                keyword,
                searchType,
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const fetchAutocompleteResults = createAsyncThunk(
    "search/fetchAutocomplete",
    async (query, { rejectWithValue }) => {
        try {
            const response = await fetch(`http://localhost:5000/autocomplete?query=${query}`);
            const data = await response.json();
            return data.suggestions || [];
        } catch (error) {
            return rejectWithValue("Failed to fetch suggestions");
        }
    }
);


const searchSlice = createSlice({
    name: "search",
    initialState: {
        fileNames: [],
        compound : "",
        downloadLink: "",
        loading: false,
        error: null,
        suggestions: [],  // Store autocomplete suggestions
        mzValues: [],
        retentionTimes: [],
        molecularWeights: [],
        ChemicalFormulas: [],
        ms2Values: [],
        ReferenceIons: [],
        areas: [],
        Count: 0,
        CompoundNames: [],
        CompoundFormulas: [],
        savedSearches: [],
    },
    reducers: {
        clearSearchResults: (state) => {
            state.fileNames = [];
            state.compound = "";
            state.downloadLink = "";
            state.error = null;
            // state.suggestions = []; // Keep suggestions, they are not part of search Results
            state.mzValues = [];
            state.retentionTimes = [];
            state.molecularWeights = [];
            state.ChemicalFormulas = [];
            state.ms2Values = [];
            state.ReferenceIons = [];
            state.areas = [];
            state.Count = 0;
            state.CompoundNames = [];
            state.CompoundFormulas = [];
            // Do not clear savedSearches here, only current search results
        },
        saveCurrentSearch: (state, action) => { 
            const { compound, graphData } = action.payload;
            state.savedSearches.push({compound, graphData});
        },
        clearSavedSearches: (state) => {
            state.savedSearches = [];
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSearchResults.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.fileNames = [];
                state.mzValues = [];
                state.retentionTimes = [];
                state.molecularWeights = [];
                state.ChemicalFormulas = [];
                state.ms2Values = [];
                state.ReferenceIons = [];
                state.areas = [];
                state.compound = "";
                state.downloadLink = "";
                state.Count = 0;
                state.CompoundNames = [];
                state.CompoundFormulas = [];
            })
            .addCase(fetchSearchResults.fulfilled, (state, action) => {
                state.loading = false;
                state.fileNames = action.payload.fileNames || [];
                state.mzValues = action.payload.mzValues || [];
                state.retentionTimes = action.payload.retentionTimes || [];
                state.molecularWeights = action.payload.molecularWeights || [];
                state.ChemicalFormulas = action.payload.ChemicalFormulas || [];
                state.ms2Values = action.payload.ms2Values || [];
                state.ReferenceIons = action.payload.ReferenceIons || [];
                state.areas = action.payload.areas || [];
                state.compound = action.payload.Compound || "";
                state.downloadLink = action.payload.file || "";
                state.Count = action.payload.Count || 0;
                state.error = null;  // Clear error on successful fetch
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
export const { clearSearchResults, saveCurrentSearch, clearSavedSearches } = searchSlice.actions;
export default searchSlice.reducer;
