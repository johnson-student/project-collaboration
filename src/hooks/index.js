import { useDispatch, useSelector } from "react-redux";
import { toggleDarkMode, toggleSidebar, selectDarkMode, selectSidebarOpen } from "../features/ui/uiSlice.js";
import { useEffect } from "react";

export const useDarkMode = () => {
  const dispatch = useDispatch();
  const darkMode = useSelector(selectDarkMode);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return { darkMode, toggle: () => dispatch(toggleDarkMode()) };
};

export const useSidebar = () => {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector(selectSidebarOpen);
  return { sidebarOpen, toggle: () => dispatch(toggleSidebar()) };
};

export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
};
