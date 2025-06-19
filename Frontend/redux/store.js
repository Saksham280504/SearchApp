import { configureStore } from "@reduxjs/toolkit";
import searchReducer from "./searchSlice"; // Ensure the correct path

const store = configureStore({
  reducer: {
    search: searchReducer,
  },
});

export default store; // ✅ Make sure store is exported correctly
