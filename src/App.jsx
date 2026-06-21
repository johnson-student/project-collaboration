import AppRouter from "./routes";
import { ToastProvider } from "./components/common/Toast";
import "./components/common/modal.css";

export default function App() {
  return (
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  );
}
