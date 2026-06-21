import { createSlice } from "@reduxjs/toolkit";

// Persist dark mode preference in localStorage
const storedDark = localStorage.getItem("darkMode");
const initialDark = storedDark !== null ? storedDark === "true" : true;

// Apply dark class immediately on load (before React mounts)
if (initialDark) {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    sidebarOpen: true,
    darkMode: initialDark,
    activeModal: null,
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem("darkMode", String(state.darkMode));
      if (state.darkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    },
    setDarkMode: (state, action) => {
      state.darkMode = action.payload;
      localStorage.setItem("darkMode", String(action.payload));
      if (action.payload) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    },
    openModal: (state, action) => {
      state.activeModal = action.payload;
    },
    closeModal: (state) => {
      state.activeModal = null;
    },
  },
});

export const { toggleSidebar, setSidebarOpen, toggleDarkMode, setDarkMode, openModal, closeModal } =
  uiSlice.actions;
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectDarkMode = (state) => state.ui.darkMode;
export const selectActiveModal = (state) => state.ui.activeModal;
export default uiSlice.reducer;
